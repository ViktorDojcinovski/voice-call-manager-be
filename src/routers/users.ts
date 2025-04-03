import express, { Request, Response } from "express";
import mongoose from "mongoose";

import User from "../models/user";
import Settings from "../models/settings";
import { BadRequestError, NotFoundError } from "../errors";
import { authenticateUser, requireAdmin } from "../middlewares";
import { UserRole } from "voice-javascript-common";

import { defaultSettings } from "../config/settings";

const router = express.Router();
// router.use(authenticateUser, requireAdmin);

router.get("/", async (req: Request, res: Response) => {
  const users = await User.find();

  res.status(200).json(users);
});

router.post("/", async (req: Request, res: Response) => {
  // const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    console.log(req.body);
    const { email, password, role } = req.body;
    let settings;

    // const existingUser = await User.findOne({ email }).session(session);
    const existingUser = await User.findOne({ email });
    console.log(existingUser);
    if (existingUser) {
      throw new BadRequestError("User with that email already exists.");
    }

    // Create user
    const user = User.build({ email, password, role });
    await user.save();

    // Create settings linked to admin user
    if (user.role === UserRole.ADMIN) {
      settings = Settings.build({
        user: user._id as mongoose.Types.ObjectId,
        ...defaultSettings,
      });
      await settings.save();

      user.settings = settings._id as mongoose.Types.ObjectId;
      await user.save();
    }

    // await session.commitTransaction();
    // session.endSession();

    res.status(201).json({ user, settings });
  } catch (error) {
    console.log("error: ", error);
    if (error instanceof BadRequestError) {
      throw error;
    }
    // await session.abortTransaction();
    // session.endSession();
    // console.error("Transaction failed:", error);
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
});

router.get("/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate("settings");
  if (!user) {
    throw new NotFoundError();
  }

  res.status(200).json(user);
});

router.patch("/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { email, role } = req.body;

  const user = await User.findByIdAndUpdate(
    userId,
    { email, role },
    { new: true },
  );
  if (!user) {
    throw new NotFoundError();
  }

  res.status(200).json(user);
});

router.delete("/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  // const session = await mongoose.startSession();
  // session.startTransaction();

  try {
    // const user = await User.findById(userId).session(session);
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError();
    }

    const settings = user.settings;
    if (settings) {
      await Settings.findByIdAndDelete(settings._id /* , { session } */);
    }

    await User.findByIdAndDelete(userId /* , { session } */);

    // await session.commitTransaction();
    // session.endSession();

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    // await session.abortTransaction();
    // session.endSession();
    // console.error("Transaction failed:", error);
    res.status(500).json({ message: "An error occurred. Please try again." });
  }
});

export { router as usersRouter };
