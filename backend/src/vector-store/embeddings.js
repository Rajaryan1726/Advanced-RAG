// comment: import { OpenAIEmbeddings } from "@langchain/openai"

import { OpenAIEmbeddings } from "@langchain/openai";

// comment: create and export a function getEmbeddingModel() that:
//   - returns a new OpenAIEmbeddings instance configured with:
//     model: "text-embedding-3-small", apiKey: process.env.OPENAI_API_KEY

const getEmbeddingModel = () => {
  return new OpenAIEmbeddings({
    model: "text-embedding-3-small",
    apiKey: process.env.OPENAI_API_KEY,
  });
}   



// comment: create and export an async function embedTexts(textArray) that:
//   - accepts an array of plain strings (chunk_text values)
//   - calls getEmbeddingModel().embedDocuments(textArray) — LangChain's batch embedding method
//   - returns an array of embedding vectors (arrays of floats), same order as input textArray


const embedTexts = async (textArray) => {
  const embeddingModel = getEmbeddingModel();
  const embeddings = await embeddingModel.embedDocuments(textArray);
  return embeddings;
}


// comment: create and export an async function embedSingleText(text) that:
//   - accepts a single string (used for embedding the user's query at retrieval time)
//   - calls getEmbeddingModel().embedQuery(text)
//   - returns a single embedding vector (array of floats)

const embedSingleText = async (text) => {
  const embeddingModel = getEmbeddingModel();
  const embedding = await embeddingModel.embedQuery(text);
  return embedding;
}


export { getEmbeddingModel, embedTexts, embedSingleText };