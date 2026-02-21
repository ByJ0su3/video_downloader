import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { DOWNLOADS_DIR } from "../config/paths.js";

const JOB_TTL_MS = Number(process.env.JOB_TTL_MS || 30 * 60 * 1000);
const JOB_TIMEOUT_MS = Number(process.env.DOWNLOAD_TIMEOUT_MS || 8 * 60 * 1000);
const MAX_CONCURRENT_JOBS = Math.min(2, Math.max(1, Number(process.env.MAX_CONCURRENT_JOBS || 1)));
const MAX_QUEUE = Math.max(1, Number(process.env.MAX_QUEUE || 20));
const MAX_LOG_LINES = 250;
const IS_RAILWAY = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_PROJECT_ID);
const ALLOW_COOKIES_FROM_BROWSER = String(process.env.ALLOW_COOKIES_FROM_BROWSER || "false").toLowerCase() === "true";

const jobs = new Map();
const queue = [];
let activeJobs = 0;

const PLATFORM_RULES = {
  youtube: {
    hosts: ["youtube.com", "www.youtube.com", "m.youtube.com", "music.youtube.com", "youtu.be"],
    referer: "https://www.youtube.com/",
    extractorArgs: ["youtube:player_client=web,web_creator,tv_embedded"],
  },
  twitter: {
    hosts: ["twitter.com", "www.twitter.com", "x.com", "www.x.com"],
    referer: "https://x.com/",
  },
  instagram: {
    hosts: ["instagram.com", "www.instagram.com"],
    referer: "https://www.instagram.com/",
  },
  tiktok: {
    hosts: ["tiktok.com", "www.tiktok.com", "m.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"],
    referer: "https://www.tiktok.com/",
  },
  twitch: {
    hosts: ["twitch.tv", "www.twitch.tv", "clips.twitch.tv"],
    referer: "https://www.twitch.tv/",
  },
};

const PLATFORM_LABELS = {
  youtube: "YouTube",
  twitter: "Twitter/X",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitch: "Twitch",
};

function nowIso() {
  return new Date().toISOString();
}

function createHttpError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function isAllowedHost(hostname, candidate) {
  return hostname === candidate || hostname.endsWith(`.${candidate}`);
}

function detectPlatform(urlValue) {
  const parsed = new URL(urlValue);
  const hostname = parsed.hostname.toLowerCase();
  for (const [platform, rule] of Object.entries(PLATFORM_RULES)) {
    if (rule.hosts.some((host) => isAllowedHost(hostname, host))) {
      return platform;
    }
  }
  return null;
}

function validateUrlAndPlatform(urlValue) {
  let parsed;
  try {
    parsed = new URL(String(urlValue || "").trim());
  } catch (_error) {
    throw createHttpError("URL invalida", 400);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw createHttpError("Solo se permiten URLs http/https", 400);
  }
  const platform = detectPlatform(parsed.toString());
  if (!platform) {
    throw createHttpError("Dominio no permitido. Plataformas: YouTube, Twitter/X, Instagram, TikTok, Twitch", 400);
  }
  return { normalizedUrl: parsed.toString(), platform };
}

function normalizeType(type) {
  const value = String(type || "video").toLowerCase();
  if (value !== "audio" && value !== "video") {
    throw createHttpError('type invalido. Usa "audio" o "video"', 400);
  }
  return value;
}

async function ensureDir(dirPath) {
  await fsp.mkdir(dirPath, { recursive: true });
}

function appendLog(job, line) {
  if (!line) return;
  job.logs.push(line);
  if (job.logs.length > MAX_LOG_LINES) {
    job.logs = job.logs.slice(job.logs.length - MAX_LOG_LINES);
  }
}

function publicJob(job) {
  return {
    ok: job.status !== "error",
    id: job.id,
    status: job.status,
    fileName: job.fileName || undefined,
    downloadUrl: job.downloadUrl || undefined,
    progress: job.progress || undefined,
    error: job.error || undefined,
  };
}

function resolveYtDlpCommand() {
  const customPath = process.env.YTDLP_PATH;
  if (customPath) return { cmd: customPath, prefixArgs: [] };
  return { cmd: "yt-dlp", prefixArgs: [] };
}

function resolveFfmpegArgs() {
  const ffmpegPath = process.env.FFMPEG_PATH;
  if (!ffmpegPath) return [];
  return ["--ffmpeg-location", ffmpegPath];
}

function getCommonHeaders(platform, cookiesMode) {
  if (platform === "youtube" && cookiesMode !== "none") {
    return [];
  }
  const rule = PLATFORM_RULES[platform];
  const base = [
    "--add-header",
    "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
    "--add-header",
    "Accept-Language:en-US,en;q=0.9",
  ];
  if (rule?.referer) {
    base.push("--add-header", `Referer:${rule.referer}`);
  }
  return base;
}

function getPlatformExtractorArgs(platform) {
  const extractorArgs = PLATFORM_RULES[platform]?.extractorArgs || [];
  if (!extractorArgs.length) return [];
  const args = [];
  for (const value of extractorArgs) {
    args.push("--extractor-args", value);
  }
  return args;
}

function parseProgressLine(line) {
  const progressMatch = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/i);
  if (!progressMatch) return null;
  return Math.min(99, Math.max(1, Math.round(Number(progressMatch[1]))));
}

function normalizeYtDlpError(platform, logsText) {
  const platformLabel = PLATFORM_LABELS[platform] || "Esta plataforma";
  const log = String(logsText || "").toLowerCase();

  if (/login required|sign in|use --cookies|authentication|private|this post is unavailable/i.test(log)) {
    return `${platformLabel} requiere login/cookies para este contenido. Usa modo upload con cookies.txt valido.`;
  }
  if (/no video could be found in this tweet/i.test(log)) {
    return "Ese tweet no contiene video descargable.";
  }
  if (/requested format is not available/i.test(log)) {
    return "El formato solicitado no esta disponible para este contenido.";
  }
  if (/unsupported url|unable to extract/i.test(log)) {
    return "No se pudo extraer el contenido con la configuracion actual de yt-dlp.";
  }
  if (/http error 429|too many requests|rate limit/i.test(log)) {
    return "Rate limit detectado por la plataforma. Intenta de nuevo mas tarde.";
  }
  if (/drm|encrypted|protected/i.test(log)) {
    return "El contenido parece protegido con DRM/cifrado. yt-dlp no puede descargarlo.";
  }
  if (/ffmpeg|ffprobe/i.test(log)) {
    return "ffmpeg/ffprobe no esta disponible o no se encontro en PATH.";
  }

  return "No se pudo completar la descarga.";
}

async function validateCookiesFile(cookiesPath) {
  const stat = await fsp.stat(cookiesPath);
  if (!stat.isFile()) throw createHttpError("cookiesFile invalido", 400);
  if (stat.size < 32 || stat.size > 5 * 1024 * 1024) {
    throw createHttpError("cookies.txt invalido o muy grande (max 5MB)", 400);
  }
  const text = await fsp.readFile(cookiesPath, "utf8");
  const head = text.split(/\r?\n/).slice(0, 5).join("\n");
  if (!/netscape http cookie file/i.test(head) && !/\t(TRUE|FALSE)\t/i.test(head)) {
    throw createHttpError("El archivo debe estar en formato Netscape cookies.txt", 400);
  }
}

function buildCookiesArgs(job) {
  const mode = job.payload.cookiesMode;
  if (mode === "none") return [];

  if (mode === "upload") {
    if (!job.payload.cookiesPath) {
      throw createHttpError("cookiesMode=upload requiere cookiesFile", 400);
    }
    return ["--cookies", job.payload.cookiesPath];
  }

  if (mode === "browser") {
    if (IS_RAILWAY) {
      throw createHttpError("cookies-from-browser no funciona en Railway. Usa cookies.txt subido por el usuario.", 400);
    }
    if (!ALLOW_COOKIES_FROM_BROWSER) {
      throw createHttpError("cookies-from-browser esta deshabilitado por configuracion.", 400);
    }
    const browser = String(job.payload.cookiesBrowser || "chrome").trim();
    const profile = String(job.payload.cookiesBrowserProfile || "").trim();
    const value = profile ? `${browser}:${profile}` : browser;
    return ["--cookies-from-browser", value];
  }

  throw createHttpError('cookiesMode invalido. Usa "none", "upload" o "browser"', 400);
}

function scoreOutputFile(filePath, type) {
  const ext = path.extname(filePath).toLowerCase();
  if (type === "audio") {
    if (ext === ".mp3") return 100;
    if (ext === ".m4a" || ext === ".aac" || ext === ".opus" || ext === ".webm") return 60;
    return 10;
  }

  if (ext === ".mp4") return 100;
  if (ext === ".mkv" || ext === ".webm" || ext === ".mov") return 70;
  if (ext === ".m4a" || ext === ".mp3" || ext === ".aac" || ext === ".opus") return 5;
  return 20;
}

async function readProducedFile(tempDir, type) {
  const entries = await fsp.readdir(tempDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const full = path.join(tempDir, entry.name);
    if (full.endsWith(".part") || full.endsWith(".ytdl")) continue;
    files.push(full);
  }
  if (!files.length) return null;
  const stats = await Promise.all(files.map((file) => fsp.stat(file)));
  let idx = 0;
  let bestScore = scoreOutputFile(files[0], type);
  for (let i = 1; i < files.length; i += 1) {
    const score = scoreOutputFile(files[i], type);
    if (score > bestScore) {
      idx = i;
      bestScore = score;
      continue;
    }
    if (score === bestScore && stats[i].mtimeMs > stats[idx].mtimeMs) {
      idx = i;
    }
  }
  return files[idx];
}

function buildYtDlpArgs(job) {
  const { url, platform, type, playlist, cookiesMode } = job.payload;
  const outputTemplate = path.join(job.tempDir, "%(title).180B.%(ext)s");

  const args = [
    "--newline",
    "--progress",
    "--no-warnings",
    "--retries",
    "6",
    "--fragment-retries",
    "6",
    ...resolveFfmpegArgs(),
    ...getCommonHeaders(platform, cookiesMode),
    ...getPlatformExtractorArgs(platform),
    ...(playlist ? [] : ["--no-playlist"]),
    "-o",
    outputTemplate,
  ];

  args.push(...buildCookiesArgs(job));
  return { baseArgs: args, url, type };
}

function stripExtractorArgs(args) {
  const out = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--extractor-args") {
      i += 1;
      continue;
    }
    out.push(args[i]);
  }
  return out;
}

function shouldSkipRetry(logsText) {
  const text = String(logsText || "").toLowerCase();
  return /login required|sign in|private|drm|cookies|no video could be found in this tweet/i.test(text);
}

function spawnYtDlp(job, args) {
  return new Promise((resolve, reject) => {
    const { cmd, prefixArgs } = resolveYtDlpCommand();
    const fullArgs = [...prefixArgs, ...args];

    const child = spawn(cmd, fullArgs, {
      cwd: process.cwd(),
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stderrBuffer = "";
    let stdoutBuffer = "";
    const timeout = setTimeout(() => {
      child.kill("SIGKILL");
      reject(createHttpError("Tiempo de descarga agotado", 504));
    }, JOB_TIMEOUT_MS);

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      stdoutBuffer += text;
      const parts = stdoutBuffer.split(/\r?\n/);
      stdoutBuffer = parts.pop() || "";
      for (const line of parts) {
        appendLog(job, `[stdout] ${line}`);
      }
    });

    child.stderr.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      stderrBuffer += text;
      const parts = stderrBuffer.split(/\r?\n/);
      stderrBuffer = parts.pop() || "";
      for (const line of parts) {
        appendLog(job, `[stderr] ${line}`);
        const progress = parseProgressLine(line);
        if (progress != null) {
          job.progress = progress;
          job.status = "running";
        }
      }
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      reject(createHttpError(`Error iniciando yt-dlp: ${error.message}`, 500));
    });

    child.on("close", (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ ok: true });
        return;
      }
      const logsText = job.logs.join("\n");
      reject(createHttpError(normalizeYtDlpError(job.payload.platform, logsText), 400));
    });
  });
}

async function runDownloadWithFallbacks(job) {
  const { baseArgs, url, type } = buildYtDlpArgs(job);
  const attempts = [];

  if (type === "video") {
    attempts.push([...baseArgs, "-f", "bv*+ba/b", "--merge-output-format", "mp4", url]);
    attempts.push([...baseArgs, "-f", "b", "--remux-video", "mp4", url]);
    attempts.push([...baseArgs, "-f", "bestvideo*+bestaudio/best", "--merge-output-format", "mp4", url]);
    if (job.payload.platform === "youtube") {
      const noExtractorArgs = stripExtractorArgs(baseArgs);
      attempts.push([...noExtractorArgs, "-f", "best", "--remux-video", "mp4", url]);
      attempts.push([...noExtractorArgs, "-f", "bv*+ba/best", "--merge-output-format", "mp4", url]);
      attempts.push([...noExtractorArgs, "--merge-output-format", "mp4", url]);
    }
  } else {
    attempts.push([...baseArgs, "-x", "--audio-format", "mp3", "--audio-quality", "0", url]);
  }

  let lastError = null;
  for (let i = 0; i < attempts.length; i += 1) {
    try {
      appendLog(job, `[attempt] ${i + 1}/${attempts.length}`);
      await spawnYtDlp(job, attempts[i]);
      return;
    } catch (error) {
      lastError = error;
      const logsText = job.logs.join("\n");
      if (shouldSkipRetry(logsText)) {
        throw error;
      }
    }
  }

  if (lastError) throw lastError;
  throw createHttpError("No se pudo completar la descarga.", 400);
}

async function cleanupJobFiles(job) {
  try {
    if (job.payload.cookiesPath) {
      await fsp.rm(job.payload.cookiesPath, { force: true });
    }
    if (job.tempDir) {
      await fsp.rm(job.tempDir, { recursive: true, force: true });
    }
  } catch (_error) {
    // no-op
  }
}

async function runJob(job) {
  try {
    job.status = "running";
    job.progress = 1;

    await validateCookiesFileIfNeeded(job);
    await runDownloadWithFallbacks(job);

    const producedFile = await readProducedFile(job.tempDir, job.payload.type);
    if (!producedFile) {
      throw createHttpError("yt-dlp finalizo sin generar archivo.", 400);
    }

    job.filePath = producedFile;
    job.fileName = path.basename(producedFile);
    job.downloadUrl = `/api/download/${job.id}/file`;
    job.status = "done";
    job.progress = 100;
    job.updatedAt = nowIso();
  } catch (error) {
    job.status = "error";
    job.error = error.message || "No se pudo completar la descarga.";
    job.updatedAt = nowIso();
    await cleanupJobFiles(job);
  } finally {
    activeJobs -= 1;
    runQueue();
  }
}

async function validateCookiesFileIfNeeded(job) {
  if (job.payload.cookiesMode !== "upload") return;
  await validateCookiesFile(job.payload.cookiesPath);
}

function runQueue() {
  while (activeJobs < MAX_CONCURRENT_JOBS && queue.length > 0) {
    const job = queue.shift();
    activeJobs += 1;
    void runJob(job);
  }
}

function enqueueDownloadJob(payload) {
  if (queue.length + activeJobs >= MAX_QUEUE) {
    throw createHttpError("Servidor ocupado. Intenta de nuevo en unos minutos.", 429);
  }

  const { normalizedUrl, platform } = validateUrlAndPlatform(payload.url);
  const id = crypto.randomUUID();
  const type = normalizeType(payload.type);
  const cookiesMode = String(payload.cookiesMode || "none").toLowerCase();
  const playlist = String(payload.playlist || "false").toLowerCase() === "true" || payload.playlist === true;

  const job = {
    id,
    status: "queued",
    progress: 0,
    error: null,
    filePath: null,
    fileName: null,
    downloadUrl: null,
    logs: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
    tempDir: path.join(DOWNLOADS_DIR, id),
    payload: {
      url: normalizedUrl,
      platform,
      type,
      playlist,
      cookiesMode,
      cookiesPath: payload.cookiesPath || null,
      cookiesBrowser: payload.cookiesBrowser || null,
      cookiesBrowserProfile: payload.cookiesBrowserProfile || null,
    },
  };

  jobs.set(job.id, job);
  queue.push(job);
  void ensureDir(job.tempDir).then(runQueue).catch(() => {
    job.status = "error";
    job.error = "No se pudo preparar el directorio temporal.";
  });

  return publicJob(job);
}

function getJobById(id) {
  return jobs.get(id) || null;
}

function getDownloadFileInfo(id) {
  const job = getJobById(id);
  if (!job) return null;
  if (job.status !== "done" || !job.filePath || !job.fileName) {
    return { error: "Archivo aun no disponible", status: 409 };
  }
  return {
    filePath: job.filePath,
    fileName: job.fileName,
    onSent: async () => {
      await cleanupJobFiles(job);
      jobs.delete(job.id);
    },
  };
}

function getPublicJob(id) {
  const job = getJobById(id);
  if (!job) return null;
  return publicJob(job);
}

function startJobsSweeper() {
  setInterval(async () => {
    const threshold = Date.now() - JOB_TTL_MS;
    const items = Array.from(jobs.values());
    for (const job of items) {
      const updated = new Date(job.updatedAt || job.createdAt).getTime();
      if (Number.isNaN(updated) || updated > threshold) continue;
      await cleanupJobFiles(job);
      jobs.delete(job.id);
    }
  }, 60 * 1000).unref();
}

export {
  enqueueDownloadJob,
  getPublicJob,
  getDownloadFileInfo,
  startJobsSweeper,
};
