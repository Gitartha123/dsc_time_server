const jwt = require("jsonwebtoken");
const Token = require("../models/Token");

/**
 * Generate JWT using name + email
 * (DB record must already exist)
 */
exports.generateAuthToken = async (req, res) => {
  const { name, email, machineHash } = req.body;

  if (!name || !email)
    return res.status(400).json({ msg: "Name and email required" });

  // 1️⃣ Find token record
  const tokenDoc = await Token.findOne({
    name: name,
    email: email,
    machineHash: machineHash,
    active: true
  });


  if (!tokenDoc)
    return res.status(404).json({ msg: "License not found" });

  // 2️⃣ Check expiry
  if (new Date() > tokenDoc.validTill)
    return res.status(403).json({ msg: "License expired" });

  // 3️⃣ Generate JWT
  const jwtToken = jwt.sign(
    {
      tokenId: tokenDoc._id,
      name: tokenDoc.name,
      email: tokenDoc.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }   // short lived token (best practice)
  );

  res.json({ token: jwtToken });
};

exports.registerToken = async (req, res) => {
    try {
        const {
            name,
            email,
            productId,
            machineHash,
            validTill
        } = req.body;

        console.log(req.body)
        // ✅ Validation (THIS WILL NOW WORK)
        if (
            !name ||
            !email ||
            !productId||
            !machineHash ||
            !validTill
        ) {
            return res.status(400).json({
                msg: "All fields are required"
            });
        }

        // ✅ Save to DB
        await Token.create({
            name,
            email,
            productId,
            machineHash,
            validTill
        });

        return res.status(200).json({
            msg: "Registered Successfully !!"
        });

        

    } catch (error) {
        console.error("Register error:", error);
        return res.status(500).json({
            msg: "Server error"
        });
    }
};