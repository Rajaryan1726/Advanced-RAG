import express from "express";
import { runCRAGPipeline } from "../evaluation/c-rag-loop.js";
import QueryHistory from "../models/QueryHistory.js";
import { requireAuth, getAuthUserId } from "../config/clerk.js";

const router = express.Router();

router.post("/", requireAuth, async (req, res) => {
  const clerkUserId = getAuthUserId(req);
  const { query, sessionId } = req.body;

  if (!query || query.trim() === "") {
    return res.status(400).json({ error: "Missing or empty query in request body" });
  }

  if (!sessionId) {
    return res.status(400).json({ error: "Missing sessionId in request body" });
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
      sessionId,
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

  res.status(200).json({ ...result, queryHistoryId, sessionId });
});

export default router;