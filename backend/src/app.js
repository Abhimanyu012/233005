import express from "express";
import { errorHandler } from "./middleware/error.middleware.js";
import { Log } from "../logging_middleware/log.js";

export const app = express();
app.use(express.json());

app.get("/health", async (req, res, next) => {
  try {
    await Log("backend", "info", "route", "Health check endpoint called");
    res.json({ status: "ok" });
  } catch (error) {
    next(error);
  }
});

app.use(errorHandler);
