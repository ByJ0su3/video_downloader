const express = require("express");
const cors = require("cors");
const { buildCorsOptions } = require("./config/cors");
const downloadRoutes = require("./routes/download.routes");

const app = express();
const corsOptions = buildCorsOptions();

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json({ limit: "1mb" }));

app.use("/api", downloadRoutes);

app.use((err, _req, res, _next) => {
  const message = err && err.message ? err.message : "Error interno del servidor";
  const status = Number(err && err.status ? err.status : 400);
  const normalizedStatus = message.includes("agotado") ? 504 : status;
  res.status(normalizedStatus).json({ detail: message });
});

module.exports = app;
