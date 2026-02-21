const path = require("path");

const BACKEND_DIR = path.resolve(__dirname, "..", "..");
const BIN_DIR = path.join(BACKEND_DIR, "bin");

module.exports = {
  BACKEND_DIR,
  BIN_DIR,
};
