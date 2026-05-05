import express from "express";
import { errorHandler } from "./middleware/error.middleware.js";

export const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  console.log("Health check");
  res.json({ status: "ok" });
});

app.use(errorHandler);
