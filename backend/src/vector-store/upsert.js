// comment: import { qdrantClient } from "../config/qdrant.js"
// comment: import { embedTexts } from "./embeddings.js"
// comment: import { v4 as uuidv4 } from "uuid"


import { qdrantClient } from "../config/qdrant.js";
import { embedTexts } from "./embeddings.js";
import { v4 as uuidv4 } from "uuid";


// comment: create and export an async function upsertChunks(collectionName, chunks) that:
//   - accepts chunks: an array of objects, each either:
//     - { module_number, lecture_title, start_time, end_time, chunk_text, source_file } (srt/vtt chunks), OR
//     - { pageContent, metadata } (universal document chunks from text-chunker.js)
//   - normalizes both shapes into a consistent { text, metadata } pair before embedding:
//     - for srt/vtt chunks: text = chunk_text, metadata = { module_number, lecture_title, start_time, end_time, source_file, type: "lecture" }
//     - for universal doc chunks: text = pageContent, metadata = { ...metadata, type: "document" }
//   - extracts the array of texts, calls await embedTexts(texts) to get embedding vectors
//   - builds Qdrant point objects: [{ id: uuidv4(), vector: embedding, payload: metadata_with_text }, ...]
//     (payload should include the original text too, e.g. metadata.chunk_text, so retrieval can return it directly)
//   - calls await qdrantClient.upsert(collectionName, { points }) to write them into Qdrant
//   - returns the number of points upserted (for logging/confirmation)

const upsertChunks = async (collectionName, chunks) => {
  // Normalize chunks into { text, metadata } pairs
  const normalizedChunks = chunks.map((chunk) => {
    if (chunk.module_number !== undefined) {
      // SRT/VTT chunk
      return {
        text: chunk.chunk_text,
        metadata: {
          module_number: chunk.module_number,
          lecture_title: chunk.lecture_title,
          start_time: chunk.start_time,
          end_time: chunk.end_time,
          source_file: chunk.source_file,
          type: "lecture"
        }
      };
    } else {
      // Universal document chunk
      return {
        text: chunk.pageContent,
        metadata: {
          ...chunk.metadata,
          type: "document"
        }
      };
    }
  });

  // Extract texts and get embeddings
  const texts = normalizedChunks.map((c) => c.text);
  const embeddings = await embedTexts(texts);

  // Build Qdrant point objects
  const points = normalizedChunks.map((chunk, index) => ({
    id: uuidv4(),
    vector: embeddings[index],
    payload: {
      ...chunk.metadata,
      text: chunk.text
    }
  }));

  // Upsert into Qdrant
  await qdrantClient.upsert(collectionName, { points });

  return points.length;
};

export { upsertChunks };