import http from "http";
import express, { Request, Response } from "express";
import cors from "cors";
import { json, urlencoded } from "body-parser";
import mongoose from "mongoose";
import cookieSession from "cookie-session";
import "express-async-errors";

import { Server as SocketIOServer } from "socket.io";

import cfg from "./config";

import {
  authRouter,
  campaignRouter,
  twilioRouter,
  usersRouter,
  settingsRouter,
  contactsRouter,
  listRouter,
} from "./routers";
import { NotFoundError } from "./errors";
import { errorHandler } from "./middlewares";
import { socketAuthMiddleware } from "./middlewares/socket-auth";

const app = express();
let io: SocketIOServer;

const corsOptions = {
  origin: cfg.allowedOrigin as string,
  methods: cfg.allowedMethods as string[],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};

// CORS
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Trust NGINX proxying
app.set("trust proxy", 1);

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
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  }),
);

// Routers
app.use("/api/auth", authRouter);
app.use("/api/campaign", campaignRouter);
app.use("/api/twilio", twilioRouter);
app.use("/api/users", usersRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/contacts", contactsRouter);
app.use("/api/lists", listRouter);

app.all("*", (req: Request, res: Response) => {
  throw new NotFoundError();
});

// Error handling
app.use(errorHandler);

const port = process.env.PORT || 3000;

const start = async () => {
  console.log("Starting...");
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI must be defined");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
      maxPoolSize: 5,
    });
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }

  const server = http.createServer(app);
  io = new SocketIOServer(server, {
    cors: {
      origin: cfg.allowedOrigin as string,
      methods: cfg.allowedMethods as string[],
      credentials: true,
    },
  });
  io.use(socketAuthMiddleware);

  const shutdown = async () => {
    console.log("Shutting down...");
    await mongoose.connection.close();
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
  };

  io.on("connection", (socket) => {
    const userId = socket.data.user.id;

    socket.on("join-room", ({ roomId }) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room ${roomId}`);

      io.to(roomId).emit(`call-status-${roomId}`, {
        to: userId,
        status: "joined",
      });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected: ", socket.id);
    });
  });

  app.set("io", io);

  server.listen({ port: Number(port), host: "0.0.0.0" }, () => {
    console.log("Express + Socket.IO server running on *:" + port);
  });

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
  process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception:", err);
    shutdown();
  });
};

start();
