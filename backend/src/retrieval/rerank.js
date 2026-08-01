// Purpose: take the multiple ranked result lists from retriever.js (one per query variant)
// and merge them into a single ranked list using Reciprocal Rank Fusion (RRF), then return
// the top-K final chunks to pass into generation
//
// RRF formula: for each unique document/chunk, score = sum over all lists it appears in of
//   1 / (k + rank_in_that_list), where k is a constant (60 is the standard default from the
//   original RRF paper) and rank_in_that_list is 1-indexed position in that list
//
// All query variants are weighted EQUALLY (no boost for original query vs derived variants)


// Function: reciprocalRankFusion(variantResultSets, options = {})
//   - variantResultSets: the array returned by retriever.js's retrieveCandidates()
//     i.e. array of { variantText, results: [{ id, score, payload }, ...] }
//   - options may include k (RRF constant, default 60) and topK (final result count, default 5)
//   - Step 1: build a map keyed by chunk id (use result.id as the key, since the same chunk
//     may appear in multiple variant result lists)
//   - Step 2: for each variant's results array, iterate with 1-indexed rank position:
//       - for each chunk, compute rrfContribution = 1 / (k + rank)
//       - add rrfContribution to that chunk's running total score in the map
//       - if this is the first time seeing this chunk id, also store its payload
//         (metadata like lecture title, timestamp, source, etc — needed later for citation)
//   - Step 3: convert the map to an array of { id, rrfScore, payload }, sort descending by rrfScore
//   - Step 4: return the top-K (default 5) entries from the sorted array

async function reciprocalRankFusion(variantResultSets, options = {}) {
    const k = options.k || 60;
    const topK = options.topK || 5;

    // Step 1: build a map keyed by chunk id
    const chunkScoreMap = new Map();

    // Step 2: iterate over each variant's results
    for (const { variantText, results } of variantResultSets) {
        results.forEach((result, index) => {
            const rank = index + 1; // 1-indexed rank
            const rrfContribution = 1 / (k + rank);

            if (chunkScoreMap.has(result.id)) {
                const existingEntry = chunkScoreMap.get(result.id);
                existingEntry.rrfScore += rrfContribution;
            } else {
                chunkScoreMap.set(result.id, {
                    rrfScore: rrfContribution,
                    payload: result.payload
                });
            }   
    });
    }   

    // Step 3: convert the map to an array and sort descending by rrfScore
    const sortedChunks = Array.from(chunkScoreMap.entries())
        .map(([id, { rrfScore, payload }]) => ({ id, rrfScore, payload }))
        .sort((a, b) => b.rrfScore - a.rrfScore);   

    // Step 4: return the top-K entries
    return sortedChunks.slice(0, topK);
}   

export { reciprocalRankFusion };



// Note: original vector similarity scores (from Qdrant) are NOT used directly in RRF — only
// rank position matters. This is intentional; RRF is designed to combine differently-scaled
// ranking lists (which is exactly the situation here, since original/rewritten/stepback/hyde
// queries may produce very different score distributions)