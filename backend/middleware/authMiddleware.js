const jwt = require("jsonwebtoken");
const { config } = require("../config/env");

const OBJECT_ID = /^[a-f\d]{24}$/i;

const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }
  try {
    const decoded = jwt.verify(header.slice(7), config.jwtSecret, { algorithms: ["HS256"] });
    if (!decoded || typeof decoded.id !== "string" || !OBJECT_ID.test(decoded.id)) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = { id: decoded.id, email: decoded.email };
    return next();
  } catch (err) {
    const expired = err && err.name === "TokenExpiredError";
    return res.status(401).json({ message: expired ? "Session expired. Please log in again." : "Invalid token" });
  }
};

module.exports = authMiddleware;
