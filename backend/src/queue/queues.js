// Purpose: define and export the BullMQ Queue instances used across the app —
// one for ingestion (parse + upload + chunk), one for embedding (embed + upsert to Qdrant).
// Workers (ingestion-worker.js, embedding-worker.js) consume these; routes/ produce jobs into them.
// Queue names are hardcoded literal strings ("ingestion", "embedding") — these MUST match
// exactly what the Worker instances use in workers/ingestion-worker.js and embedding-worker.js,
// or jobs will silently never be picked up.

import { Queue } from "bullmq";
import  redis  from "../config/redis.js";

export const ingestionQueue = new Queue("ingestion", { connection: redis });
export const embeddingQueue = new Queue("embedding", { connection: redis });

// Note: BullMQ requires the ioredis connection to have maxRetriesPerRequest: null for blocking
// commands used internally — verify config/redis.js's client is configured this way, or BullMQ
// will throw a clear error on startup telling you to fix this.