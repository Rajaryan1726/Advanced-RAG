// comment: import ChatOpenAI from @langchain/openai

import { ChatOpenAI } from "@langchain/openai";

// comment: create and export a function getOpenAIModel(modelName, options = {}) that:
//   - returns a new ChatOpenAI instance configured with apiKey: process.env.OPENAI_API_KEY
//   - accepts modelName as a param (e.g. "gpt-4o", "gpt-4o-mini") so caller decides which OpenAI model to use per step
//   - spreads any extra options (temperature, maxTokens, etc.) into the ChatOpenAI constructor

const getOpenAIModel = (modelName, options = {}) => {
  return new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY,
    model: modelName,
    ...options
  });
};

export { getOpenAIModel };


// comment: this function does NOT hardcode a single global model — different pipeline steps


//   (generation vs HyDE) may want different OpenAI models/settings, so keep it flexible

