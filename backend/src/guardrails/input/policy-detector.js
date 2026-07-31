// comment: import getModelForStep from "../llm-providers/llm_router.js"
import { getModelForStep } from "../../llm-providers/llm_router.js";

// comment: this guardrail is LLM-based (not regex) since "policy violation" is a semantic judgment,
//   not a pattern match — e.g. detecting requests for academic dishonesty, harassment, or
//   off-topic/abusive queries unrelated to the course content



// comment: create and export an async function checkPolicyViolation(queryText) that:
//   - gets a cheap/fast model via getModelForStep("routing") (reuse the same lightweight
//     provider already configured for routing, since this is a similar quick classification task)
//   - sends a prompt asking the model to classify the query as one of: "safe", "off_topic", "policy_violation"
//     with a short reason, formatted as JSON: { classification, reason }
//   - parses the model's JSON response
//   - returns { isViolation: boolean, classification, reason }
//     (isViolation = true only if classification is "policy_violation", NOT for "off_topic" —
//     off-topic queries can still be handled gracefully rather than blocked outright)

export const checkPolicyViolation = async (queryText) => {
    const model = getModelForStep("routing");
    const prompt = `
You are a content moderation assistant. Classify the following user query into one of three categories: "safe", "off_topic", or "policy_violation". Provide a short reason for your classification.

User Query: "${queryText}"
Respond ONLY with valid JSON, no extra text, in this exact format:
{
  "classification": "<one of: safe, off_topic, policy_violation>",
  "reason": "<short reason for classification>"
}`;  

    const response = await model.invoke(prompt);
    const responseText = response.content;

    let classificationResult;
    try {
        // strip markdown code fences if the model wraps JSON in ```json ... ```
        const cleanedText = responseText.replace(/```json|```/g, '').trim();
        classificationResult = JSON.parse(cleanedText);
    } catch (error) {
        console.error("Failed to parse model response as JSON:", responseText);
        return { isViolation: false, classification: "unknown", reason: "Failed to parse model response" };
    }
    
    const { classification, reason } = classificationResult;
    const isViolation = classification === "policy_violation";
    return { isViolation, classification, reason };
}

