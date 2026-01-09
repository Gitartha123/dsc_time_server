// Load environment; this project stores variables in `env` (not .env)
require("dotenv").config({ path: "env" });
const app = require("./src/app");
const connectDB = require("./src/config/db");

const PORT = process.env.PORT || 5001;

connectDB(
  
);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Global error handlers - write to stderr so nodemon/console captures them
process.on('uncaughtException', (err) => {
  console.error('uncaughtException', err && err.stack ? err.stack : err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection', reason && reason.stack ? reason.stack : reason);
});