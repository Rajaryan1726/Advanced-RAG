// comment: import ChatOpenAI from @langchain/openai — Grok has no native LangChain integration,
//   but its API is OpenAI SDK-compatible, so we reuse the OpenAI client pointed at Grok's endpoint


import { ChatOpenAI } from "@langchain/openai";


// comment: create and export a function getGrokModel(modelName, options = {}) that:
//   - returns a new ChatOpenAI instance configured with:
//     - apiKey: process.env.GROK_API_KEY
//     - configuration: { baseURL: process.env.GROK_BASE_URL }  (this is the key part that redirects requests to Grok instead of OpenAI)
//   - accepts modelName as a param (e.g. "grok-2-latest")
//   - spreads any extra options into the constructor

const getGrokModel = (modelName, options = {}) => {
  return new ChatOpenAI({
    openAIApiKey: process.env.GROK_API_KEY, 
    model: modelName,
    configuration: {
      baseURL: process.env.GROK_BASE_URL, // Redirects requests to Grok's API endpoint
    },
    ...options
  });
};

export { getGrokModel };
