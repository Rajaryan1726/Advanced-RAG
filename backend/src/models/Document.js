// Schema fields:
//   clerkUserId (String, required, indexed)
//   originalFilename (String, required)
//   cloudinaryPublicId (String, required)
//   cloudinaryUrl (String, required)          // secure_url, this is what router.js's raw branch will return/fetch
//   resourceType (String)                      // "raw" | "image" | "video" etc, from Cloudinary response
//   fileType (String)                           // "pdf" | "docx" | "srt" | "vtt" | "csv" | "txt" etc — derived from extension
//   moduleNumber (Number)                       // for course-structure lookup, matches CourseAccess.moduleNumbers
//   lectureTitle (String, optional)             // for srt/vtt files, from srt-vtt-loader's extracted metadata
//   ingestionStatus (String, enum: "pending" | "chunked" | "embedded" | "failed", default: "pending")
//   qdrantChunkIds (Array of String, default [])  // uuid ids of chunks upserted to Qdrant for this doc — lets router.js
//                                                   // trace from a Qdrant search hit back to this Document, and vice versa
//   createdAt (timestamps: true)
//
// Index: compound index on clerkUserId + moduleNumber (for fast course-scoped lookups)


import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    clerkUserId: { type: String, required: true, index: true },
    originalFilename: { type: String, required: true },
    cloudinaryPublicId: { type: String, required: true },
    cloudinaryUrl: { type: String, required: true },
    resourceType: { type: String },
    fileType: { type: String },
    moduleNumber: { type: Number },
    lectureTitle: { type: String },
    ingestionStatus: {
      type: String,
      enum: ['pending', 'chunked', 'embedded', 'failed'],
      default: 'pending',
    },
    ingestionError: { type: String },
    qdrantChunkIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

documentSchema.index({ clerkUserId: 1, moduleNumber: 1 });

const Document = mongoose.model('Document', documentSchema);

export default Document;