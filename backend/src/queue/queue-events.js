// Purpose: centralized QueueEvents listeners for both queues — useful for logging/monitoring
// job lifecycle across the app, separate from the per-worker completed/failed logs already
// added directly on the Worker instances.

import { QueueEvents } from "bullmq";
import  redis  from "../config/redis.js";

export const ingestionQueueEvents = new QueueEvents("ingestion", { connection: redis });
export const embeddingQueueEvents = new QueueEvents("embedding", { connection: redis });

ingestionQueueEvents.on("completed", ({ jobId }) => {
  console.log(`[QueueEvents] ingestion job ${jobId} completed`);
});

ingestionQueueEvents.on("failed", ({ jobId, failedReason }) => {
  console.error(`[QueueEvents] ingestion job ${jobId} failed:`, failedReason);
});

embeddingQueueEvents.on("completed", ({ jobId }) => {
  console.log(`[QueueEvents] embedding job ${jobId} completed`);
});

embeddingQueueEvents.on("failed", ({ jobId, failedReason }) => {
  console.error(`[QueueEvents] embedding job ${jobId} failed:`, failedReason);
});

export const queueEvents = {
  ingestion: ingestionQueueEvents,
  embedding: embeddingQueueEvents,
};