const express = require("express");
const auth = require("../middlewares/auth");
const controller = require("../controllers/sign.controller");

const router = express.Router();

router.post("/", auth, controller.registerSign);

module.exports = router;