// Purpose: break a complex/multi-part query into simpler sub-queries that can each be retrieved independently

// Import getModelForStep from llm_router.js

import { getModelForStep } from '../llm-providers/llm_router.js';


// Function: decomposeQuery(originalQuery)
//   - Get model via getModelForStep("decompose")
//   - Prompt: ask the model to return a JSON array of sub-questions (2-4 items), 
//     output ONLY valid JSON, no markdown fences, no preamble
//   - Call model.invoke(prompt), read .content
//   - Strip ```json fences if present (per established pattern) before JSON.parse()
//   - If original query is already simple/atomic (single question, no "and"/"vs"/multi-clause),
//     model should return an array containing just the original query itself
//   - Wrap JSON.parse in try/catch; on parse failure, fall back to returning [originalQuery]
//   - Return the array of sub-queries

async function decomposeQuery(originalQuery) {
  const model = getModelForStep('decompose');
  const prompt = `Given the following user query, break it down into 2-4 simpler sub-questions that can be retrieved independently. Output ONLY a valid JSON array of these sub-questions, no markdown fences, no preamble.

${originalQuery}
`;  

  const response = await model.invoke(prompt);
  let subQueries;

  try {
    // Strip JSON fences if present
    const content = response.content.trim();
    const jsonStr = content.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim();
    subQueries = JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error parsing decomposed queries:", error);
    subQueries = [originalQuery];
  }

  return subQueries;
}

export { decomposeQuery };