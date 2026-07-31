// Purpose: rewrite the user's raw query into a cleaner, more search-friendly form
// (fixes typos, expands abbreviations, removes conversational filler)

// Import getModelForStep from llm_router.js

import { getModelForStep } from '../llm-providers/llm_router.js';

// Function: rewriteQuery(originalQuery)
//   - Get model via getModelForStep("rewrite")
//   - Build a prompt instructing the model to output ONLY the rewritten query, no preamble
//   - Call model.invoke(prompt), read .content
//   - Trim whitespace, return the rewritten string
//   - If model output is empty or identical to input, just return originalQuery as fallback

async function rewriteQuery(originalQuery) {
  const model = getModelForStep('rewrite');
 const prompt = `Rewrite the following query into a single clean, search-friendly query. Output ONLY the rewritten query text — no explanation, no markdown, no bullet points, no alternatives:

${originalQuery}

Rewritten query:`;;
  
  const response = await model.invoke(prompt);
  const rewrittenQuery = response.content.trim();

  if (!rewrittenQuery || rewrittenQuery === originalQuery) {
    return originalQuery;
  }

  return rewrittenQuery;
}

export { rewriteQuery };