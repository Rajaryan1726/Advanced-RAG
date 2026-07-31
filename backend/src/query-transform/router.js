// Purpose: given a query (or set of transformed queries), decide which source(s) to search:
// Qdrant (vector semantic search), MongoDB (structured data like QueryHistory), or Cloudinary-raw
// (return/fetch the original source file directly)

// Import getModelForStep from llm_router.js

import { getModelForStep } from '../llm-providers/llm_router.js';
import Document from '../models/Document.js';


// Function: routeQuery(originalQuery)
//   - Get model via getModelForStep("routing")
//   - Prompt: classify the query's INTENT into one or more of:
//       "semantic"     -> needs Qdrant vector search (default/most common case — conceptual questions)
//       "history"      -> user is asking about their own past queries/conversations -> MongoDB QueryHistory
//       "raw_document" -> user explicitly wants the source file itself (e.g. "give me the original PDF for module 3",
//                          "show me the transcript file") -> Cloudinary raw file lookup via Document model
//   - Output ONLY valid JSON: { "sources": ["semantic"] } or { "sources": ["semantic", "raw_document"] } etc
//     (array because a query could need more than one source, e.g. "summarize module 3's PDF" might need both)
//   - Strip ```json fences before parsing, per established pattern
//   - On parse failure, fall back to { sources: ["semantic"] } (safest default — never fail retrieval entirely)
//   - Return the parsed sources array

async function routeQuery(originalQuery) {
  const model = getModelForStep('routing');
  const prompt = `Given the following user query, classify its intent into one or more of the following source types:
- "semantic"     -> needs Qdrant vector search (default/most common case — conceptual questions)
- "history"      -> user is asking about their own past queries/conversations -> MongoDB QueryHistory
- "raw_document" -> user explicitly wants the source file itself (e.g. "give me the original PDF for module 3",
                   "show me the transcript file") -> Cloudinary raw file lookup via Document model
Output ONLY valid JSON in the following format: { "sources": ["semantic"] } or { "sources": ["semantic", "raw_document"] } etc. (array because a query could need more than one source). Strip any markdown fences before parsing.

${originalQuery}
`;

    const response = await model.invoke(prompt);
    let sources;

    try {   

    // Strip JSON fences if present
    const content = response.content.trim();
   const jsonStr = content.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim();
    sources = JSON.parse(jsonStr).sources;
  } catch (error) {
    console.error("Error parsing routed sources:", error);
    sources = ["semantic"]; // fallback to default source
  }
  return sources;
}


// Function: resolveRawDocument(moduleNumber, clerkUserId)
//   - Only called when router decides "raw_document" is needed
//   - Query Document model (from models/Document.js) for matching clerkUserId + moduleNumber
//   - Return { cloudinaryUrl, originalFilename, fileType } for the matched document(s)
//   - If no match found, return null (caller/retriever.js should handle gracefully, not throw)

async function resolveRawDocument(moduleNumber, clerkUserId) {
    
    const document = await Document.findOne({ moduleNumber, clerkUserId }); 

    if (!document) {    

        return null; // no matching document found  
    }   

    return {
        cloudinaryUrl: document.cloudinaryUrl,
        originalFilename: document.originalFilename,
        fileType: document.fileType
    };  
}

export { routeQuery, resolveRawDocument };