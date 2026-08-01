// Purpose: temporary record mapping a batch upload's individual file entries (tempId + relativePath)
// so that when each file is actually uploaded in Step 2, the backend can look up which folder
// (and therefore module number) that file belongs to.

// Schema fields:
//   batchId (String, required, indexed) — groups all files from one upload session
//   clerkUserId (String, required)
//   tempId (String, required, unique) — one per file, generated at manifest time
//   relativePath (String, required) — e.g. "module-1/lecture.srt"
//   moduleNumber (Number) — pre-computed via extractModuleNumber() at manifest time;
//     null if extraction failed (folder name didn't match the expected pattern)
//   status (String, enum: "pending" | "uploaded" | "failed", default: "pending")
//   createdAt (timestamps: true)

import mongoose from "mongoose";

const ingestManifestSchema = new mongoose.Schema(
  {
    batchId: { type: String, required: true, index: true },
    clerkUserId: { type: String, required: true, index: true },
    tempId: { type: String, required: true, unique: true },
    relativePath: { type: String, required: true },
    moduleNumber: { type: Number, default: null },
    status: {
      type: String,
      enum: ["pending", "uploaded", "failed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// TTL index — manifest entries expire 24 hours after creation if never followed up
// with an actual file upload, so these don't linger forever
ingestManifestSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

const IngestManifest = mongoose.model("IngestManifest", ingestManifestSchema);

export default IngestManifest;
