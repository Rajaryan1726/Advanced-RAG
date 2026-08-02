// Purpose: Worker that processes jobs from the "ingestion" queue — handles parsing, Cloudinary
// upload, Document record creation, and chunking. On success, enqueues a follow-up job into the
// "embedding" queue with the resulting chunks + documentId, so embedding happens as a separate
// async step.

import { Worker } from "bullmq";
import  redis from "../../config/redis.js";
import { embeddingQueue } from "../queues.js";
import path from "path";
import { loadSrtVttFile } from "../../ingestion/srt-vtt-loader.js";
import { loadUniversalFile } from "../../ingestion/universal-loader.js";
import { uploadFileToCloudinary } from "../../ingestion/cloudinary-upload.js";
import { chunkCuesByTimeWindow, buildChunkMetadata } from "../../chunking/time-window-chunker.js";
import { chunkDocuments } from "../../chunking/text-chunker.js";
import Document from "../../models/Document.js";

// Job payload shape (what routes/ will enqueue):
//   { filePath, clerkUserId, moduleNumber, originalFilename, mimetype }

export const ingestionWorker = new Worker(
  "ingestion",
  async (job) => {
    const { filePath, clerkUserId, moduleNumber, originalFilename, mimetype } = job.data;

    // Step 0 — Validate file extension and mimetype before doing any real work
    // Step 0 — Validate file extension (trust extension over mimetype —
    // browsers commonly send application/octet-stream for .srt files since
    // it isn't a browser-recognized MIME type, so mimetype alone is unreliable)
    const supportedExtensions = [".pdf", ".docx", ".csv", ".txt", ".srt", ".vtt"];
    const fileExtension = path.extname(originalFilename || filePath).toLowerCase();

    if (!supportedExtensions.includes(fileExtension)) {
      throw new Error(`Unsupported file type: ${fileExtension}`);
    }

    const isSubtitle = fileExtension === ".srt" || fileExtension === ".vtt";
const lectureTitle = path.basename(originalFilename, fileExtension);
let documentRecord;

    try {
      // Step 1 — Parse the file locally
      const parsedContent = isSubtitle
        ? await loadSrtVttFile(filePath)
        : await loadUniversalFile(filePath);

      // Step 2 — Upload to Cloudinary
      const { secureUrl, publicId, resourceType, format } = await uploadFileToCloudinary(
        filePath,
        { folder: `users/${clerkUserId}/module-${moduleNumber}` }
      );

      // Step 3 — Create Document record in MongoDB with ingestionStatus: "pending"
      documentRecord = await Document.create({
  clerkUserId,
  moduleNumber,
  originalFilename,
  cloudinaryPublicId: publicId,
  cloudinaryUrl: secureUrl,
  resourceType,
  fileType: format || fileExtension.replace(".", ""),
  lectureTitle,   // now derived from originalFilename, not parsedContent
  ingestionStatus: "pending",
});

      // Step 4 — Chunk the parsed content
      let chunks;
     if (isSubtitle) {
  const timeChunks = chunkCuesByTimeWindow(parsedContent.cues, 40, 5);
  chunks = buildChunkMetadata(timeChunks, {
    module_number: moduleNumber,
    lecture_title: lectureTitle,
    source_file: originalFilename,
  });
} else {
  chunks = await chunkDocuments(parsedContent);
}

      // Step 5 — Enqueue a job into embeddingQueue
      await embeddingQueue.add("embedding-job", {
        documentId: documentRecord._id,
        chunks,
      });

      // Step 6 — Return result object
      return { documentId: documentRecord._id, chunkCount: chunks.length };
    } catch (error) {
      // If a Document record was already created before the failure, mark it failed
      if (documentRecord) {
        documentRecord.ingestionStatus = "failed";
        documentRecord.ingestionError = error.message;
        await documentRecord.save().catch((saveErr) => {
          console.error("Failed to save ingestionError on Document:", saveErr);
        });
      }
      throw error; // re-throw so BullMQ marks the job failed
    }
  },
  { connection: redis }
);

// Event logging
ingestionWorker.on("completed", (job) => {
  console.log(`Ingestion job ${job.id} completed`);
});

ingestionWorker.on("failed", (job, err) => {
  console.error(`Ingestion job ${job.id} failed:`, err.message);
});