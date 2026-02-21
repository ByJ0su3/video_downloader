const { cleanupDir, downloadMedia } = require("../services/ytdlp.service");

async function health(_req, res) {
  res.json({ ok: true, timestamp: new Date().toISOString() });
}

async function root(_req, res) {
  res.json({ message: "Video downloader API OK" });
}

async function download(req, res, next) {
  try {
    const result = await downloadMedia(req.body || {});
    res.download(result.filePath, result.fileName, async (error) => {
      await cleanupDir(result.tmpDir);
      if (error && !res.headersSent) {
        res.status(500).json({ detail: "Error al enviar archivo" });
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  health,
  root,
  download,
};
