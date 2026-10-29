const jwt = require("jsonwebtoken");

function signUser(user) {
  return jwt.sign(
    { sub: user.id, role: user.role, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { signUser, verifyToken };
