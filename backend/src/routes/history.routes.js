// Purpose: Express router for retrieving a user's past query history.

// Import express, Router
// Import QueryHistory from "../models/QueryHistory.js"
// Import { requireAuth, getAuthUserId } from "../config/clerk.js"

import express from "express";
import QueryHistory from "../models/QueryHistory.js";
import { requireAuth, getAuthUserId } from "../config/clerk.js";

// Route: GET /history
//   - middleware: requireAuth
//   - Step 1: get clerkUserId via getAuthUserId(req)
//   - Step 2: support optional pagination via query params: ?limit=20&skip=0 (default limit 20)
//   - Step 3: query QueryHistory.find({ clerkUserId }).sort({ createdAt: -1 }).skip(skip).limit(limit)
//     (uses the existing compound index on clerkUserId + createdAt for fast lookup)
//   - Step 4: respond 200 with { history: [...], count: results.length }
//   - wrap in try/catch, respond 500 on failure

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {   

    try {   

        const clerkUserId = getAuthUserId(req);

        const limit = parseInt(req.query.limit) || 20;
        const skip = parseInt(req.query.skip) || 0; 

        const historyRecords = await QueryHistory.find({ clerkUserId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({ history: historyRecords, count: historyRecords.length });
    }
    catch (error) {
        console.error("Error in /history route:", error);
        res.status(500).json({ error: "An error occurred while retrieving query history" });
    }

});



// Route: GET /history/:id
//   - middleware: requireAuth
//   - Step 1: get clerkUserId via getAuthUserId(req)
//   - Step 2: fetch QueryHistory.findOne({ _id: req.params.id, clerkUserId }) — IMPORTANT:
//     filter by clerkUserId too, not just _id, so one user can never fetch another user's
//     history record by guessing/enumerating ids
//   - Step 3: if not found (either doesn't exist, or belongs to a different user), respond 404
//     (not 403 — don't reveal whether the id exists at all, to avoid leaking information about
//     other users' record ids)
//   - Step 4: respond 200 with the record
//   - wrap in try/catch, respond 500 on failure

// export default router



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