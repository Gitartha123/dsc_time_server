const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const Token = require("../models/Token");

const LOG_FILE = path.join(__dirname, "..", "..", "logs", "time-controller.log");
const ensureLogDir = () => {
  try { fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true }); } catch (e) {}
};

const log = (label, obj) => {
  try {
    ensureLogDir();
    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} [${label}] ${typeof obj === 'string' ? obj : JSON.stringify(obj)}\n`);
  } catch (e) {
    // best-effort
  }
};

exports.getServerTime = async (req, res) => {
  const { name, email, machineHash } = req.body;

  // Validate required fields
  if (!name || !email || !machineHash) {
    return res.status(400).json({ 
      msg: "Name, email, and machineHash are required" 
    });
  }

  try {
    // Check if user is registered
    let tokenDoc = await Token.findOne({ name, email, machineHash });

    // If not registered, create new token record
    if (!tokenDoc) {
      try {
        tokenDoc = await Token.create({
          name,
          email,
          machineHash,
          productId: "time-server",
          maxSigns: 10000,
          usedSigns: 0,
          validTill: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          active: true
        });
        log('INFO', { msg: 'Created new Token', tokenId: tokenDoc._id, name, email, machineHash });
      } catch (createErr) {
        log('ERROR', { msg: 'Token.create failed', err: createErr.message, stack: createErr.stack });
        throw createErr;
      }
    } else {
      log('INFO', { msg: 'Found existing Token', tokenId: tokenDoc._id, name, email, machineHash });
    }

    // Check if token is still valid
    if (!tokenDoc.active) {
      log('WARN', { msg: 'Device deactivated', tokenId: tokenDoc._id });
      return res.status(403).json({ msg: "Device is deactivated" });
    }

    if (new Date() > tokenDoc.validTill) {
      log('WARN', { msg: 'License expired', tokenId: tokenDoc._id, validTill: tokenDoc.validTill });
      return res.status(403).json({ msg: "License expired" });
    }

    // Generate signed timestamp
    const now = new Date();
    const payload = {
      server_time: now.toISOString(),
      epoch: Math.floor(now.getTime() / 1000),
      device: machineHash
    };

    const signature = crypto
      .createHmac("sha256", process.env.TIME_SIGN_SECRET)
      .update(JSON.stringify(payload))
      .digest("hex");

    log('INFO', { msg: 'Signing timestamp', tokenId: tokenDoc._id, payload });

    res.json({ ...payload, signature });
  } catch (err) {
    console.error("Error in getServerTime:", err);
    log('ERROR', { msg: 'Unhandled error in getServerTime', err: err.message, stack: err.stack });
    res.status(500).json({ msg: "Server error" });
  }
};
