// comment: import getOpenAIModel from ./openai.js, getGeminiModel from ./gemini.js, getGrokModel from ./grok.js

import { getOpenAIModel } from "./openai.js";
import { getGeminiModel } from "./gemini.js";
import { getGrokModel } from "./grok.js";

// comment: define a config object mapping each pipeline step name to its default provider + model, e.g.:
//   {
//     rewrite:      { provider: "gemini", model: "gemini-1.5-flash" },
//     hyde:         { provider: "openai", model: "gpt-4o" },
//     decompose:    { provider: "grok",   model: "grok-2-latest" },
//     routing:      { provider: "gemini", model: "gemini-1.5-flash" },
//     generation:   { provider: "openai", model: "gpt-4o" },
//     judge:        { provider: "gemini", model: "gemini-1.5-flash" }
//   }

const defaultModelConfig = {
  rewrite:      { provider: "gemini", model: "gemini-flash-latest" },
  hyde:         { provider: "openai", model: "gpt-4o" },
  decompose:    { provider: "grok",   model: "grok-2-latest" },
  routing:      { provider: "gemini", model: "gemini-flash-latest" },
  generation:   { provider: "openai", model: "gpt-4o" },
  judge:        { provider: "gemini", model: "gemini-flash-latest" }
};


// comment: this object is the single place to change which model handles which step —
//   no other file should hardcode a provider directly


// comment: create and export a function getModelForStep(stepName, overrideOptions = {}) that:
//   - looks up stepName in the config object above
//   - if not found, throw a clear error ("No provider configured for step: X")
//   - based on the provider field ("openai" | "gemini" | "grok"), calls the matching
//     getXModel(model, overrideOptions) function from the imported files
//   - returns the resulting LangChain chat model instance, ready to use with .invoke() etc.

const getModelForStep = (stepName, overrideOptions = {}) => {
  const stepConfig = defaultModelConfig[stepName];
  if (!stepConfig) {
    throw new Error(`No provider configured for step: ${stepName}`);
  }

  const { provider, model } = stepConfig;

  switch (provider) {
    case "openai":
      return getOpenAIModel(model, overrideOptions);
    case "gemini":
      return getGeminiModel(model, overrideOptions);
    case "grok":
      return getGrokModel(model, overrideOptions);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
};

export { getModelForStep };


