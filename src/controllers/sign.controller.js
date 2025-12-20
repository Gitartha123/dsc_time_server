exports.registerSign = async (req, res) => {
  const token = req.tokenDoc;

  if (token.usedSigns >= token.maxSigns)
    return res.status(403).json({ msg: "Sign limit exceeded" });

  token.usedSigns += 1;
  await token.save();

  res.json({
    msg: "Sign approved",
    remaining: token.maxSigns - token.usedSigns
  });
};