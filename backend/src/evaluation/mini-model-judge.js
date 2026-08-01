// Purpose: score a query/response pair for groundedness — i.e. is the generated answer actually
// supported by the context chunks it was given, or does it hallucinate/drift from the source material?
// Single overall groundedness score (0-100), used by c-rag-loop.js to decide whether to retry

// Import getModelForStep from ../llm-providers/llm_router.js
// Note: llm_router.js already has a "judge" entry configured (gemini-flash-latest) — reuse it

import { getModelForStep } from '../llm-providers/llm_router.js';
import { buildContextBlock } from '../generation/generate-response.js';

// Function: scoreGroundedness(originalQuery, generatedAnswer, chunks)
//   - chunks: array of { id, rrfScore, payload } — the same chunks passed to generateResponse()
//   - Step 1: build a context block from chunks (reuse buildContextBlock from
//     ../generation/generate-response.js — import and call it directly, don't duplicate the logic)
//   - Step 2: get model via getModelForStep("judge")
//   - Step 3: build a prompt that:
//       - includes the context block
//       - includes the original query
//       - includes the generated answer
//       - instructs the model to score groundedness on a 0-100 scale:
//           - 100 = every claim in the answer is directly supported by the context
//           - 0 = the answer is entirely unsupported/hallucinated relative to the context
//           - partial credit for answers that are mostly grounded but contain minor unsupported
//             embellishment, or that appropriately say "cannot answer" when context is insufficient
//             (an honest "I don't know" given insufficient context should score HIGH, not low —
//             it's not hallucinating, it's correctly reporting a gap)
//       - instructs the model to output ONLY valid JSON: { "score": <number>, "reason": "<short explanation>" }
//         no markdown fences, no preamble
//   - Step 4: call model.invoke(prompt), read .content
//   - Step 5: strip ```json fences if present (use the more robust regex-based strip established
//     earlier: content.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim())
//   - Step 6: JSON.parse, wrapped in try/catch
//   - Step 7: on parse failure, log the error and fall back to a conservative default:
//       { score: 50, reason: "Judge output could not be parsed; defaulting to neutral score" }
//     (50 is a safe middle value — won't force an unnecessary retry, but won't falsely confirm
//     high confidence either)
//   - Step 8: validate the parsed score is a number between 0-100; if out of range or not a number,
//     also fall back to the same default as Step 7
//   - Return: { score, reason }

async function scoreGroundedness(originalQuery, generatedAnswer, chunks) {
  // Step 1: build context block from chunks

  const contextBlock = buildContextBlock(chunks);

    // Step 2: get model for "judge" step   
    const model = await getModelForStep("judge");

    // Step 3: build prompt
    const prompt = `You are a judge that scores the groundedness of a generated answer based on the provided context.
Context:
${contextBlock}
Original Query:
${originalQuery}
Generated Answer:
${generatedAnswer}

    core instructions:
- Score the groundedness of the generated answer on a scale from 0 to 10:
  - 10 = every claim in the answer is directly supported by the context    
    - 0 = the answer is entirely unsupported/hallucinated relative to the context   
    - Partial credit for answers that are mostly grounded but contain minor unsupported embellishment, or that appropriately say "cannot answer" when context is insufficient (an honest "I don't know" given insufficient context should score HIGH, not low — it's not hallucinating, it's correctly reporting a gap) 

- Output ONLY valid JSON: { "score": <number>, "reason": "<short explanation>" } — no markdown fences, no preamble
`;

    // Step 4: invoke model
    const response = await model.invoke(prompt);

    // Step 5: strip ```json fences if present
    const strippedContent = response.content.replace(/^```(?:json)?\s*/, '').replace(/```\s*$/, '').trim();

    // Step 6: JSON.parse, wrapped in try/catch
    let parsed;

    try {
        parsed = JSON.parse(strippedContent);
    } catch (error) {
        console.error("Error parsing judge output:", error);
        return { score: 5, reason: "Judge output could not be parsed; defaulting to neutral score" };
    }

    // Step 8: validate the parsed score is a number between 0-10
if (typeof parsed.score !== 'number' || parsed.score < 0 || parsed.score > 10) {
    console.error("Judge output score is out of range or not a number:", parsed);
    return { score: 5, reason: "Judge output score is out of range or not a number; defaulting to neutral score" };
}

    // Return the parsed score and reason
    return { score: parsed.score, reason: parsed.reason };
}


export { scoreGroundedness };