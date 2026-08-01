// Purpose: given the original user query, run all query-transform strategies in parallel,
// then fan out a Qdrant vector search for each resulting query variant, and return all
// candidate chunks (unranked/unmerged — rerank.js handles merging) for downstream reranking
//
// This file handles ONLY semantic/vector search. It does NOT handle history or raw_document
// branches — those are resolved separately by a future orchestrator (c-rag-loop.js) that also
// calls routeQuery() and merges in results from other sources when relevant.

// Import rewriteQuery from ../query-transform/rewrite.js
// Import generateStepBackQuery from ../query-transform/step-back.js
// Import decomposeQuery from ../query-transform/decompose.js
// Import generateHypotheticalDocument from ../query-transform/hyde.js
// Import queryVectorStore from ../vector-store/query.js

import { rewriteQuery } from '../query-transform/rewrite.js';
import { generateStepBackQuery } from '../query-transform/step-back.js';
import { decomposeQuery } from '../query-transform/decompose.js';
import { generateHypotheticalDocument } from '../query-transform/hyde.js';
import { queryVectorStore } from '../vector-store/query.js';

// Function: retrieveCandidates(originalQuery, options = {})
//   - options may include topK (default 120, matches queryVectorStore's existing default)
//   - Step 1: run all transforms in parallel via Promise.all:
//       - rewriteQuery(originalQuery) -> rewrittenQuery (string)
//       - generateStepBackQuery(originalQuery) -> stepBackQuery (string)
//       - decomposeQuery(originalQuery) -> subQueries (array of strings)
//       - generateHypotheticalDocument(originalQuery) -> hydeText (string)
//   - Step 2: build a single flat array of "query variants" to search:
//       [originalQuery, rewrittenQuery, stepBackQuery, ...subQueries, hydeText]
//     - dedupe identical strings (e.g. if rewriteQuery returned the same string as originalQuery,
//       don't search it twice) using a Set or filter
//   - Step 3: for each variant, call queryVectorStore("rag-documents", variant, options.topK)
//     in parallel via Promise.all — each call returns an array of { id, score, payload } results
//   - Step 4: tag each result set with which variant produced it, e.g.:
//       { variantIndex, variantText, results: [...] }
//     (rerank.js needs to know which list each result came from, to do RRF properly)
//   - Step 5: if any individual variant's search call fails (e.g. one embedding call errors),
//     catch that one failure and log a warning, but do NOT let it fail the whole function —
//     return results from the variants that succeeded (partial results are better than none)
//   - Return: array of { variantText, results } objects, one per successfully-searched variant
//

async function retrieveCandidates(originalQuery, options = {}) {
  const topK = options.topK || 120;

    // Step 1: run all transforms in parallel       

    const [rewrittenQuery, stepBackQuery, subQueries, hydeText] = await Promise.all([
        rewriteQuery(originalQuery),
        generateStepBackQuery(originalQuery),
        decomposeQuery(originalQuery),
        generateHypotheticalDocument(originalQuery)
    ]); 

    // Step 2: build a single flat array of "query variants" to search
    const queryVariants = [
        originalQuery,
        rewrittenQuery,
        stepBackQuery,
        ...subQueries,
        hydeText
    ].filter((q, index, self) => q && self.indexOf(q) === index); // dedupe and remove empty strings    


    // Step 3: for each variant, call queryVectorStore in parallel
    const searchPromises = queryVariants.map(async (variantText, variantIndex) => {
        try {
            const results = await queryVectorStore('lecture-transcripts', variantText, topK);
            return { variantIndex, variantText, results };
        } catch (error) {
            console.warn(`Vector search failed for variant "${variantText}":`, error);
            return null; // Return null for this variant to indicate failure
        }
    });     

    // Step 4: wait for all search promises to resolve
    const searchResults = await Promise.all(searchPromises);

    // Step 5: filter out any null results (failed searches)
    const successfulResults = searchResults.filter(result => result !== null);

    return successfulResults;
}

export { retrieveCandidates };  


// Note: this will make 5-8+ separate embedding + search calls per user query, as previously
// flagged — worth monitoring latency/cost once this is live end-to-end