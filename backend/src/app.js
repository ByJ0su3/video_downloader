import express from "express";
import cors from "cors";
import fsp from "node:fs/promises";
import { buildCorsOptions } from "./config/cors.js";
import { DOWNLOADS_DIR, UPLOADS_DIR } from "./config/paths.js";
import downloadRoutes from "./routes/download.routes.js";

const app = express();
const corsOptions = buildCorsOptions();

await fsp.mkdir(DOWNLOADS_DIR, { recursive: true });
await fsp.mkdir(UPLOADS_DIR, { recursive: true });

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: false }));

app.use("/api", downloadRoutes);

app.use((err, _req, res, _next) => {
  const status = Number(err?.status || 400);
  const message = err?.message || "Error interno del servidor";
  res.status(status).json({
    ok: false,
    status: "error",
    error: message,
  });
});

export default app;
