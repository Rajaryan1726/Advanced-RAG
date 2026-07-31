// comment: import loadUniversalFile from ./universal-loader.js
// comment: import loadSrtVttFile from ./srt-vtt-loader.js
// comment: import path from "path

import path from 'path';
import { loadSrtVttFile } from './srt-vtt-loader.js';
import { loadUniversalFile } from './universal-loader.js';
import { uploadFileToCloudinary } from './cloudinary-upload.js';
import { chunkCuesByTimeWindow, buildChunkMetadata } from '../chunking/time-window-chunker.js';
import { chunkDocuments } from '../chunking/text-chunker.js';
import { upsertChunks } from '../vector-store/upsert.js';
import Document from '../models/Document.js';

// comment: create and export an async function ingestFile(filePath, clerkUserId, moduleNumber)
//   Single entry point for other files (routes/, queue/workers/) — they never need to know
//   which specific loader/uploader handles which file type or step.
//
// Step 1 — Parse the file locally:
//   - extract extension via path.extname(filePath).toLowerCase()
//   - if extension is .srt or .vtt → call loadSrtVttFile(filePath) → parsedDocs
//   - otherwise → call loadUniversalFile(filePath) → parsedDocs
//
// Step 2 — Upload to Cloudinary:
//   - call uploadFileToCloudinary(filePath, { folder: `users/${clerkUserId}/module-${moduleNumber}` })
//   - destructure { secureUrl, publicId, resourceType, format } from the result
//
// Step 3 — Create Document record in MongoDB (status: "pending"):
//   - fields: clerkUserId, originalFilename (path.basename(filePath)), cloudinaryPublicId (publicId),
//     cloudinaryUrl (secureUrl), resourceType, fileType (ext without the dot), moduleNumber,
//     lectureTitle (from parsedDocs metadata if srt/vtt, else undefined), ingestionStatus: "pending"
//   - save and keep a reference to this document (documentId) for steps 4/5
//
// Step 4 — Chunk the parsed content:
//   - if srt/vtt → call chunkCuesByTimeWindow + buildChunkMetadata (time-window-chunker.js)
//   - else → call chunkDocuments (text-chunker.js)
//   - wrap this in try/catch — on failure, jump to Step 6 (failure handling) with stage: "chunking"
//
// Step 5 — Embed + upsert to Qdrant:
//   - call upsertChunks("rag-documents", chunks) from vector-store/upsert.js
//   - capture the returned array of uuid chunk ids
//   - update the Document record: set qdrantChunkIds to this array, set ingestionStatus to "embedded"
//   - wrap in try/catch — on failure, jump to Step 6 with stage: "embedding"
//
// Step 6 — Failure handling (catch-all, wraps steps 2-5):
//   - if documentId already exists (Document record was created before the failure),
//     update that record: set ingestionStatus to "failed", set ingestionError to the caught error's message
//     (include which stage failed, e.g. "embedding: <error message>", for easier debugging later)
//   - if the Document record was never created (failure happened before Step 3), just log the error —
//     nothing to update
//   - re-throw the error after logging/updating, so the caller (route handler or queue worker) knows
//     ingestion failed and can respond/retry accordingly
//
// Return value on success: { documentId, chunkCount: chunks.length, cloudinaryUrl: secureUrl }


const ingestFile = async (filePath, clerkUserId, moduleNumber) => {
  const ext = path.extname(filePath).toLowerCase();
  const isSubtitle = ext === '.srt' || ext === '.vtt';

  // Step 1 — Parse the file locally
  const parsedDocs = isSubtitle
    ? await loadSrtVttFile(filePath)
    : await loadUniversalFile(filePath);

  let documentRecord;

  try {
    // Step 2 — Upload to Cloudinary
    const { secureUrl, publicId, resourceType, format } = await uploadFileToCloudinary(
      filePath,
      { folder: `users/${clerkUserId}/module-${moduleNumber}` }
    );

    // Step 3 — Create Document record in MongoDB (status: "pending")
    documentRecord = await Document.create({
      clerkUserId,
      originalFilename: path.basename(filePath),
      cloudinaryPublicId: publicId,
      cloudinaryUrl: secureUrl,
      resourceType,
      fileType: format || ext.replace('.', ''),
      moduleNumber,
      lectureTitle: isSubtitle ? parsedDocs?.lectureTitle : undefined,
      ingestionStatus: 'pending',
    });

    let chunks;

    try {
      // Step 4 — Chunk the parsed content
      if (isSubtitle) {
        const timeChunks = chunkCuesByTimeWindow(parsedDocs.cues);
        chunks = buildChunkMetadata(timeChunks, {
          moduleNumber,
          lectureTitle: parsedDocs.lectureTitle,
        });
      } else {
        chunks = await chunkDocuments(parsedDocs);
      }
    } catch (chunkingError) {
      throw new Error(`chunking: ${chunkingError.message}`);
    }

    let qdrantChunkIds;

    try {
      // Step 5 — Embed + upsert to Qdrant
      qdrantChunkIds = await upsertChunks('lecture-transcripts', chunks);

      documentRecord.qdrantChunkIds = qdrantChunkIds;
      documentRecord.ingestionStatus = 'embedded';
      await documentRecord.save();
    } catch (embeddingError) {
      
      throw new Error(`embedding: ${embeddingError.message}`);
    }

    return {
      documentId: documentRecord._id,
      chunkCount: chunks.length,
      cloudinaryUrl: documentRecord.cloudinaryUrl,
    };
  } catch (error) {
    // Step 6 — Failure handling
    if (documentRecord) {
      documentRecord.ingestionStatus = 'failed';
      documentRecord.ingestionError = error.message;
      await documentRecord.save().catch((saveErr) => {
        console.error('Failed to save ingestionError on Document:', saveErr);
      });
    } else {
      console.error('ingestFile failed before Document creation:', error);
    }

    throw error;
  }
};

export { ingestFile };



// comment: TODO — later, this function's result needs to be passed to the appropriate chunker
//   (time-window-chunker.js for srt/vtt output, text-chunker.js for universal-loader output)
//   that wiring happens in the ingestion worker (queue/workers/ingestion-worker.js), not here —
//   this file's job is ONLY loading/parsing, not chunking or embedding

