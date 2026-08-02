// comment: create and export a function detectPII(text) that:
//   - checks the input text against a set of regex patterns for common PII types:
//     - email addresses
//     - phone numbers (Indian format: 10 digits, optionally with +91 prefix)
//     - credit card numbers (basic 16-digit pattern)
//     - Aadhaar-like 12-digit number patterns (optional, since this is an Indian context)
//   - returns an object: { containsPII: boolean, matches: [{ type, value }] }
//     listing which PII types were found and their matched values (for masking later)

export const detectPII = (text) => {
    const piiPatterns = [
        { type: 'email', pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
        // Requires a non-digit boundary on both sides and an Indian mobile
        // prefix (6-9) to avoid false-triggering on random 10-digit
        // sequences that show up in code/pseudocode (array literals, loop
        // bounds, etc.)
        { type: 'phone', pattern: /(?<!\d)(?:\+91[-\s]?)?[6-9]\d{9}(?!\d)/g },
        { type: 'credit_card', pattern: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g },
        { type: 'aadhaar', pattern: /\b[2-9]\d{3}[-\s]?\d{4}[-\s]?\d{4}\b/g }
    ];
    const matches = [];
    let containsPII = false;

    piiPatterns.forEach(({ type, pattern }) => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            containsPII = true;
            matches.push({ type, value: match[0] });
        }
    });

    return { containsPII, matches };
};

// comment: note — this is a regex-based approach, not an LLM call, since PII detection
//   needs to be fast and deterministic on every single query before it reaches the LLM at all


// comment: create and export a function maskPII(text, matches) that:
//   - accepts the original text and the matches array from detectPII()
//   - replaces each matched PII value in the text with a placeholder like "[REDACTED_EMAIL]", "[REDACTED_PHONE]" etc.
//   - returns the masked text, safe to pass further into the pipeline

export const maskPII = (text, matches) => {
    let maskedText = text;
    matches.forEach(({ type, value }) => {
        const placeholder = `[REDACTED_${type.toUpperCase()}]`;
        const escapedValue = value.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(escapedValue, 'g');
        maskedText = maskedText.replace(regex, placeholder);
    });
    return maskedText;
}