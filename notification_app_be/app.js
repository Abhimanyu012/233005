const express = require("express");
const cors = require("cors");
const notificationRoutes = require("./src/routes/notification.routes");
const { errorHandler } = require("./src/middleware/error.middleware");
const { Log } = require("../logging_middleware/log");

function createApp() {
  Log("backend", "info", "route", "Creating notification app instance").catch(() => {});

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use("/", notificationRoutes);
  app.use(errorHandler);

  Log("backend", "info", "route", "Notification app instance created").catch(() => {});
  return app;
}

module.exports = {
  createApp,
};