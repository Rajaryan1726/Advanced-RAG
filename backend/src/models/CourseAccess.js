// comment: import mongoose (Schema, model) from "mongoose"

import mongoose from "mongoose";

const { Schema, model } = mongoose;


// comment: define a CourseAccessSchema with:
//   - clerkUserId: String, required — which user this access record belongs to
//   - moduleNumbers: an array of Strings/Numbers — which modules this user has access to
//     (e.g. ["module 1", "module 2"]) — supports partial course access, not just all-or-nothing
//   - grantedAt: Date, default Date.now
//   - expiresAt: Date, optional — for time-limited access if needed later

const CourseAccessSchema = new Schema({
  clerkUserId: { type: String, required: true },
  moduleNumbers: { type: Array, required: true },
    grantedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
},
{ timestamps: true }
);


// comment: add a schema index on clerkUserId since access checks happen on every query
//   (routing logic needs to filter Qdrant results/queries based on what this user can access)

CourseAccessSchema.index({ clerkUserId: 1 });

// comment: create and export the Mongoose model: export default mongoose.model("CourseAccess", CourseAccessSchema)

export default model("CourseAccess", CourseAccessSchema);