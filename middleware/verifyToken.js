const jwt = require("jsonwebtoken");

// const crypto = require('crypto');
// const jwtSecret = crypto.randomBytes(64).toString('hex');
// console.log(jwtSecret);


const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = verifyToken;
