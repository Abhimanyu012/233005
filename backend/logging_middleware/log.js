const LOG_ENDPOINT = "http://20.207.122.201/evaluation-service/logs";

const VALID_STACKS = new Set(["backend", "frontend"]);
const VALID_LEVELS = new Set(["debug", "info", "warn", "error", "fatal"]);
const VALID_BACKEND_PACKAGES = new Set([
  "cache",
  "controller",
  "cron_job",
  "db",
  "domain",
  "handler",
  "repository",
  "route",
  "service",
  "middleware",
  "utils",
]);

export async function Log(stack, level, pkg, message) {
  if (!VALID_STACKS.has(stack)) {
    throw new Error(`Invalid stack: ${stack}`);
  }

  if (!VALID_LEVELS.has(level)) {
    throw new Error(`Invalid level: ${level}`);
  }

  if (stack === "backend" && !VALID_BACKEND_PACKAGES.has(pkg)) {
    throw new Error(`Invalid backend package: ${pkg}`);
  }

  if (typeof message !== "string" || message.trim().length === 0) {
    throw new Error("Log message must be a non-empty string");
  }

  const token = process.env.AFFORDMED_BEARER_TOKEN;

  if (!token) {
    throw new Error("Missing AFFORDMED_BEARER_TOKEN environment variable");
  }

  const response = await fetch(LOG_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      stack,
      level,
      package: pkg,
      message,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(
      `Log request failed with status ${response.status}: ${responseText}`,
    );
  }

  return responseText ? JSON.parse(responseText) : {};
}