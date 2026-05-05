const dotenv = require("dotenv");
const { createApp } = require("./app");
const { Log } = require("../logging_middleware/log");

dotenv.config();

function startServer() {
  Log("backend", "info", "route", "Starting notification server").catch(() => {});

  const app = createApp();
  const port = 5000;

  app.listen(port, () => {
    Log("backend", "info", "route", `Notification server is running on port ${port}`).catch(() => {});
  });
}

startServer();


