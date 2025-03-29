import express, { Request, Response } from "express";
import { body } from "express-validator";
import jwt, { Secret } from "jsonwebtoken";

import { validateRequest } from "../middlewares/validate-request";
import { BadRequestError } from "../errors/bad-request-error";

import User from "../models/user";
import { Password } from "../services/password";

const router = express.Router();

router.post(
  "/signin",
  [
    body("email").isEmail().withMessage("Email must be valid"),
    body("password")
      .trim()
      .notEmpty()
      .withMessage("You must supply a password"),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      throw new BadRequestError("Invalid credentials");
    }

    const passwordMatch = await Password.compare(
      existingUser.password,
      password,
    );
    if (!passwordMatch) {
      throw new BadRequestError("Invalid credentials");
    }

    const userJwt = jwt.sign(
      {
        id: existingUser.id,
        role: existingUser.role,
      },
      process.env.JWT_SECRET as Secret,
    );

    req.session = {
      jwt: userJwt,
    };

    res.status(200).send(existingUser);
  },
);

router.post("/signout", (req: Request, res: Response) => {
  req.session = null;

  res.send({});
});

export { router as authRouter };
