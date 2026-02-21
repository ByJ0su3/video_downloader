from fastapi import FastAPI, APIRouter, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
import shutil
import uuid
import re
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

BIN_DIR = ROOT_DIR / "bin"
YTDLP_PATH = BIN_DIR / "yt-dlp.exe"
FFMPEG_PATH = BIN_DIR / "ffmpeg.exe"
DOWNLOADS_DIR = ROOT_DIR / "tmp_downloads"
DOWNLOADS_DIR.mkdir(parents=True, exist_ok=True)

# MongoDB connection (optional for downloader-only local runs)
mongo_url = os.environ.get("MONGO_URL")
db_name = os.environ.get("DB_NAME")
client = AsyncIOMotorClient(mongo_url) if mongo_url and db_name else None
db = client[db_name] if client and db_name else None

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")  # Ignore MongoDB's _id field
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class DownloadRequest(BaseModel):
    url: str
    format: Literal["video", "mp3"]
    audio_quality: Optional[str] = "max"
    video_quality: Optional[str] = "best"
    video_fps: Optional[str] = "source"


def ensure_binaries() -> None:
    if not YTDLP_PATH.exists():
        raise HTTPException(status_code=500, detail="No se encontro backend/bin/yt-dlp.exe")
    if not FFMPEG_PATH.exists():
        raise HTTPException(status_code=500, detail="No se encontro backend/bin/ffmpeg.exe")


def quality_to_height(video_quality: str) -> Optional[int]:
    if not video_quality or video_quality == "best":
        return None
    match = re.match(r"^(\d+)", video_quality.strip())
    if not match:
        return None
    return int(match.group(1))


def cleanup_dir(path: Path) -> None:
    try:
        shutil.rmtree(path, ignore_errors=True)
    except Exception as exc:  # pragma: no cover
        logger.warning("No se pudo limpiar %s: %s", path, exc)


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB no configurado")
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    # Convert to dict and serialize datetime to ISO string for MongoDB
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    if db is None:
        raise HTTPException(status_code=503, detail="MongoDB no configurado")
    # Exclude MongoDB's _id field from the query results
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    # Convert ISO string timestamps back to datetime objects
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


@api_router.post("/download")
async def download_media(payload: DownloadRequest, background_tasks: BackgroundTasks):
    ensure_binaries()

    url = payload.url.strip()
    if not url.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="URL invalida")

    job_dir = DOWNLOADS_DIR / str(uuid.uuid4())
    job_dir.mkdir(parents=True, exist_ok=True)
    output_template = str(job_dir / "%(title).80s-%(id)s.%(ext)s")

    command = [
        str(YTDLP_PATH),
        "--no-playlist",
        "--restrict-filenames",
        "--ffmpeg-location",
        str(BIN_DIR),
        "-o",
        output_template,
    ]

    if payload.format == "mp3":
        command.extend(["-f", "bestaudio/best", "-x", "--audio-format", "mp3"])
        if payload.audio_quality and payload.audio_quality != "max" and payload.audio_quality.isdigit():
            command.extend(["--postprocessor-args", f"ffmpeg:-b:a {payload.audio_quality}k"])
    else:
        height = quality_to_height(payload.video_quality or "best")
        fps = int(payload.video_fps) if payload.video_fps and payload.video_fps.isdigit() else None
        filters = []
        if height:
            filters.append(f"height<={height}")
        if fps:
            filters.append(f"fps<={fps}")
        selector_filter = "".join(f"[{item}]" for item in filters)
        format_selector = f"bestvideo{selector_filter}+bestaudio/best{selector_filter}"
        command.extend(["-f", format_selector, "--merge-output-format", "mp4"])

    command.append(url)

    process = await asyncio.create_subprocess_exec(
        *command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=str(ROOT_DIR),
    )

    try:
        stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=600)
    except asyncio.TimeoutError:
        process.kill()
        cleanup_dir(job_dir)
        raise HTTPException(status_code=504, detail="Tiempo de descarga agotado")

    if process.returncode != 0:
        cleanup_dir(job_dir)
        error_output = (stderr or stdout).decode("utf-8", errors="ignore").strip().splitlines()
        detail = error_output[-1] if error_output else "No se pudo descargar el archivo"
        raise HTTPException(status_code=400, detail=detail)

    files = [p for p in job_dir.iterdir() if p.is_file() and p.suffix not in {".part", ".ytdl"}]
    if not files:
        cleanup_dir(job_dir)
        raise HTTPException(status_code=404, detail="No se genero ningun archivo")

    media_file = max(files, key=lambda p: p.stat().st_mtime)
    background_tasks.add_task(cleanup_dir, job_dir)
    return FileResponse(
        media_file,
        filename=media_file.name,
        media_type="application/octet-stream",
        background=background_tasks,
    )

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    if client is not None:
        client.close()
