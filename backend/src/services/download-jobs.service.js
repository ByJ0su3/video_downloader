const crypto = require("crypto");
const { downloadMedia, cleanupDir } = require("./ytdlp.service");

const jobs = new Map();
const JOB_TTL_MS = 30 * 60 * 1000;

function nowIso() {
  return new Date().toISOString();
}

function createJob(payload) {
  const id = crypto.randomUUID();
  const job = {
    id,
    status: "queued",
    progress: 0,
    stage: "queued",
    error: null,
    created_at: nowIso(),
    updated_at: nowIso(),
    payload,
    tmpDir: null,
    filePath: null,
    fileName: null,
  };
  jobs.set(id, job);
  return job;
}

function getJob(jobId) {
  return jobs.get(jobId) || null;
}

function toPublicJob(job) {
  return {
    id: job.id,
    status: job.status,
    progress: job.progress,
    stage: job.stage,
    error: job.error,
    created_at: job.created_at,
    updated_at: job.updated_at,
  };
}

function updateJob(job, patch) {
  Object.assign(job, patch, { updated_at: nowIso() });
}

async function runJob(job) {
  try {
    updateJob(job, { status: "running", stage: "starting", progress: 1 });

    const result = await downloadMedia(job.payload, (progressPatch) => {
      updateJob(job, progressPatch);
    });

    updateJob(job, {
      status: "done",
      stage: "ready",
      progress: 100,
      tmpDir: result.tmpDir,
      filePath: result.filePath,
      fileName: result.fileName,
    });
  } catch (error) {
    const message = error && error.message ? error.message : "No se pudo completar la descarga";
    updateJob(job, {
      status: "error",
      stage: "failed",
      error: message,
    });
  }
}

function enqueueDownload(payload) {
  const job = createJob(payload);
  runJob(job);
  return job;
}

async function consumeJobFile(job) {
  if (job.tmpDir) {
    await cleanupDir(job.tmpDir);
  }
  jobs.delete(job.id);
}

function startJobsSweeper() {
  setInterval(async () => {
    const threshold = Date.now() - JOB_TTL_MS;
    for (const job of jobs.values()) {
      const updatedAt = new Date(job.updated_at).getTime();
      if (Number.isNaN(updatedAt) || updatedAt >= threshold) continue;
      if (job.tmpDir) {
        await cleanupDir(job.tmpDir);
      }
      jobs.delete(job.id);
    }
  }, 60 * 1000).unref();
}

module.exports = {
  enqueueDownload,
  getJob,
  toPublicJob,
  consumeJobFile,
  startJobsSweeper,
};
