const dotenv = require("dotenv");
const { Log } = require("../../../logging_middleware/log");

dotenv.config();

function buildAuthHeaders() {
  Log("backend", "info", "middleware", "Building auth headers for notification API call").catch(() => {});

  const token = process.env.TOKEN;

  if (!token) {
    Log("backend", "error", "middleware", "TOKEN is missing while building notification auth headers").catch(() => {});
    throw new Error("Missing TOKEN in environment variables");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function attachAuthHeaders(req, res, next) {
  Log("backend", "info", "middleware", "Attaching notification auth headers to request context").catch(() => {});

  try {
    req.apiHeaders = buildAuthHeaders();
    Log("backend", "info", "middleware", "Notification auth headers attached successfully").catch(() => {});
    next();
  } catch (error) {
    Log("backend", "error", "middleware", `Failed to attach notification auth headers: ${error.message}`).catch(() => {});
    next(error);
  }
}

module.exports = {
  buildAuthHeaders,
  attachAuthHeaders,
};