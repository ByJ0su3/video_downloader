import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_DIR = path.resolve(__dirname, "..", "..");
const DOWNLOADS_DIR = path.join(BACKEND_DIR, "tmp_downloads");
const UPLOADS_DIR = path.join(BACKEND_DIR, "tmp_uploads");

export {
  BACKEND_DIR,
  DOWNLOADS_DIR,
  UPLOADS_DIR,
};
