import dotenv from "dotenv";
dotenv.config();
import { clerkMiddleware, requireAuth } from "@clerk/express";

// comment: clerkMiddleware() reads CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY automatically from process.env

// comment: export clerkMiddleware directly — applied globally in server.js via app.use(clerkMiddleware())
export { clerkMiddleware };

// comment: pre-invoke requireAuth() once here, export the resulting middleware — used per-route later
const requireAuthMiddleware = requireAuth();
export { requireAuthMiddleware as requireAuth };

// comment: helper so other files don't need to know Clerk's internal API shape
export const getAuthUserId = (req) => {
  return req.auth().userId;
};