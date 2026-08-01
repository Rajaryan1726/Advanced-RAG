// Purpose: orchestrate the full retry loop — runs retrieval + rerank + generation, scores the
// result via mini-model-judge, and retries up to 3 times total if groundedness is too low.
// Also wires in the guardrails already built (input PII/policy checks before, output PII/policy/
// format checks after) so this becomes the single orchestration entry point routes/ will call.

// Import retrieveCandidates from ../retrieval/retriever.js
// Import reciprocalRankFusion from ../retrieval/rerank.js
// Import generateResponse from ../generation/generate-response.js
// Import scoreGroundedness from ./mini-model-judge.js
// Import detectPII, maskPII from ../guardrails/input/pii-detector.js
// Import checkPolicyViolation from ../guardrails/input/policy-detector.js
// Import checkPIILeak from ../guardrails/output/pii-leak-check.js
// Import checkOutputPolicy from ../guardrails/output/policy-check.js
// Import checkTimestampFormat from ../guardrails/output/format-safety-check.js

import { retrieveCandidates } from '../retrieval/retriever.js';
import { reciprocalRankFusion } from '../retrieval/rerank.js';
import { generateResponse } from '../generation/generate-response.js';
import { scoreGroundedness } from './mini-model-judge.js';
import { detectPII, maskPII } from '../guardrails/input/pii-detector.js';   
import { checkPolicyViolation } from '../guardrails/input/policy-detector.js';
import { checkPIILeak } from '../guardrails/output/pii-leak-check.js';
import { checkOutputPolicy } from '../guardrails/output/policy-check.js';
import { checkTimestampFormat } from '../guardrails/output/format-safety-check.js';


// Constants:
//   MAX_RETRIES = 3
//   GROUNDEDNESS_THRESHOLD = 6   // score below this triggers a retry (tune later based on real usage)

const MAX_RETRIES = 3;
const GROUNDEDNESS_THRESHOLD = 6; // score below this triggers a retry (tune later based on real usage)


// Function: runCRAGPipeline(originalQuery, options = {})
//   Step 1 — Input guardrails:
//     - call checkPolicyViolation(originalQuery)
//     - if result is "policy_violation" -> return early with a safe refusal message,
//       do NOT proceed to retrieval/generation at all
//     - if result is "off_topic" -> return early with a polite "this seems outside course scope" message
//     - if result is "safe" -> continue
//     - call detectPII(originalQuery); if matches found, call maskPII(originalQuery, matches)
//       and use the masked version going forward (don't let raw PII flow into logs/LLM calls
//       unnecessarily, even though the query itself is what a user is asking about)
//
//   Step 2 — Retry loop (runs up to MAX_RETRIES times):
//     - attempt = 1
//     - loop:
//         a. call retrieveCandidates(query) -> variantResultSets
//         b. call reciprocalRankFusion(variantResultSets) -> chunks
//         c. call generateResponse(query, chunks) -> { answer, citedChunkIds }
//         d. call scoreGroundedness(query, answer, chunks) -> { score, reason }
//         e. if score >= GROUNDEDNESS_THRESHOLD -> break out of loop, this is our result
//         f. if score < GROUNDEDNESS_THRESHOLD and attempt < MAX_RETRIES ->
//              log a warning with attempt number + score + reason, increment attempt, loop again
//              (re-runs the FULL pipeline per attempt, per the locked-in design decision —
//              retrieval/rerank/generation all re-execute fresh each retry)
//         g. if score < GROUNDEDNESS_THRESHOLD and attempt === MAX_RETRIES ->
//              accept the last result anyway (best effort — don't loop forever), but flag it:
//              set a lowConfidence: true field on the returned result so the caller/UI can
//              show an appropriate disclaimer to the user
//
//   Step 3 — Output guardrails (run on the final accepted answer, whichever attempt produced it):
//     - call checkPIILeak(answer); if leak detected, redact or replace with a safe fallback message
//     - call checkOutputPolicy(answer) via getModelForStep("judge"); if unsafe, replace answer
//       with a safe fallback message ("I'm not able to provide that information")
//     - call checkTimestampFormat(answer, citedChunkIds); log a warning if format validation
//       fails (this is a soft check for now — log but don't block the response, since retrying
//       generation solely for citation formatting issues may not be worth the latency/cost;
//       revisit this decision once real usage data shows how often it actually fails)
//
//   Step 4 — Return final result object:
//     { answer, citedChunkIds, groundednessScore, attempts, lowConfidence (boolean, default false) }
//     this is the shape routes/query.routes.js and models/QueryHistory.js will consume later

async function runCRAGPipeline(originalQuery, options = {}) {
    // Step 1: Input guardrails
    const { classification } = await checkPolicyViolation(originalQuery);
if (classification === "policy_violation") {
    return { answer: "I'm sorry, I cannot provide information on that topic.", citedChunkIds: [], groundednessScore: null, attempts: 0, lowConfidence: false };
} else if (classification === "off_topic") {
    return { answer: "This query seems to be outside the scope of the course material.", citedChunkIds: [], groundednessScore: null, attempts: 0, lowConfidence: false };
}

    const { matches: piiMatches } = await detectPII(originalQuery);
let sanitizedQuery = originalQuery;
if (piiMatches.length > 0) {
    sanitizedQuery = maskPII(originalQuery, piiMatches);
}

    // Step 2: Retry loop
    let attempt = 1;
    let finalResult = null;
    let lowConfidence = false;

    while (attempt <= MAX_RETRIES) {
        // a. Retrieve candidates
        const variantResultSets = await retrieveCandidates(sanitizedQuery);
        // b. Rerank candidates
        const chunks = await reciprocalRankFusion(variantResultSets);   

        // c. Generate response
        const { answer, citedChunkIds } = await generateResponse(sanitizedQuery, chunks);

        // d. Score groundedness
        const { score, reason } = await scoreGroundedness(sanitizedQuery, answer, chunks);

        // e. Check if score meets threshold    
        if (score >= GROUNDEDNESS_THRESHOLD) {
            finalResult = { answer, citedChunkIds, groundednessScore: score, attempts: attempt, lowConfidence: false };
            break;
        }

        // f. If score is below threshold and we have retries left  

        if (attempt < MAX_RETRIES) {
            console.warn(`Attempt ${attempt} groundedness score ${score} below threshold. Reason: ${reason}. Retrying...`);
            attempt++;
        } else {
            // g. If score is below threshold and this was the last attempt
            console.warn(`Attempt ${attempt} groundedness score ${score} below threshold. Reason: ${reason}. No more retries left.`);
            finalResult = { answer, citedChunkIds, groundednessScore: score, attempts: attempt, lowConfidence: true };
            break;
        }

    }

    // Step 3: Output guardrails
    const { hasLeak } = await checkPIILeak(finalResult.answer);
if (hasLeak) {
    finalResult.answer = "The generated answer contained sensitive information and has been redacted.";
}

    const outputPolicyResult = await checkOutputPolicy(finalResult.answer);
    if (outputPolicyResult === "unsafe") {
        finalResult.answer = "I'm not able to provide that information.";
    }

    const timestampFormatValid = await checkTimestampFormat(finalResult.answer, finalResult.citedChunkIds);
    if (!timestampFormatValid) {
        console.warn("Timestamp format validation failed for the generated answer.");
    }

    // Step 4: Return final result
    return finalResult;
}


export { runCRAGPipeline }