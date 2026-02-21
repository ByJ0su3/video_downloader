import {
  enqueueDownloadJob,
  getPublicJob,
  getDownloadFileInfo,
} from "../services/ytdlp.service.js";

function runtimeVersion() {
  return (
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.BACKEND_VERSION ||
    "dev"
  );
}

function root(_req, res) {
  res.json({
    ok: true,
    message: "Video downloader API OK",
    version: runtimeVersion(),
  });
}

function health(_req, res) {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    version: runtimeVersion(),
  });
}

function createDownload(req, res, next) {
  try {
    const payload = {
      ...req.body,
      cookiesPath: req.file?.path || null,
    };
    const job = enqueueDownloadJob(payload);
    res.status(202).json(job);
  } catch (error) {
    next(error);
  }
}

function getDownloadStatus(req, res) {
  const job = getPublicJob(req.params.id);
  if (!job) {
    res.status(404).json({
      ok: false,
      id: req.params.id,
      status: "not_found",
      error: "Job no encontrado",
    });
    return;
  }
  res.json(job);
}

function downloadFile(req, res) {
  const fileInfo = getDownloadFileInfo(req.params.id);
  if (!fileInfo) {
    res.status(404).json({
      ok: false,
      id: req.params.id,
      status: "not_found",
      error: "Job no encontrado",
    });
    return;
  }
  if (fileInfo.error) {
    res.status(fileInfo.status || 409).json({
      ok: false,
      id: req.params.id,
      status: "pending",
      error: fileInfo.error,
    });
    return;
  }

  res.download(fileInfo.filePath, fileInfo.fileName, async (error) => {
    await fileInfo.onSent();
    if (error && !res.headersSent) {
      res.status(500).json({
        ok: false,
        id: req.params.id,
        status: "error",
        error: "No se pudo enviar el archivo",
      });
    }
  });
}

export {
  root,
  health,
  createDownload,
  getDownloadStatus,
  downloadFile,
};
