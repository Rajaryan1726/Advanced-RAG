// Purpose: HyDE (Hypothetical Document Embeddings) — generate a fake "ideal answer" passage,
// then that passage (not the raw query) gets embedded for retrieval, since answer-shaped text
// often matches source chunks better than question-shaped text

// Import getModelForStep from llm_router.js

import { getModelForStep } from '../llm-providers/llm_router.js';


// Function: generateHypotheticalDocument(originalQuery)
//   - Get model via getModelForStep("hyde")
//   - Prompt: ask the model to write a short hypothetical passage (3-5 sentences) that would
//     plausibly answer the query, as if excerpted from course material — output only the passage
//   - Call model.invoke(prompt), read .content, trim, return
//   - Note: this returned text gets passed to vector-store/embeddings.js + query.js by retriever.js
//     later, NOT embedded here — this file only generates the text


async function generateHypotheticalDocument(originalQuery) {
  const model = getModelForStep('hyde');
  const prompt = `Write a short hypothetical passage (3-5 sentences) that would plausibly answer the following query, as if excerpted from course material — output only the passage:

${originalQuery}
`;  

  const response = await model.invoke(prompt);
  return response.content.trim();
}


export { generateHypotheticalDocument };