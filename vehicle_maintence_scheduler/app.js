const express = require("express");
const cors = require("cors");
const schedulerRoutes = require("./src/routes/scheduler.routes");
const { Log } = require("../logging_middleware/log");

function createApp() {
  Log("backend", "info", "route", "Creating scheduler app instance").catch(() => {});

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/", schedulerRoutes);

  app.use((error, req, res, next) => {
    Log("backend", "error", "middleware", `Scheduler global error: ${error.message}`).catch(() => {});
    res.status(500).json({ message: error.message || "Internal server error" });
  });

  Log("backend", "info", "route", "Scheduler app instance created").catch(() => {});
  return app;
}

module.exports = {
  createApp,
};