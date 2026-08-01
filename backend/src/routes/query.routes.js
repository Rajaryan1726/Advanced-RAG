// Purpose: Express router for the main query endpoint — runs the full C-RAG pipeline and
// saves the interaction into QueryHistory as part of the same request.

// Import express, Router
// Import { runCRAGPipeline } from "../evaluation/c-rag-loop.js"
// Import QueryHistory from "../models/QueryHistory.js"
// Import { requireAuth, getAuthUserId } from "../config/clerk.js"

import express from "express";
import { runCRAGPipeline } from "../evaluation/c-rag-loop.js";
import QueryHistory from "../models/QueryHistory.js";
import { requireAuth, getAuthUserId } from "../config/clerk.js";

// Route: POST /query
//   - middleware: requireAuth
//   - expects { query: string } in req.body
//   - Step 1: get clerkUserId via getAuthUserId(req)
//   - Step 2: validate req.body.query is present and non-empty; if missing, respond 400
//   - Step 3: call runCRAGPipeline(req.body.query) -> { answer, citedChunkIds, groundednessScore,
//     attempts, lowConfidence }
//   - Step 4: create a QueryHistory record:
//       { clerkUserId, query: req.body.query, transformedQueries: [] (not returned by
//         runCRAGPipeline currently — leave empty for now, or revisit later if this data is
//         needed), response: result.answer, citedChunks: result.citedChunkIds,
//         judgeScore: result.groundednessScore, retryCount: result.attempts }
//   - Step 5: respond 200 with the full result object PLUS the QueryHistory record's _id
//     (e.g. { ...result, queryHistoryId: historyRecord._id }) so the frontend can reference
//     this specific interaction later (e.g. for feedback/rating features)
//   - wrap in try/catch, respond 500 on failure, but still log the error with enough context
//     (clerkUserId, query text) to debug later — do NOT let a QueryHistory save failure crash
//     the whole request if the answer was already generated successfully; if the save fails,
//     log it but still return the answer to the user (better to serve a good answer than fail
//     the whole request over a logging concern)

// export default router


const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  const clerkUserId = getAuthUserId(req);
  const query = req.body.query;

  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Missing or empty query in request body" });
  }

  let result;
  try {
    result = await runCRAGPipeline(query);
  } catch (error) {
    console.error("Error in /query route (pipeline):", error);
    return res.status(500).json({ error: "An error occurred while processing the query" });
  }

  let queryHistoryId = null;
  try {
    const historyRecord = await QueryHistory.create({
      clerkUserId,
      query,
      transformedQueries: [],
      response: result.answer,
      citedChunks: result.citedChunkIds,
      judgeScore: result.groundednessScore,
      retryCount: result.attempts,
    });
    queryHistoryId = historyRecord._id;
  } catch (error) {
    console.error("Failed to save QueryHistory (answer still returned):", clerkUserId, query, error);
  }

  res.status(200).json({ ...result, queryHistoryId });
});

export default router;