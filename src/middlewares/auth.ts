import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import dotenv from "dotenv";

import User from "../models/user";
import { NotAuthorisedError, NotFoundError } from "../errors";
import { UserRole } from "voice-javascript-common";

dotenv.config();

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session?.jwt) {
    throw new NotAuthorisedError();
  }

  const decoded = jwt.verify(
    req.session.jwt,
    process.env.JWT_SECRET!,
  ) as JwtPayload;

  req.user = decoded;
  next();
};

const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new NotAuthorisedError(); // This will be caught below
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      throw new NotFoundError(); // This will be caught below
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new NotAuthorisedError(); // This will be caught below
    }

    next(); // If all checks pass, move to the next middleware
  } catch (error) {
    next(error); // Pass error to Express error handler
  }
};

export { authenticateUser, requireAdmin };
