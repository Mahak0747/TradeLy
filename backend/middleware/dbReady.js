const mongoose = require("mongoose");

// Fail fast with a clear 503 instead of letting Mongoose buffer the query for ~10s and then time out.
module.exports = function dbReady(req, res, next) {
  if (mongoose.connection.readyState === 1) return next();
  return res.status(503).json({ message: "Database is temporarily unavailable. Please retry in a moment." });
};
