const { config } = require("../config/env");

function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err && err.type === "entity.parse.failed") return res.status(400).json({ message: "Malformed JSON body" });
  if (err && err.type === "entity.too.large") return res.status(413).json({ message: "Request body too large" });

  const status = err.status && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) console.error(`[error] ${req.method} ${req.originalUrl}:`, err);
  const message = err.expose || !config.isProd ? err.message : "Internal server error";
  res.status(status).json({ message, error: message }); // `error` kept for backward compatibility with old clients
}

module.exports = { notFound, errorHandler };
