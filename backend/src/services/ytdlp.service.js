const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const { BIN_DIR, BACKEND_DIR } = require("../config/paths");

const IS_WIN = process.platform === "win32";

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function localBinPath(baseName) {
  const fileName = IS_WIN ? `${baseName}.exe` : baseName;
  return path.join(BIN_DIR, fileName);
}

function resolveYtDlpCommandCandidates() {
  const local = localBinPath("yt-dlp");
  return [
    process.env.YTDLP_PATH ? { cmd: process.env.YTDLP_PATH, argsPrefix: [] } : null,
    fs.existsSync(local) ? { cmd: local, argsPrefix: [] } : null,
    { cmd: "/usr/bin/yt-dlp", argsPrefix: [] },
    { cmd: "/usr/local/bin/yt-dlp", argsPrefix: [] },
    { cmd: "yt-dlp", argsPrefix: [] },
    { cmd: "python3", argsPrefix: ["-m", "yt_dlp"] },
    { cmd: "python", argsPrefix: ["-m", "yt_dlp"] },
  ].filter(Boolean);
}

function resolveFfmpegLocation() {
  if (process.env.FFMPEG_PATH) return process.env.FFMPEG_PATH;
  const local = localBinPath("ffmpeg");
  if (fs.existsSync(local)) return local;
  return "ffmpeg";
}

function qualityToHeight(videoQuality) {
  if (!videoQuality || videoQuality === "best") return null;
  const match = String(videoQuality).trim().match(/^(\d+)/);
  return match ? Number(match[1]) : null;
}

function safeFilename(name, fallback) {
  if (!name || typeof name !== "string") return fallback;
  return name.replace(/[^\w.\-()]/g, "_");
}

async function createCookiesFileIfProvided(tmpDir) {
  const cookiesB64 = process.env.YTDLP_COOKIES_B64;
  if (!cookiesB64) return null;

  const cookiesPath = path.join(tmpDir, "cookies.txt");
  const cookiesText = Buffer.from(cookiesB64, "base64").toString("utf8");
  await fsp.writeFile(cookiesPath, cookiesText, "utf8");
  return cookiesPath;
}

function runCommand(cmd, args, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: BACKEND_DIR,
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

async function runWithCandidates(candidates, args, timeoutMs) {
  let lastError = null;

  for (const candidate of candidates) {
    const fullArgs = [...candidate.argsPrefix, ...args];
    try {
      return await runCommand(candidate.cmd, fullArgs, timeoutMs);
    } catch (error) {
      lastError = error;
      if (error && error.code === "ENOENT") continue;
      throw error;
    }
  }

  if (lastError) throw lastError;
  throw new Error("No se encontro un ejecutable para yt-dlp");
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

async function downloadMedia(payload) {
  const {
    url,
    format = "video",
    audio_quality: audioQuality = "max",
    video_quality: videoQuality = "best",
    video_fps: videoFps = "source",
  } = payload || {};

  if (!isHttpUrl(url)) {
    const err = new Error("URL invalida");
    err.status = 400;
    throw err;
  }

  if (!["video", "mp3"].includes(format)) {
    const err = new Error("Formato invalido");
    err.status = 400;
    throw err;
  }

  const ytdlpCandidates = resolveYtDlpCommandCandidates();
  const ffmpegLocation = resolveFfmpegLocation();
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "video-downloader-"));
  const outputTemplate = path.join(tmpDir, "%(title).80s-%(id)s.%(ext)s");
  const cookiesPath = await createCookiesFileIfProvided(tmpDir);

  const args = [
    "--no-playlist",
    "--restrict-filenames",
    "--extractor-args",
    "youtube:player_client=android,web",
    "--ffmpeg-location",
    ffmpegLocation,
    "-o",
    outputTemplate,
  ];
  if (cookiesPath) {
    args.push("--cookies", cookiesPath);
  }

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
    await runWithCandidates(ytdlpCandidates, args, 10 * 60 * 1000);
    const mediaFile = await findNewestFile(tmpDir);
    if (!mediaFile) {
      const err = new Error("No se genero ningun archivo");
      err.status = 400;
      throw err;
    }

    return {
      tmpDir,
      filePath: mediaFile,
      fileName: safeFilename(path.basename(mediaFile), format === "mp3" ? "audio.mp3" : "video.mp4"),
    };
  } catch (error) {
    await fsp.rm(tmpDir, { recursive: true, force: true });
    if (error && error.code === "ENOENT") {
      const err = new Error("yt-dlp no esta instalado en el servidor");
      err.status = 400;
      throw err;
    }
    if (error && /sign in to confirm you.?re not a bot/i.test(String(error.message || ""))) {
      const err = new Error("YouTube requiere cookies de sesion para este video");
      err.status = 403;
      throw err;
    }
    throw error;
  }
}

async function cleanupDir(dirPath) {
  if (!dirPath) return;
  await fsp.rm(dirPath, { recursive: true, force: true });
}

module.exports = {
  downloadMedia,
  cleanupDir,
};
