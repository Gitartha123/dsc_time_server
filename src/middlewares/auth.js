const jwt = require("jsonwebtoken");
const Token = require("../models/Token");

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ msg: "Token missing" });

  try {
    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET);

    const tokenDoc = await Token.findById(decoded.tokenId);
    if (!tokenDoc || !tokenDoc.active)
      return res.status(403).json({ msg: "Invalid token" });

    if (new Date() > tokenDoc.validTill)
      return res.status(403).json({ msg: "Token expired" });

    req.tokenDoc = tokenDoc;
    next();
  } catch (err) {
    res.status(401).json({ msg: "Unauthorized" });
  }
};