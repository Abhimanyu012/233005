const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const LOG_ENDPOINT = "http://20.207.122.201/evaluation-service/logs";

const VALID_STACKS = ["backend", "frontend"];
const VALID_LEVELS = ["debug", "info", "warn", "error", "fatal"];
const VALID_PACKAGES = [
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "middleware",
  "utils",
];

async function Log(stack, level, pkg, message) {
  if (!VALID_STACKS.includes(stack)) {
    throw new Error("Invalid stack value");
  }

  if (!VALID_LEVELS.includes(level)) {
    throw new Error("Invalid level value");
  }

  if (!VALID_PACKAGES.includes(pkg)) {
    throw new Error("Invalid package value");
  }

  if (typeof message !== "string" || message.trim() === "") {
    throw new Error("Message must be a non-empty string");
  }

  const token = process.env.TOKEN;

  if (!token) {
    throw new Error("Missing TOKEN in environment variables");
  }

  const payload = {
    stack,
    level,
    package: pkg,
    message,
  };

  const response = await axios.post(LOG_ENDPOINT, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  return response.data;
}

module.exports = { Log };