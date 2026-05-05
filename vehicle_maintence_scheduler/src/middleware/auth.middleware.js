const dotenv = require("dotenv");
const { Log } = require("../../../logging_middleware/log");

dotenv.config();

function buildAuthHeaders() {
  Log("backend", "info", "middleware", "Building auth headers for outgoing API call").catch(() => {});

  const token = process.env.TOKEN;

  if (!token) {
    Log("backend", "error", "middleware", "TOKEN is missing while building auth headers").catch(() => {});
    throw new Error("Missing TOKEN in environment variables");
  }

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function attachAuthHeaders(req, res, next) {
  Log("backend", "info", "middleware", "Attaching auth headers to request context").catch(() => {});

  try {
    req.apiHeaders = buildAuthHeaders();
    Log("backend", "info", "middleware", "Auth headers attached successfully").catch(() => {});
    next();
  } catch (error) {
    Log("backend", "error", "middleware", `Failed to attach auth headers: ${error.message}`).catch(() => {});
    next(error);
  }
}

module.exports = {
  buildAuthHeaders,
  attachAuthHeaders,
};
