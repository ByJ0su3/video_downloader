const express = require("express");
const {
  download,
  health,
  root,
  downloadStatus,
  downloadFile,
} = require("../controllers/download.controller");

const router = express.Router();

router.get("/", root);
router.get("/health", health);
router.post("/download", download);
router.get("/download/:jobId/status", downloadStatus);
router.get("/download/:jobId/file", downloadFile);

module.exports = router;
