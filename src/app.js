const express = require("express");
const cors = require("cors");

const app = express();

/* Middleware */
app.use(cors());
app.use(express.json());

/* Routes */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/time", require("./routes/time.routes"));
app.use("/api/sign", require("./routes/sign.routes"));

/* Health check */
app.get("/health", (req, res) => {
  res.json({ status: "OK" });
});

module.exports = app;