import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { flatten } from "flat";

import Settings from "../models/settings";
import { NotFoundError, RequestValidationError } from "../errors";
import { authenticateUser, requireAdmin } from "../middlewares";

const router = express.Router();
router.use(authenticateUser, requireAdmin);

router.get("/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  const settings = await Settings.findOne({ user: userId });
  if (!settings) throw new NotFoundError();

  res.status(200).json(settings);
});

router.patch(
  "/:userId",
  [
    body("General Settings").optional().isObject(),
    body("Notifications Settings").optional().isObject(),
    body("Phone Settings").optional().isObject(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new RequestValidationError(errors.array());
    }

    // TO DO - correct the way of obtaining the user id
    const { userId } = req.params;
    const updateData: Partial<Record<string, unknown>> = {};
    const existingSettings = await Settings.findOne({ user: userId });

    if (req.body["General Settings"]) {
      updateData["General Settings"] = req.body["General Settings"];
    }

    if (req.body["Notifications Settings"]) {
      updateData["Notifications Settings"] = req.body["Notifications Settings"];
    }

    if (req.body["Phone Settings"]) {
      updateData["Phone Settings"] = req.body["Phone Settings"];
    }

    const updatedSettings = await Settings.findOneAndUpdate(
      { user: userId },
      {
        $set: updateData,
      },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!updatedSettings) {
      throw new NotFoundError();
    }

    res.status(200).json(updatedSettings);
  },
);

export { router as settingsRouter };
