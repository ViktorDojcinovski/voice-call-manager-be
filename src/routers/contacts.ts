import mongoose from "mongoose";
import { MongoBulkWriteError } from "mongodb";
import express, { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

import Contact from "../models/contact";
import List from "../models/list";
import Lead from "../models/lead";
import { authenticateUser, requireAdmin } from "../middlewares";
import {
  BadRequestError,
  NotFoundError,
  RequestValidationError,
} from "../errors";
import { catchAsync } from "../utils/catchAsync";

const router = express.Router();
const upload = multer();

// router.use(authenticateUser, requireAdmin);

router.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) throw new NotFoundError();

  try {
    const contacts = await Contact.find({ userId, status: "active" }).lean();
    res.status(200).json({ contacts });
  } catch (error) {
    console.error("Failed to fetch contacts:", error);
    throw new Error(`Failed to fetch contacts ${error}`);
  }
});

router.post(
  "/import",
  upload.single("file"),
  catchAsync(async (req: Request, res: Response) => {
    const file = req.file;
    const {
      hasHeader,
      mapping,
      duplicateField,
      selectedListId,
    }: {
      hasHeader: boolean;
      mapping: Record<string, string>;
      duplicateField: string;
      selectedListId: mongoose.Types.ObjectId;
    } = req.body;

    if (!file) {
      throw new BadRequestError("No file uploaded.");
    }

    const list = await List.findById(selectedListId);
    if (!list) {
      throw new Error("List not found");
    }
    if (!list?.user) {
      throw new Error("List missing user field");
    }

    const buffer = file.buffer;
    const parsedContacts: any[] = [];

    const parseStream = () =>
      new Promise<void>((resolve, reject) => {
        const stream = Readable.from(buffer, { encoding: "utf-8" });
        stream
          .pipe(
            csv({
              headers: hasHeader ? undefined : false,
              separator: ",",
              quote: '"',
              skipLines: 0,
              strict: true,
              mapHeaders: ({ header }) => header?.trim(),
              mapValues: ({ value }) => value?.trim(),
            }),
          )
          .on("data", (data) => parsedContacts.push(data))
          .on("end", resolve)
          .on("error", reject);
      });

    try {
      await parseStream();
      console.log("mapping: ", mapping);

      let fixedMapping = mapping;
      if (typeof mapping === "string") {
        fixedMapping = JSON.parse(mapping);
      }

      const mappedContacts = parsedContacts.map((parsedContact) => {
        const mappedRecord: Record<string, any> = {};

        for (const [csvHeader, modelField] of Object.entries(fixedMapping)) {
          if (modelField && parsedContact[csvHeader]) {
            mappedRecord[modelField] = parsedContact[csvHeader] || "";
          }
        }

        return mappedRecord;
      });

      // Deduplicate within the uploaded CSV
      const seen = new Set<string>();
      const dedupedContacts = mappedContacts.filter((record) => {
        const val = record[duplicateField]?.toLowerCase()?.trim();
        if (!val || seen.has(val)) return false;
        seen.add(val);
        return true;
      });
      // Get existing values from DB to prevent inserting duplicates
      const valuesToCheck = dedupedContacts.map((c) =>
        c[duplicateField]?.toLowerCase()?.trim(),
      );
      const existing = await Contact.find({
        [duplicateField]: { $in: valuesToCheck },
      }).lean();

      const existingSet = new Set(
        existing.map((e) => String(e[duplicateField]).toLowerCase().trim()),
      );

      // Filter out those that already exist in DB
      const contactsToInsert = dedupedContacts.filter(
        (c) => !existingSet.has(c[duplicateField]?.toLowerCase()?.trim()),
      );

      if (contactsToInsert.length === 0) {
        return res.status(409).json({ message: "All contacts already exist." });
      }

      const bulkOps = contactsToInsert.map((contact) => ({
        insertOne: {
          document: {
            ...contact,
            listId: selectedListId,
            userId: req.user!.id,
          },
        },
      }));

      // Batch insert
      const result = await Contact.bulkWrite(bulkOps, { ordered: false });

      const insertedIds = Object.values(result.insertedIds);

      list.set("contacts", [...list.contacts, ...insertedIds]);
      await list.save({ validateBeforeSave: false });

      res.status(201).json({
        created: insertedIds.length,
        skipped: dedupedContacts.length - contactsToInsert.length,
        message: "Contacts imported successfully.",
      });
    } catch (error) {
      console.error("Import error:", error);

      if (error instanceof MongoBulkWriteError) {
        return res.status(409).json({
          message: "Duplicate contact(s) detected during import.",
          details: (error as unknown as any).message,
        });
      }

      res.status(500).json({
        message: "An unexpected error occurred during import.",
        details: error instanceof Error ? error.message : error,
      });
    }
  }),
);

router.patch(
  "/:contactId",
  [body("result").notEmpty().isString(), body("timestamp").notEmpty()],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new RequestValidationError(errors.array());
    }
    const { result, notes, timestamp } = req.body;
    const { contactId } = req.params;

    const contact = await Contact.findById(contactId);
    if (!contact) throw new NotFoundError();

    const list = await List.findById(contact.listId);
    if (!list) throw new NotFoundError();

    const normalizedResult = result.replace(/\s+/g, "_").toLowerCase();
    const shouldConvertToLead =
      list.exitConditionsPositive.includes(normalizedResult);
    const shouldArchive =
      list.exitConditionsNegative?.includes(normalizedResult);

    contact.actions.push({ result, notes, timestamp });

    // Contact --> Lead
    if (shouldConvertToLead) {
      const leadData = {
        ...contact.toObject(),
        _id: undefined,
      };

      await new Lead(leadData).save();
      await Contact.findByIdAndDelete(contactId);

      res.status(200).json({ message: "Contact converted to lead." });
    }

    // Contact --> Archived
    if (shouldArchive) {
      contact.status = "archived";
    }

    await contact.save();
    res.status(200).json({
      message: shouldArchive
        ? "Contact archived."
        : "Contact successfully updated!",
    });
  },
);

router.post(
  "/batch",
  catchAsync(async (req: Request, res: Response) => {
    const userId = req.user?.id;
    const { ids }: { ids: string[] } = req.body;

    if (!userId) {
      throw new NotFoundError();
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestError("Invalid or empty 'ids' array.");
    }

    // Ensure all IDs are valid ObjectId strings
    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    if (validIds.length === 0) {
      throw new BadRequestError("No valid contact IDs provided.");
    }

    const contacts = await Contact.find({
      _id: { $in: validIds },
      userId,
    }).lean();

    res.status(200).json(contacts);
  }),
);

export { router as contactsRouter };
