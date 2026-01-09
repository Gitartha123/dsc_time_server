const express = require("express");
const controller = require("../controllers/time.controller");

const router = express.Router();

router.post("/", controller.getServerTime);

module.exports = router;
