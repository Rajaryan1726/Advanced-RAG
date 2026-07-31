// comment: import getModelForStep from "../llm-providers/llm_router.js"
import { getModelForStep } from "../../llm-providers/llm_router.js";


// comment: create and export an async function checkOutputPolicy(responseText) that:
//   - gets a cheap/fast model via getModelForStep("judge") (reuse the same provider config
//     already set up for the Mini-Model judge, since this is a similar lightweight check)
//   - sends a prompt asking the model to check if the response text contains anything
//     inappropriate, harmful, or policy-violating before it's sent back to the user
//   - expects JSON response: { isSafe: boolean, reason: string }
//   - parses the response (strip markdown code fences if present, same pattern as policy-detector.js)
//   - returns { isSafe, reason }


export const checkOutputPolicy = async (responseText) => {
    const model = getModelForStep("judge");
    const prompt = `You are a helpful assistant. Please determine if the following response text contains any inappropriate, harmful, or policy-violating content:

${responseText}

Respond ONLY with valid JSON, no extra text, in this exact format:
{
  "isSafe": <true or false>,
  "reason": "<short reason>"
}`;

    const response = await model.invoke(prompt);
    const responseTextRaw = response.content;

    let result;
    try {
        const cleanedText = responseTextRaw.replace(/```json|```/g, '').trim();
        result = JSON.parse(cleanedText);
    } catch (error) {
        console.error("Failed to parse model response as JSON:", responseTextRaw);
        return { isSafe: true, reason: "Failed to parse model response — defaulting to safe" };
    }

    const { isSafe, reason } = result;
    return { isSafe, reason };
};

