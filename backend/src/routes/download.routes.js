import express from "express";
import multer from "multer";
import path from "node:path";
import { UPLOADS_DIR } from "../config/paths.js";
import {
  root,
  health,
  createDownload,
  getDownloadStatus,
  downloadFile,
} from "../controllers/download.controller.js";

const router = express.Router();

const upload = multer({
  dest: UPLOADS_DIR,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ext || ext === ".txt") {
      cb(null, true);
      return;
    }
    cb(new Error("Solo se acepta cookies.txt en formato Netscape"));
  },
});

router.get("/", root);
router.get("/health", health);
router.post("/download", upload.single("cookiesFile"), createDownload);
router.get("/download/:id/status", getDownloadStatus);
router.get("/download/:id/file", downloadFile);

export default router;
