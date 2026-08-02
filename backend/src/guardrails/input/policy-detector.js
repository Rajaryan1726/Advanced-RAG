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
You are a content moderation assistant for an educational RAG system. This system lets students upload their own course materials (lecture transcripts, slides, documents) on ANY academic or technical subject — it is not limited to a single fixed topic. The subject matter varies per user based on what they've uploaded (e.g. programming, data structures, mobile development, or any other academic subject).

Classify the following user query into one of three categories:
- "safe" — a legitimate academic, technical, or educational question that could plausibly relate to course material of any kind (programming, computer science concepts, general academic subjects, etc.), OR a normal conversational message related to using the app
- "off_topic" — a question clearly unrelated to any educational/academic context (e.g. cooking recipes, celebrity gossip, unrelated small talk with no learning intent)
- "policy_violation" — a request for harmful, unethical, illegal, or inappropriate content (not just an off-topic subject)

Do NOT assume a specific narrow subject (like only React or only mobile development) — treat any programming, computer science, or general academic topic as potentially "safe" unless it is clearly unrelated to learning/education.

Provide a short reason for your classification.

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