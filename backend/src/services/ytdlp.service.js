const fs = require("fs");
const fsp = require("fs/promises");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");
const archiver = require("archiver");
const { BIN_DIR, BACKEND_DIR } = require("../config/paths");

const IS_WIN = process.platform === "win32";

function isHttpUrl(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value.trim());
}

function detectPlatform(url) {
  const value = String(url || "").toLowerCase();
  if (/youtube\.com|youtu\.be/.test(value)) return "youtube";
  if (/instagram\.com/.test(value)) return "instagram";
  if (/tiktok\.com/.test(value)) return "tiktok";
  if (/twitch\.tv/.test(value)) return "twitch";
  if (/twitter\.com|x\.com/.test(value)) return "twitter";
  return "generic";
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

function isFormatUnavailableError(message) {
  return /requested format is not available/i.test(String(message || ""));
}

function safeFilename(name, fallback) {
  if (!name || typeof name !== "string") return fallback;
  // Preserve readable title while removing invalid chars for client filesystems.
  return name.replace(/[\\/:*?"<>|]/g, " ").replace(/\s+/g, " ").trim() || fallback;
}

function getPlatformArgs(platform) {
  const args = [
    "--add-header",
    "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "--add-header",
    "Accept-Language:en-US,en;q=0.9",
  ];

  if (platform === "youtube") {
    args.push("--extractor-args", "youtube:player_client=web,web_creator,tv_embedded");
  }

  return args;
}

async function createCookiesFileIfProvided(tmpDir) {
  const cookiesB64 = process.env.YTDLP_COOKIES_B64;
  if (!cookiesB64) return null;

  const cookiesPath = path.join(tmpDir, "cookies.txt");
  const cookiesText = Buffer.from(cookiesB64, "base64").toString("utf8");
  await fsp.writeFile(cookiesPath, cookiesText, "utf8");
  return cookiesPath;
}

function parsePrintedTitle(stdout) {
  const lines = String(stdout || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) return null;
  return lines[lines.length - 1];
}

function runCommand(cmd, args, timeoutMs, onProgress) {
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
    let stderrBuffer = "";
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      stderr += text;
      stderrBuffer += text;
      const lines = stderrBuffer.split(/\r?\n/);
      stderrBuffer = lines.pop() || "";
      for (const line of lines) {
        const match = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/i);
        if (match && onProgress) {
          const percent = Math.min(99, Math.max(1, Math.round(Number(match[1]))));
          onProgress({
            status: "running",
            stage: "downloading",
            progress: percent,
          });
        }
      }
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

async function runWithCandidates(candidates, args, timeoutMs, onProgress) {
  let lastError = null;

  for (const candidate of candidates) {
    const fullArgs = [...candidate.argsPrefix, ...args];
    try {
      return await runCommand(candidate.cmd, fullArgs, timeoutMs, onProgress);
    } catch (error) {
      lastError = error;
      if (error && error.code === "ENOENT") continue;
      throw error;
    }
  }

  if (lastError) throw lastError;
  throw new Error("No se encontro un ejecutable para yt-dlp");
}

async function fetchTitle(candidates, baseArgs, url, timeoutMs) {
  try {
    const result = await runWithCandidates(
      candidates,
      [...baseArgs, "--skip-download", "--print", "%(title)s", url],
      timeoutMs,
      null,
    );
    return parsePrintedTitle(result.stdout);
  } catch (_error) {
    return null;
  }
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

async function listDownloadedFiles(dirPath) {
  const entries = await fsp.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.join(dirPath, entry.name))
    .filter((file) => !file.endsWith(".part") && !file.endsWith(".ytdl"));
}

async function createZipArchive(targetPath, files) {
  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(targetPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);

    archive.pipe(output);
    for (const file of files) {
      archive.file(file, { name: path.basename(file) });
    }
    archive.finalize();
  });
}

async function downloadMedia(payload, onProgress) {
  const {
    url,
    format = "video",
    platform: requestedPlatform = "auto",
    audio_quality: audioQuality = "max",
    video_quality: videoQuality = "best",
  } = payload || {};

  if (!isHttpUrl(url)) {
    const err = new Error("URL invalida");
    err.status = 400;
    throw err;
  }

  if (!["video", "mp3", "image"].includes(format)) {
    const err = new Error("Formato invalido");
    err.status = 400;
    throw err;
  }
  const detectedPlatform = detectPlatform(url);
  const effectivePlatform = requestedPlatform && requestedPlatform !== "auto" ? requestedPlatform : detectedPlatform;

  if (format === "image" && effectivePlatform !== "instagram") {
    const err = new Error("El formato imagen solo esta disponible para Instagram");
    err.status = 400;
    throw err;
  }

  const ytdlpCandidates = resolveYtDlpCommandCandidates();
  const ffmpegLocation = resolveFfmpegLocation();
  const tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), "video-downloader-"));
  const outputTemplate = path.join(tmpDir, "%(title).180B.%(ext)s");
  const cookiesPath = await createCookiesFileIfProvided(tmpDir);
  const platformArgs = getPlatformArgs(detectedPlatform);

  const args = [
    "--no-playlist",
    "--retries",
    "10",
    "--fragment-retries",
    "10",
    "--extractor-retries",
    "5",
    "--retry-sleep",
    "http:2",
    ...platformArgs,
    "--ffmpeg-location",
    ffmpegLocation,
    "-o",
    outputTemplate,
  ];
  if (cookiesPath) {
    args.push("--cookies", cookiesPath);
  }

  const fetchedTitle = await fetchTitle(ytdlpCandidates, args, url.trim(), 60 * 1000);

  if (format === "mp3") {
    args.push("-f", "bestaudio/best", "-x", "--audio-format", "mp3");
    const targetBitrate = /^\d+$/.test(String(audioQuality)) && audioQuality !== "max" ? String(audioQuality) : "320";
    args.push("--postprocessor-args", `ffmpeg:-b:a ${targetBitrate}k`);
    args.push("--audio-quality", "0");
  } else if (format === "video") {
    const height = qualityToHeight(videoQuality);
    // Try strict selector first, then broader fallbacks if unavailable.
    const selectors = [];
    if (height) {
      selectors.push(
        `bestvideo[height<=${height}]+bestaudio/best[height<=${height}][vcodec!=none]`,
      );
    }
    selectors.push("bestvideo+bestaudio/best[vcodec!=none]");
    selectors.push("bv*+ba/b");

    let lastVideoError = null;
    for (const formatSelector of selectors) {
      const videoArgs = [
        ...args,
        "-f",
        formatSelector,
        "-S",
        "res,fps,hdr:12,vcodec:avc",
        "--merge-output-format",
        "mp4",
        "--remux-video",
        "mp4",
        "--recode-video",
        "mp4",
        url.trim(),
      ];
      try {
        if (onProgress) {
          onProgress({
            status: "running",
            stage: "preparing",
            progress: 5,
          });
        }
        await runWithCandidates(ytdlpCandidates, videoArgs, 10 * 60 * 1000, onProgress);
        lastVideoError = null;
        break;
      } catch (error) {
        lastVideoError = error;
        if (!isFormatUnavailableError(error && error.message)) {
          throw error;
        }
      }
    }

    if (lastVideoError) {
      throw lastVideoError;
    }

    if (onProgress) {
      onProgress({
        status: "running",
        stage: "finalizing",
        progress: 99,
      });
    }

    const mediaFile = await findNewestFile(tmpDir);
    if (!mediaFile) {
      const err = new Error("No se genero ningun archivo");
      err.status = 400;
      throw err;
    }
    const expectedExt = ".mp4";
    if (path.extname(mediaFile).toLowerCase() !== expectedExt) {
      const err = new Error(`No se pudo generar ${expectedExt} para esta fuente`);
      err.status = 400;
      throw err;
    }
    const finalTitle = safeFilename(fetchedTitle || path.parse(mediaFile).name, "video");

    return {
      tmpDir,
      filePath: mediaFile,
      fileName: `${finalTitle}.mp4`,
    };
  } else {
    // Image mode: preserve source quality/dimensions with no transcoding.
    try {
      if (onProgress) {
        onProgress({
          status: "running",
          stage: "preparing",
          progress: 5,
        });
      }
      await runWithCandidates(ytdlpCandidates, [...args, url.trim()], 10 * 60 * 1000, onProgress);
      if (onProgress) {
        onProgress({
          status: "running",
          stage: "finalizing",
          progress: 99,
        });
      }
      const imageExts = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp", ".gif", ".heic"]);
      const files = await listDownloadedFiles(tmpDir);
      const imageFiles = files
        .filter((file) => imageExts.has(path.extname(file).toLowerCase()))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

      if (imageFiles.length === 0) {
        const err = new Error("No se genero ninguna imagen");
        err.status = 400;
        throw err;
      }

      const baseTitle = safeFilename(
        fetchedTitle || path.parse(imageFiles[0]).name,
        "imagen",
      );

      if (imageFiles.length === 1) {
        const imageFile = imageFiles[0];
        const ext = path.extname(imageFile).toLowerCase();
        return {
          tmpDir,
          filePath: imageFile,
          fileName: `${baseTitle}${ext}`,
        };
      }

      const zipPath = path.join(tmpDir, `${baseTitle}.zip`);
      await createZipArchive(zipPath, imageFiles);
      return {
        tmpDir,
        filePath: zipPath,
        fileName: `${baseTitle}.zip`,
      };
    } catch (error) {
      await fsp.rm(tmpDir, { recursive: true, force: true });
      throw error;
    }
  }

  try {
    if (onProgress) {
      onProgress({
        status: "running",
        stage: "preparing",
        progress: 5,
      });
    }
    await runWithCandidates(ytdlpCandidates, [...args, url.trim()], 10 * 60 * 1000, onProgress);
    if (onProgress) {
      onProgress({
        status: "running",
        stage: "finalizing",
        progress: 99,
      });
    }
    const mediaFile = await findNewestFile(tmpDir);
    if (!mediaFile) {
      const err = new Error("No se genero ningun archivo");
      err.status = 400;
      throw err;
    }
    const expectedExt = format === "mp3" ? ".mp3" : ".mp4";
    if (path.extname(mediaFile).toLowerCase() !== expectedExt) {
      const err = new Error(`No se pudo generar ${expectedExt} para esta fuente`);
      err.status = 400;
      throw err;
    }

    const finalTitle = safeFilename(
      fetchedTitle || path.parse(mediaFile).name,
      format === "mp3" ? "audio" : "video",
    );
    return {
      tmpDir,
      filePath: mediaFile,
      fileName: `${finalTitle}${expectedExt}`,
    };
  } catch (error) {
    await fsp.rm(tmpDir, { recursive: true, force: true });
    if (error && error.code === "ENOENT") {
      const err = new Error("yt-dlp no esta instalado en el servidor");
      err.status = 400;
      throw err;
    }
    const message = String((error && error.message) || "");
    if (/http error 403: forbidden/i.test(message) && /youtube|youtu\.be/i.test(url)) {
      // Retry once with a different YouTube client strategy before failing.
      const retryArgs = [...args];
      retryArgs.splice(1, 0, "--extractor-args", "youtube:player_client=web,web_creator,tv_embedded");
      try {
        await runWithCandidates(ytdlpCandidates, [...retryArgs, url.trim()], 10 * 60 * 1000, onProgress);
        const retriedFile = await findNewestFile(tmpDir);
        if (retriedFile) {
          const retriedExt = format === "mp3" ? ".mp3" : ".mp4";
          const finalTitle = safeFilename(
            fetchedTitle || path.parse(retriedFile).name,
            format === "mp3" ? "audio" : "video",
          );
          return {
            tmpDir,
            filePath: retriedFile,
            fileName: `${finalTitle}${retriedExt}`,
          };
        }
      } catch (_retryErr) {
        // fall through to the normal error handling below
      }
    }
    if (/sign in to confirm you.?re not a bot/i.test(message)) {
      const err = new Error("YouTube requiere cookies de sesion para este video");
      err.status = 403;
      throw err;
    }
    if (/http error 403: forbidden/i.test(message)) {
      const err = new Error("La plataforma bloqueo el acceso directo a este video (HTTP 403)");
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
