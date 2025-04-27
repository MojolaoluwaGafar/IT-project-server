const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_RESET_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = verifyToken;
