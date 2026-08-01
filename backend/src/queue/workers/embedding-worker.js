// Purpose: Worker that processes jobs from the "embedding" queue — takes chunks produced by
// ingestion-worker.js, embeds + upserts them to Qdrant, and updates the Document record's
// final status.

import { Worker } from "bullmq";
import  redis from "../../config/redis.js";
import { upsertChunks } from "../../vector-store/upsert.js";
import Document from "../../models/Document.js";

// Job payload shape (from ingestion-worker.js): { documentId, chunks }

const embeddingWorker = new Worker(
  "embedding",
  async (job) => {
    const { documentId, chunks } = job.data;

    try {
      // Step 2 — upsert chunks to Qdrant
      const qdrantChunkIds = await upsertChunks("lecture-transcripts", chunks);

      // Step 3 — update Document record
      const documentRecord = await Document.findById(documentId);
      if (!documentRecord) {
        throw new Error(`Document with ID ${documentId} not found`);
      }

      documentRecord.qdrantChunkIds = qdrantChunkIds;
      documentRecord.ingestionStatus = "embedded";
      await documentRecord.save();

      // Step 4 — return result
      return { documentId, chunkCount: chunks.length };
    } catch (error) {
      // Mark Document as failed if possible
      try {
        const documentRecord = await Document.findById(documentId);
        if (documentRecord) {
          documentRecord.ingestionStatus = "failed";
          documentRecord.ingestionError = error.message;
          await documentRecord.save();
        }
      } catch (updateErr) {
        console.error(`Failed to update Document ${documentId} after embedding failure:`, updateErr.message);
      }
      throw error; // re-throw so BullMQ marks the job failed
    }
  },
  { connection: redis }
);

// Event logging
embeddingWorker.on("completed", (job) => {
  console.log(`Embedding job ${job.id} completed`);
});

embeddingWorker.on("failed", (job, err) => {
  console.error(`Embedding job ${job.id} failed:`, err.message);
});

export { embeddingWorker };