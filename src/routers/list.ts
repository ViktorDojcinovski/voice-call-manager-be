import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";

import List from "../models/list";
import Contact from "../models/contact";
import { NotFoundError, RequestValidationError } from "../errors";
import { authenticateUser, requireAdmin } from "../middlewares";
import { isValidPhoneNumber } from "../utils/isValidPhonNumber";

const router = express.Router();
router.use(authenticateUser, requireAdmin);

// Get a list
router.get("/:id", async (req: Request, res: Response) => {
  // TO-DO compare the user from the token with the owner of the list
  const { id } = req.params;
  const list = await List.findById(id);
  if (!list) throw new NotFoundError();

  res.status(200).json(list);
});

// Get lists
router.get("/", async (req: Request, res: Response) => {
  // TO-DO compare the user from the token with the owner of the list
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
    body("tags").optional().isString(),
    body("restrictToOwnedLeads").optional().isBoolean(),
    body("restrictToOwnedAccounts").optional().isBoolean(),
    body("listOwner").optional().isString(),
    body("listActive").optional().isBoolean(),
    body("hasExitCriteria").optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    console.log("req.body: ", req.body);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new RequestValidationError(errors.array());
    }

    const transformedBody = {
      ...req.body,
      exitConditionsPositive:
        req.body.exitConditionsPositive?.map((item: any) => item.value) || [],
      exitConditionsNegative:
        req.body.exitConditionsNegative?.map((item: any) => item.value) || [],
    };

    const list = List.build({ user: req.user!.id, ...transformedBody });
    await list.save();

    res.status(201).json(list);
  },
);

// Update an existing list
router.patch(
  "/:id",
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
    body("tags").optional().isString(),
    body("restrictToOwnedLeads").optional().isBoolean(),
    body("restrictToOwnedAccounts").optional().isBoolean(),
    body("listOwner").optional().isString(),
    body("listActive").optional().isBoolean(),
    body("hasExitCriteria").optional().isBoolean(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new RequestValidationError(errors.array());
    }

    const { id } = req.params;
    const updateData: Partial<Record<string, unknown>> = {};

    for (const key in req.body) {
      const transformedBody = {
        ...req.body,
        exitConditionsPositive:
          req.body.exitConditionsPositive?.map((item: any) => item.value) || [],
        exitConditionsNegative:
          req.body.exitConditionsNegative?.map((item: any) => item.value) || [],
      };

      updateData[key] = transformedBody[key];
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
router.delete("/:listId", async (req: Request, res: Response) => {
  const { listId } = req.params;

  const deletedList = await List.findByIdAndDelete(listId);
  if (!deletedList) {
    throw new NotFoundError();
  }

  res.status(200).json({ message: "List deleted successfully." });
});

router.post(
  "/:listId/step/:stepIndex/contacts",
  [body("step").optional().isNumeric()],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new RequestValidationError(errors.array());
    }

    const { listId, stepIndex } = req.params;
    const step = Number(stepIndex);

    try {
      const list = await List.findById(listId);
      if (!list) {
        res.status(404).json({ error: "List not found" });
        return;
      }

      const currentStep = list.steps[step - 1];
      const allContacts = await Contact.find({
        listId,
        mobile_phone: { $exists: true, $ne: null },
      }).lean();

      const validContacts = allContacts.filter((contact) => {
        return isValidPhoneNumber(contact.mobile_phone || "");
      });

      const filteredContacts = validContacts.filter((contact) => {
        const actions = contact.actions || [];

        if (step === 1) {
          return actions.length === 0;
        } else {
          console.log("actions: ", actions);
          console.log("step: ", step);
          return (
            actions.length === step - 1 &&
            actions[step - 1]?.result === currentStep.defaultAction
          );
        }
      });

      res.json(filteredContacts);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
);

export { router as listRouter };
