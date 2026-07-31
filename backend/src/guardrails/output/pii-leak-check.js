// comment: import { detectPII } from "../input/pii-detector.js" — reuse the same regex detection logic,
//   since checking for PII leakage in the OUTPUT uses the same detection patterns as the input side

import { detectPII } from "../input/pii-detector.js";

// comment: create and export a function checkPIILeak(responseText) that:
//   - calls detectPII(responseText) to check if the final generated response accidentally contains PII
//     (e.g. the LLM echoed back an email/phone from the retrieved chunks or hallucinated one)
//   - returns { hasLeak: boolean, matches } — same shape as detectPII's return value

export const checkPIILeak = (responseText) => {
    const piiResult = detectPII(responseText);
    return { hasLeak: piiResult.containsPII, matches: piiResult.matches };
}

// comment: if hasLeak is true, the calling code (evaluation/c-rag-loop.js) should either mask it
//   using maskPII() before returning to the user, or trigger a retry

