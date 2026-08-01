// Purpose: central router that mounts all sub-routers under their respective base paths.
// This is the file server.js's currently-commented-out import line refers to.

// Import express, Router
// Import ingestRoutes from "./ingest.routes.js"
// Import queryRoutes from "./query.routes.js"
// Import historyRoutes from "./history.routes.js"

import express from "express";
import ingestRoutes from "./ingest.routes.js";
import queryRoutes from "./query.routes.js";
import historyRoutes from "./history.routes.js";

// Create a router, mount:
//   router.use("/ingest", ingestRoutes)
//   router.use("/query", queryRoutes)
//   router.use("/history", historyRoutes)

// export default router

const router = express.Router();

router.use("/ingest", ingestRoutes);
router.use("/query", queryRoutes);
router.use("/history", historyRoutes);

export default router;

// Note: once this file exists, uncomment the routes/index.js import + app.use() call in
// server.js that was left commented out since section 3 of the original build