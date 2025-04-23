import mongoose from "mongoose";
import { MongoBulkWriteError } from "mongodb";
import express, { Request, Response } from "express";
import multer from "multer";
import csv from "csv-parser";
import { Readable } from "stream";

import Contact from "../models/contact";
import List from "../models/list";
import { authenticateUser, requireAdmin } from "../middlewares";
import { BadRequestError, NotFoundError } from "../errors";
import { catchAsync } from "../utils/catchAsync";

const router = express.Router();
const upload = multer();

router.use(authenticateUser, requireAdmin);

router.get("/", async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) throw new NotFoundError();

  try {
    const contacts = await Contact.find({ userId }).lean();
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

      list.contacts.push(...insertedIds);
      await list.save();

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

export { router as contactsRouter };
