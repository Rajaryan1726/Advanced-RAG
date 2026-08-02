// Purpose: Express router for retrieving a user's past query history, grouped into
// chat sessions (a session = one continuous conversation, identified by sessionId).

import express from "express";
import QueryHistory from "../models/QueryHistory.js";
import { requireAuth, getAuthUserId } from "../config/clerk.js";

const router = express.Router();

// Route: GET /history
//   - Returns a list of SESSIONS (not individual messages), most recent first.
//   - Each session summary: sessionId, title (first query in that session),
//     messageCount, lastQueryAt, latestJudgeScore
router.get("/", requireAuth, async (req, res) => {
  try {
    const clerkUserId = getAuthUserId(req);

    // Fetch all records for this user, oldest first, so we can determine
    // each session's FIRST query (used as the title) while grouping
    const allRecords = await QueryHistory.find({ clerkUserId }).sort({ createdAt: 1 });

    const sessionsMap = new Map();

    for (const record of allRecords) {
      const sessionId = record.sessionId || record._id.toString();

      if (!sessionsMap.has(sessionId)) {
        sessionsMap.set(sessionId, {
          sessionId,
          title: record.query,
          messageCount: 0,
          lastQueryAt: record.createdAt,
          latestJudgeScore: record.judgeScore,
        });
      }

      const session = sessionsMap.get(sessionId);
      session.messageCount += 1;
      session.lastQueryAt = record.createdAt;
      session.latestJudgeScore = record.judgeScore;
    }

    // Most recent session first
    const sessions = Array.from(sessionsMap.values()).sort(
      (a, b) => new Date(b.lastQueryAt) - new Date(a.lastQueryAt)
    );

    res.status(200).json({ sessions, count: sessions.length });
  } catch (error) {
    console.error("Error in /history route:", error);
    res.status(500).json({ error: "An error occurred while retrieving query history" });
  }
});

// Route: GET /history/session/:sessionId
//   - Returns all messages within a single session, oldest first (chronological
//     conversation order), scoped to the authenticated user.
router.get("/session/:sessionId", requireAuth, async (req, res) => {
  try {
    const clerkUserId = getAuthUserId(req);
    const { sessionId } = req.params;

    const messages = await QueryHistory.find({ clerkUserId, sessionId }).sort({
      createdAt: 1,
    });

    if (messages.length === 0) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.status(200).json({ sessionId, messages });
  } catch (error) {
    console.error("Error in /history/session/:sessionId route:", error);
    res.status(500).json({ error: "An error occurred while retrieving the session" });
  }
});

// Route: GET /history/:id — kept for a single message lookup (unchanged behavior)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const clerkUserId = getAuthUserId(req);
    const recordId = req.params.id;

    const historyRecord = await QueryHistory.findOne({ _id: recordId, clerkUserId });

    if (!historyRecord) {
      return res.status(404).json({ error: "History record not found" });
    }

    res.status(200).json(historyRecord);
  } catch (error) {
    console.error("Error in /history/:id route:", error);
    res.status(500).json({ error: "An error occurred while retrieving the history record" });
  }
});

export default router;