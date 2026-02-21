const express = require("express");
const cors = require("cors");
const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const PORT = Number(process.env.PORT || 8000);
const ROOT_DIR = __dirname;
const BIN_DIR = path.join(ROOT_DIR, "bin");
const IS_WIN = process.platform === "win32";

function splitOrigins(value) {
  if (!value || !value.trim()) return ["*"];
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

const allowedOrigins = splitOrigins(process.env.CORS_ORIGINS);
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Origin no permitido por CORS"));
    },
  }),
);

app.use(express.json({ limit: "1mb" }));

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function localBinPath(baseName) {
  const fileName = IS_WIN ? `${baseName}.exe` : baseName;
  return path.join(BIN_DIR, fileName);
}

function resolveYtDlpCommand() {
  if (process.env.YTDLP_PATH) {
    return { cmd: process.env.YTDLP_PATH, argsPrefix: [] };
  }

  const local = localBinPath("yt-dlp");
  if (fs.existsSync(local)) {
    return { cmd: local, argsPrefix: [] };
  }

  return { cmd: "yt-dlp", argsPrefix: [] };
}

function resolveFfmpegLocation() {
  if (process.env.FFMPEG_PATH) {
    return process.env.FFMPEG_PATH;
  }

  const local = localBinPath("ffmpeg");
  if (fs.existsSync(local)) {
    return local;
  }

  return "ffmpeg";
}

function qualityToHeight(videoQuality) {
  if (!videoQuality || videoQuality === "best") return null;
  const match = String(videoQuality).trim().match(/^(\d+)/);
  return match ? Number(match[1]) : null;
}

function safeFilenameFromDispositionHeader(name, fallback) {
  if (!name || typeof name !== "string") return fallback;
  return name.replace(/[^\w.\-()]/g, "_");
}

function runCommand(cmd, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: ROOT_DIR,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("Tiempo de descarga agotado"));
    }, timeoutMs);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }
      const lines = (stderr || stdout).split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
      reject(new Error(lines[lines.length - 1] || "No se pudo completar la descarga"));
    });
  });
}

async function findNewestFile(dirPath) {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(dirPath, entry.name))
    .filter((file) => !file.endsWith(".part") && !file.endsWith(".ytdl"));
  if (files.length === 0) return null;

  const stats = await Promise.all(files.map((file) => fsp.stat(file)));
  let newest = files[0];
  let newestTime = stats[0].mtimeMs;

  for (let i = 1; i < files.length; i += 1) {
    if (stats[i].mtimeMs > newestTime) {
      newest = files[i];
      newestTime = stats[i].mtimeMs;
    }
  }
  return newest;
}

app.get("/api", (_req, res) => {
  res.json({ message: "Video downloader API OK" });
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post("/api/download", async (req, res) => {
  const {
    url,
    format = "video",
    audio_quality: audioQuality = "max",
    video_quality: videoQuality = "best",
    video_fps: videoFps = "source",
  } = req.body || {};

  if (!isHttpUrl(url)) {
    res.status(400).json({ detail: "URL invalida" });
    return;
  }

  if (!["video", "mp3"].includes(format)) {
    res.status(400).json({ detail: "Formato invalido" });
    return;
  }

  const { cmd: ytdlpCmd, argsPrefix } = resolveYtDlpCommand();
  const ffmpegLocation = resolveFfmpegLocation();
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "video-downloader-"));
  const outputTemplate = path.join(tmpDir, "%(title).80s-%(id)s.%(ext)s");

  const args = [
    ...argsPrefix,
    "--no-playlist",
    "--restrict-filenames",
    "--ffmpeg-location",
    ffmpegLocation,
    "-o",
    outputTemplate,
  ];

  if (format === "mp3") {
    args.push("-f", "bestaudio/best", "-x", "--audio-format", "mp3");
    if (/^\d+$/.test(String(audioQuality)) && audioQuality !== "max") {
      args.push("--postprocessor-args", `ffmpeg:-b:a ${audioQuality}k`);
    }
  } else {
    const height = qualityToHeight(videoQuality);
    const fps = /^\d+$/.test(String(videoFps)) ? Number(videoFps) : null;
    const filters = [];
    if (height) filters.push(`height<=${height}`);
    if (fps) filters.push(`fps<=${fps}`);
    const selectorFilter = filters.map((v) => `[${v}]`).join("");
    const formatSelector = `bestvideo${selectorFilter}+bestaudio/best${selectorFilter}`;
    args.push("-f", formatSelector, "--merge-output-format", "mp4");
  }

  args.push(url.trim());

  try {
    await runCommand(ytdlpCmd, args, 10 * 60 * 1000);
    const mediaFile = await findNewestFile(tmpDir);
    if (!mediaFile) {
      throw new Error("No se genero ningun archivo");
    }

    const fallbackName = format === "mp3" ? "audio.mp3" : "video.mp4";
    const fileName = safeFilenameFromDispositionHeader(path.basename(mediaFile), fallbackName);

    res.download(mediaFile, fileName, async (error) => {
      await fsp.rm(tmpDir, { recursive: true, force: true });
      if (error && !res.headersSent) {
        res.status(500).json({ detail: "Error al enviar archivo" });
      }
    });
  } catch (error) {
    await fsp.rm(tmpDir, { recursive: true, force: true });
    const message = error && error.message ? error.message : "No se pudo completar la descarga";
    const status = message.includes("agotado") ? 504 : 400;
    res.status(status).json({ detail: message });
  }
});

app.listen(PORT, () => {
  console.log(`[backend] running on port ${PORT}`);
});
