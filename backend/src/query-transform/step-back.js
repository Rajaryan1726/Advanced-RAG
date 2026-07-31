// Purpose: generate a more general/abstract "step-back" question that helps retrieve
// broader context chunks (e.g. "How does useEffect cleanup work?" -> "What is the React useEffect hook?")

// Import getModelForStep from llm_router.js
// Note: llm_router.js's defaultModelConfig doesn't currently have a "stepback" entry —
//   add one, e.g. stepback: { provider: "gemini", model: "gemini-flash-latest" }

import { getModelForStep } from '../llm-providers/llm_router.js';

// Function: generateStepBackQuery(originalQuery)
//   - Get model via getModelForStep("stepback")
//   - Prompt: ask for ONE broader/more general question related to the original, output only the question
//   - Call model.invoke(prompt), read .content, trim, return

async function generateStepBackQuery(originalQuery) {
  const model = getModelForStep('stepback');
  const prompt = `Given the following user query, generate ONE broader or more general question that could help retrieve additional context or background information. Output ONLY the new question, no preamble.

${originalQuery}
`;  

    const response = await model.invoke(prompt);
    return response.content.trim();
}

export { generateStepBackQuery };