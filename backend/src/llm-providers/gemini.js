// comment: import ChatGoogleGenerativeAI from @langchain/google-genai

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// comment: create and export a function getGeminiModel(modelName, options = {}) that:
//   - returns a new ChatGoogleGenerativeAI instance configured with apiKey: process.env.GEMINI_API_KEY
//   - accepts modelName as a param (e.g. "gemini-1.5-flash", "gemini-1.5-pro")
//   - spreads any extra options (temperature, etc.) into the constructor

const getGeminiModel = (modelName, options = {}) => {
  return new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: modelName,
    ...options
  });
};

export { getGeminiModel };
