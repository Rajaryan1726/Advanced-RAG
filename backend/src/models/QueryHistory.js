// comment: import mongoose (Schema, model) from "mongoose"

import mongoose from "mongoose";

const { Schema, model } = mongoose;

// comment: define a QueryHistorySchema with:
//   - clerkUserId: String, required — links each history entry to a user (via Clerk, not a Mongo ref)
//   - query: String, required — the original user question
//   - transformedQueries: an object/array storing outputs of query-transform step (rewrite, hyde, sub-questions) for debugging/analytics
//   - response: String — the final generated answer
//   - citedChunks: an array of objects like { module_number, lecture_title, start_time, end_time, source_file }
//     — stores which chunks were used to answer, useful for the timestamp-citation feature
//   - judgeScore: Number — the Mini-Model judge's score for this query/response pair
//   - retryCount: Number, default 0 — how many C-RAG retries happened before final response
//   - createdAt: Date, default Date.now

const QueryHistorySchema = new Schema({
  clerkUserId: { type: String, required: true },
  query: { type: String, required: true },
    transformedQueries: { type: Object },
    response: { type: String },
    citedChunks: { type: Array },
    judgeScore: { type: Number },
    retryCount: { type: Number, default: 0 },
    sessionId: { type: String },
}, 
{ timestamps: true }
);


// comment: add a schema index on clerkUserId + createdAt (compound index) since history is usually
//   queried "most recent queries for this user"

QueryHistorySchema.index({ clerkUserId: 1, createdAt: -1 });


// comment: create and export the Mongoose model: export default mongoose.model("QueryHistory", QueryHistorySchema)

export default model("QueryHistory", QueryHistorySchema);