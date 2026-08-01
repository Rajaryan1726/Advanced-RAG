// comment: import dotenv and call dotenv.config() at the very top, before anything else runs
// comment: import connectMongoDB from ./config/mongodb.js
// comment: import redisConnection from ./config/redis.js (importing it triggers the connection + event listeners)
// comment: import { qdrantClient, ensureCollection } from ./config/qdrant.js
// comment: import express
// comment: import cors and morgan for middleware
// comment: import { clerkMiddleware } from '@clerk/express'
// comment: import routes/index.js (the combined router) — not built yet, so leave this import commented out for now until routes/ exists

import dotenv from "dotenv";
dotenv.config();    
import { connectMongoDB } from "./config/mongodb.js";
import redisConnection from "./config/redis.js";
import { qdrantClient, ensureCollection } from "./config/qdrant.js";   
import express from "express";
import cors from "cors";
import morgan from "morgan";
import { clerkMiddleware } from "@clerk/express"; 
import routes from "./routes/index.js"; 
import multer from "multer";
import "./queue/workers/ingestion-worker.js";
import "./queue/workers/embedding-worker.js";



// comment: create the express app instance: const app = express()
const app = express();



// comment: apply core middleware in order:
//   - cors() to allow frontend requests
//   - morgan('dev') for request logging
//   - express.json() to parse JSON request bodies
// comment: TODO — add clerkMiddleware() here once Clerk account + API keys are set up
app.use(clerkMiddleware());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());


// comment: mount a simple health check route: GET /health that returns { status: "ok" }
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// comment: mount the main API router under /api once routes/index.js exists (leave a TODO comment here for now)
app.use("/api", routes);

// comment: add a global Express error-handling middleware — MUST be defined with all 4
//   parameters (err, req, res, next) so Express recognizes it as an error handler specifically,
//   and MUST be registered AFTER all routes/middleware (Express only routes errors to handlers
//   defined below where the error occurred)
//
//   This catches:
//     - Multer errors (e.g. fileFilter rejecting an unsupported mimetype, file size limits)
//     - Any other error passed via next(error) from route handlers that isn't already caught
//       by a route's own try/catch
//
//   Behavior:
//     - if err is a MulterError (check err.name === "MulterError" or instanceof multer.MulterError),
//       respond 400 with { error: err.message } — these are always client-side input problems
//     - for any other unhandled error, log it server-side (full error, including stack) and
//       respond 500 with a generic message, never leaking internal error details to the client


app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.name === "MulterError") {
    console.error("Multer error:", err.message);
    return res.status(400).json({ error: err.message });
  }

  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Something went wrong on the server" });
});


// comment: define PORT from process.env.PORT, default to something like 3000 if not set
const PORT = process.env.PORT || 3000;


// comment: create and export an async function startServer() that:


const startServer = async () => {

//   - calls await connectMongoDB()


    try {   
        await connectMongoDB();

//   - calls await ensureCollection() with a chosen collection name + vector size (leave vector size as a TODO — depends on which embedding model gets picked later)


        await ensureCollection("lecture-transcripts", 1536); // Replace with actual collection name and vector size


//   - starts app.listen(PORT) and logs the running port



        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });


//   - wraps everything in try/catch — log fatal errors and process.exit(1) if startup fails

    
    } catch (error) {
        console.error("Fatal error during server startup:", error);
        process.exit(1);
    }}

// comment: call startServer() at the bottom to actually boot the app
    startServer();