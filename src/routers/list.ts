import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";

import List from "../models/list";
import { NotFoundError, RequestValidationError } from "../errors";
import { authenticateUser, requireAdmin } from "../middlewares";

const router = express.Router();
// router.use(authenticateUser, requireAdmin);

// Get a list by userId
router.get("/", async (req: Request, res: Response) => {
  // const { userId } = req.params;

  const lists = await List.find({});
  if (!lists.length) throw new NotFoundError();

  res.status(200).json(lists);
});

// Create a new list
router.post(
  "/create-new",
  [
    body("listName").notEmpty().withMessage("List name is required"),
    body("listPriority").notEmpty().withMessage("List priority is required"),
    body("listType").notEmpty().withMessage("List type is required"),
    body("listSharing").notEmpty().withMessage("List sharing is required"),
    body("filters").isArray(),
    body("crossFilters").isArray(),
    body("exitStrategy").optional().isString(),
    body("exitStrategyDescription").optional().isString(),
    body("steps").isArray(),
  ],
  async (req: Request, res: Response) => {
    console.log("req.body: ", req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new RequestValidationError(errors.array());
    }

    const list = List.build(req.body);
    await list.save();

    res.status(201).json(list);
  },
);

// Update an existing list
router.patch(
  "/edit/:id",
  [
    body("listName").optional().isString(),
    body("listPriority").optional().isString(),
    body("listType").optional().isString(),
    body("listSharing").optional().isString(),
    body("filters").optional().isArray(),
    body("crossFilters").optional().isArray(),
    body("exitStrategy").optional().isString(),
    body("exitStrategyDescription").optional().isString(),
    body("steps").optional().isArray(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new RequestValidationError(errors.array());
    }

    const { id } = req.params;
    const updateData: Partial<Record<string, unknown>> = {};

    // Build the update object dynamically
    for (const key in req.body) {
      updateData[key] = req.body[key];
    }

    const updatedList = await List.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true },
    );

    if (!updatedList) {
      throw new NotFoundError();
    }

    res.status(200).json(updatedList);
  },
);

// Delete a list
router.delete("/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  const deletedList = await List.findByIdAndDelete(id);
  if (!deletedList) {
    throw new NotFoundError();
  }

  res.status(200).json({ message: "List deleted successfully." });
});

export { router as listRouter };
