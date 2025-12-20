const crypto = require("crypto");

exports.getServerTime = async (req, res) => {
  const now = new Date();

  const payload = {
    server_time: now.toISOString(),
    epoch: Math.floor(now.getTime() / 1000)
  };

  const signature = crypto
    .createHmac("sha256", process.env.TIME_SIGN_SECRET)
    .update(JSON.stringify(payload))
    .digest("hex");

  res.json({ ...payload, signature });
};
