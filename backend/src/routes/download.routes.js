const express = require("express");
const { download, health, root } = require("../controllers/download.controller");

const router = express.Router();

router.get("/", root);
router.get("/health", health);
router.post("/download", download);

module.exports = router;
