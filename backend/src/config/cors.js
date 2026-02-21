function splitOrigins(value) {
  if (!value || !value.trim()) return ["*"];
  return value
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildCorsOptions() {
  const fromSingle = process.env.CORS_ORIGIN;
  const fromMany = process.env.CORS_ORIGINS;
  const allowedOrigins = splitOrigins(fromMany || fromSingle || "*");

  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("CORS origin no permitido"));
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  };
}

export { buildCorsOptions };
