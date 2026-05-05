const dotenv = require("dotenv");
const { createApp } = require("./app");
const { Log } = require("../logging_middleware/log");

dotenv.config();

function startServer() {
  Log("backend", "info", "route", "Starting scheduler server").catch(() => {});

  const app = createApp();
  const port = 4000;

  app.listen(port, () => {
    Log("backend", "info", "route", `Scheduler server is running on port ${port}`).catch(() => {});
  });
}

startServer();