import express, { Request, Response } from "express";
import cors from "cors";
import { json, urlencoded } from "body-parser";
import mongoose from "mongoose";
import cookieSession from "cookie-session";
import "express-async-errors";

import cfg from "./config";

import {
  authRouter,
  campaignRouter,
  twilioRouter,
  usersRouter,
  settingsRouter,
} from "./src/routers";
import { NotFoundError } from "./src/errors";
import { errorHandler } from "./src/middlewares";

const app = express();

// CORS
app.use(
  cors({
    origin: cfg.allowedOrigin as string,
    methods: cfg.allowedMethods as string[],
    credentials: true,
  }),
);

// Body parsing
app.use(urlencoded({ extended: true }));
app.use(json());

// Cookie session
app.use(
  cookieSession({
    name: "session",
    signed: false,
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
  }),
);

// Routers
app.use("/api/auth", authRouter);
app.use("/api/campaign", campaignRouter);
app.use("/api/twilio", twilioRouter);
app.use("/api/users", usersRouter);
app.use("/api/settings", settingsRouter);

app.all("*", (req: Request, res: Response) => {
  throw new NotFoundError();
});

// Error handling
app.use(errorHandler);

const port = process.env.PORT || 3000;

const start = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be defined");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }

  const server = app.listen(port, function () {
    console.log("Express server running on *:" + port);
  });

  setInterval(() => {
    console.log(`Memory Usage: ${JSON.stringify(process.memoryUsage())}`);
  }, 5000);

  const shutdown = async () => {
    console.log("Shutting down...");
    await mongoose.connection.close();
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    shutdown();
  });
};

start();
