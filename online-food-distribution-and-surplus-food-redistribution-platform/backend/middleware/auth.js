const { verifyToken } = require("../utils/auth");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return res.status(401).json({ message: "Login required." });
  try {
    req.user = verifyToken(header.slice(7));
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired session." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ message: "You do not have permission for this action." });
    next();
  };
}

module.exports = { requireAuth, requireRole };
