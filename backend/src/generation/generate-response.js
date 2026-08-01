// Purpose: take the user's original query + top-K reranked chunks (from rerank.js) and produce
// a final grounded answer, with inline citations referencing lecture/module + timestamp so the
// output-side format-safety-check.js guardrail can validate them
//
// Design decisions locked in:
//   - Citations are INLINE in the generated answer text (not attached separately after)
//   - Complete response in one shot (not streamed) — streaming can wrap this later if needed

// Import getModelForStep from ../llm-providers/llm_router.js

import { getModelForStep } from '../llm-providers/llm_router.js';

// Function: buildContextBlock(chunks)
//   - chunks: array of { id, rrfScore, payload } from reciprocalRankFusion()
//   - payload shape varies by source type:
//       - srt/vtt-derived chunks: { module_number, lecture_title, start_time, end_time, source_file, type: "lecture", text }
//       - universal-doc-derived chunks: { source, loc, type: "document", text }
//   - for each chunk, build a labeled context entry the LLM can reference, e.g.:
//       - lecture chunks: "[Source: Module {module_number}, Lecture '{lecture_title}', {start_time}-{end_time}]\n{text}"
//       - document chunks: "[Source: {source}]\n{text}"
//   - join all entries with a clear separator (e.g. "\n---\n") into a single context string
//   - return the joined context string

async function buildContextBlock(chunks) {
    const contextEntries = chunks.map(chunk => {
        if (chunk.payload.type === 'lecture') {
            const { module_number, lecture_title, start_time, end_time, text } = chunk.payload;
            return `[Source: Module ${module_number}, Lecture '${lecture_title}', ${start_time}-${end_time}]\n${text}`;
        } else if (chunk.payload.type === 'document') {
            const { source, text } = chunk.payload;
            return `[Source: ${source}]\n${text}`;
        }
        return '';
    });

    return contextEntries.join('\n---\n');
}



// Function: generateResponse(originalQuery, chunks)
//   - chunks: array of { id, rrfScore, payload } from reciprocalRankFusion() (already top-K, e.g. 5)
//   - Step 1: call buildContextBlock(chunks) to build the labeled context string
//   - Step 2: get model via getModelForStep("generation")
//   - Step 3: build a prompt that:
//       - includes the context block
//       - includes the original user query
//       - instructs the model to answer ONLY using the provided context (no outside knowledge)
//       - instructs the model to cite sources inline after each claim, using the exact format:
//           - for lecture-sourced claims: "(Module {module_number}, {lecture_title}, {start_time})"
//           - for document-sourced claims: "(Source: {source})"
//         so that citations are traceable to a specific chunk's payload
//       - instructs the model: if the context doesn't contain enough information to answer,
//         say so explicitly rather than guessing or using outside knowledge
//   - Step 4: call model.invoke(prompt), read .content
//   - Step 5: return { answer: response.content.trim(), citedChunkIds: chunks.map(c => c.id) }
//     (citedChunkIds is the full list of chunk ids that were available to the model as context —
//     used later by evaluation/mini-model-judge.js and models/QueryHistory.js's citedChunks field;
//     this does NOT try to parse which specific chunks were actually cited inline, just tracks
//     which were available, since parsing free-text citations back to chunk ids reliably is fragile)

async function generateResponse(originalQuery, chunks) {
    // Step 1: build context block
    const contextBlock = await buildContextBlock(chunks);

    // Step 2: get model for generation step
    const model = getModelForStep('generation');

    // Step 3: build prompt
    const prompt = `
You are an AI assistant tasked with answering user queries based solely on the provided context. 
Do not use any outside knowledge or make assumptions beyond what is in the context.

Context:
${contextBlock}

user query: "${originalQuery}"

Instructions:
- Answer the user's query using ONLY the information provided in the context above.
- Cite sources inline after each claim using the following
    formats:
    - For lecture-sourced claims: "(Module {module_number}, {lecture_title}, {start_time})"
    - For document-sourced claims: "(Source: {source})"
- If the context does not contain enough information to answer the query, explicitly state that you cannot answer it based on the provided context.
`;      

    // Step 4: invoke model
    const response = await model.invoke(prompt);

    // Step 5: return answer and cited chunk ids
    return {
        answer: response.content.trim(),
        citedChunkIds: chunks.map(c => c.id)
    };
}       


export { generateResponse, buildContextBlock };


// Note: the returned answer's inline citations are plain text following the format instructed above.
// guardrails/output/format-safety-check.js will later regex-validate that any HH:MM:SS.mmm-shaped
// timestamps in this text match the expected format — worth testing that guardrail against this
// function's actual output once both exist, since prompt-instructed format compliance from an LLM
// is not guaranteed and may need retry logic or post-processing to enforce strictly