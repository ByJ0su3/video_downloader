const {
  enqueueDownload,
  getJob,
  toPublicJob,
  consumeJobFile,
} = require("../services/download-jobs.service");

async function health(_req, res) {
  res.json({ ok: true, timestamp: new Date().toISOString() });
}

async function root(_req, res) {
  res.json({ message: "Video downloader API OK" });
}

async function download(req, res, next) {
  try {
    const job = enqueueDownload(req.body || {});
    res.status(202).json({ job_id: job.id, status: job.status });
  } catch (error) {
    next(error);
  }
}

async function downloadStatus(req, res) {
  const job = getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ detail: "Job no encontrado" });
    return;
  }
  res.json(toPublicJob(job));
}

async function downloadFile(req, res) {
  const job = getJob(req.params.jobId);
  if (!job) {
    res.status(404).json({ detail: "Job no encontrado" });
    return;
  }
  if (job.status !== "done" || !job.filePath) {
    res.status(409).json({ detail: "Archivo aun no disponible" });
    return;
  }

  res.download(job.filePath, job.fileName, async (error) => {
    await consumeJobFile(job);
    if (error && !res.headersSent) {
      res.status(500).json({ detail: "Error al enviar archivo" });
    }
  });
}

module.exports = {
  health,
  root,
  download,
  downloadStatus,
  downloadFile,
};
