const express = require("express");
const auth = require("../middlewares/auth");
const controller = require("../controllers/time.controller");

const router = express.Router();

router.get("/", auth, controller.getServerTime);

module.exports = router;
