const { Log } = require("../../../logging_middleware/log");

function errorHandler(err, req, res, next) {
  Log("backend", "error", "middleware", `Notification error middleware caught error: ${err.message}`).catch(() => {});

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    message: err.message || "Internal server error",
  });
}

module.exports = {
  errorHandler,
};
