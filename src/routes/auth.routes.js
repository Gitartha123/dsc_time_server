const express = require("express");
const controller = require("../controllers/auth.controller");

const router = express.Router();

router.post("/generate-token", controller.generateAuthToken);

module.exports = router;