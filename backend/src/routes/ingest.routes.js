// Purpose: Express router for the two-step folder-aware ingestion flow.
// Step 1 (POST /manifest): frontend sends a JSON list of relative file paths (no file bytes yet).
//   Backend extracts module numbers from folder names and returns a batchId + tempId per file.
// Step 2 (POST /upload): frontend uploads each actual file, tagged with its tempId, so the
//   backend knows which module it belongs to without the user typing anything manually.

import express from "express";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { ingestionQueue } from "../queue/queues.js";
import { requireAuth, getAuthUserId } from "../config/clerk.js";
import { extractModuleNumber } from "../utils/extract-module-number.js";
import IngestManifest from "../models/IngestManifest.js";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads", "tmp");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedOriginalName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    cb(null, `${timestamp}-${sanitizedOriginalName}`);
  },
});

function fileFilter(req, file, cb) {
  const allowedExtensions = ['.srt', '.vtt', '.pdf', '.docx', '.csv', '.txt', '.pptx'];
  const ext = path.extname(file.originalname).toLowerCase()

  if (allowedExtensions.includes(ext)) {
    cb(null, true)
  } else {
    cb(new Error(`Unsupported file type: ${ext}`))
  }
}

const upload = multer({ storage, fileFilter });
const router = express.Router();

// Route: POST /manifest
//   - middleware: requireAuth
//   - expects { files: [{ relativePath: string, moduleNumberOverride?: number }, ...] } in req.body
router.post("/manifest", requireAuth, async (req, res) => {
  try {
    const clerkUserId = getAuthUserId(req);
    const { files } = req.body;

    // Step 2: validate files is a non-empty array
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: "files must be a non-empty array" });
    }

    // Step 3: generate a batchId for this upload session
    const batchId = uuidv4();

    // Step 4: build a manifest entry for each file
    const manifestEntries = await Promise.all(
      files.map(async (file) => {
        const isValidOverride =
          file.moduleNumberOverride != null &&
          Number.isInteger(file.moduleNumberOverride) &&
          file.moduleNumberOverride > 0;

        const moduleNumber = isValidOverride
          ? file.moduleNumberOverride
          : extractModuleNumber(file.relativePath);

        const tempId = uuidv4();

        await IngestManifest.create({
          batchId,
          clerkUserId,
          tempId,
          relativePath: file.relativePath,
          moduleNumber,
          status: "pending",
        });

        return { tempId, relativePath: file.relativePath, moduleNumber };
      })
    );

    // Step 5: respond with batchId + per-file info, flagging any null moduleNumbers
    // so the frontend can warn the user BEFORE uploading actual file bytes
    const unresolvedFiles = manifestEntries.filter((entry) => entry.moduleNumber === null);

    res.status(200).json({
      batchId,
      files: manifestEntries,
      warning:
        unresolvedFiles.length > 0
          ? `Could not detect a module number for ${unresolvedFiles.length} file(s). Please rename the containing folder (e.g. "module-1") or set it manually.`
          : undefined,
    });
  } catch (error) {
    console.error("Error in /ingest/manifest route:", error);
    res.status(500).json({ error: "An error occurred while creating the ingest manifest" });
  }
});

// Route: POST /upload
//   - middleware: requireAuth, multer single-file upload (field name "file")
//   - expects tempId in req.body alongside the file
router.post("/upload", requireAuth, upload.single("file"), async (req, res) => {
  let manifestEntry;

  try {
    const clerkUserId = getAuthUserId(req);
    const { tempId } = req.body;

    // Step 2: validate tempId is present
    if (!tempId) {
      return res.status(400).json({ error: "Missing tempId in request body" });
    }

    // Step 3: look up the manifest entry, scoped to this user
    manifestEntry = await IngestManifest.findOne({ tempId, clerkUserId });

    // Step 4: not found -> 404
    if (!manifestEntry) {
      return res.status(404).json({ error: "Manifest entry not found" });
    }

    // Step 5: refuse to ingest if module number couldn't be determined
    if (manifestEntry.moduleNumber === null || manifestEntry.moduleNumber === undefined) {
      return res.status(400).json({
        error: `Could not determine module number for "${manifestEntry.relativePath}". Please rename the folder and resubmit the manifest.`,
      });
    }

    // Step 6: no file uploaded -> 400
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Step 7: enqueue the ingestion job with the pre-resolved moduleNumber
    const job = await ingestionQueue.add("ingestion-job", {
      filePath: req.file.path,
      clerkUserId,
      moduleNumber: manifestEntry.moduleNumber,
      originalFilename: req.file.originalname,
      mimetype: req.file.mimetype,
    });

    // Step 8: mark manifest entry as uploaded
    manifestEntry.status = "uploaded";
    await manifestEntry.save();

    // Step 9: respond 202 Accepted
    res.status(202).json({ message: "File accepted for processing", jobId: job.id });
  } catch (error) {
    console.error("Error in /ingest/upload route:", error);

    if (manifestEntry) {
      manifestEntry.status = "failed";
      await manifestEntry.save().catch((saveErr) => {
        console.error("Failed to mark manifest entry as failed:", saveErr);
      });
    }

    res.status(500).json({ error: "An error occurred while processing the file" });
  }
});

// Route: GET /status/:jobId — unchanged from before
//   - middleware: requireAuth
router.get("/status/:jobId", requireAuth, async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await ingestionQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    const state = await job.getState();
    res.status(200).json({
      jobId: job.id,
      state,
      returnValue: job.returnvalue,
      failedReason: job.failedReason,
    });
  } catch (error) {
    console.error("Error in /ingest/status route:", error);
    res.status(500).json({ error: "An error occurred while fetching job status" });
  }
});

export default router;