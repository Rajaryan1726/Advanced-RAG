// comment: import { qdrantClient } from "../config/qdrant.js"
// comment: import { embedSingleText } from "./embeddings.js"

import { qdrantClient } from "../config/qdrant.js";
import { embedSingleText } from "./embeddings.js";

// comment: create and export an async function queryVectorStore(collectionName, queryText, topK = 120) that:
//   - calls await embedSingleText(queryText) to get the query's embedding vector
//   - calls await qdrantClient.search(collectionName, { vector: queryEmbedding, limit: topK, with_payload: true })
//   - returns the raw search results array — each result has { id, score, payload }
//     (payload contains the metadata + text stored during upsert)

const queryVectorStore = async (collectionName, queryText, topK = 120) => {
  // Get the embedding for the query text
  const queryEmbedding = await embedSingleText(queryText);

  // Search the vector store
  const results = await qdrantClient.search(collectionName, {
    vector: queryEmbedding,
    limit: topK,
    with_payload: true
  });

  return results;
};

export { queryVectorStore };



// comment: note — topK defaults to 120 here because per the architecture, retrieval pulls
//   ~120 candidate chunks BEFORE reranking narrows them down to top-5 — reranking happens
//   in a separate retrieval/rerank.js file later, this function just does raw vector search

