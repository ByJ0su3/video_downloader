function splitOrigins(value) {
  if (!value || !value.trim()) return ["*"];
  return value
    .split(/[,\s]+/)
    .map((v) => v.trim())
    .filter(Boolean);
}

function buildCorsOptions() {
  const allowedOrigins = splitOrigins(process.env.CORS_ORIGINS);
  return {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}

module.exports = {
  buildCorsOptions,
};
