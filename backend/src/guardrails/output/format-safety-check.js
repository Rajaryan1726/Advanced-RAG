// comment: create and export a function checkTimestampFormat(responseText, citedChunks) that:
//   - accepts the final response text and the array of citedChunks (from retrieval/generation)
//   - checks that each citedChunk's start_time/end_time follows the expected HH:MM:SS.mmm format
//     using a regex test: /^\d{2}:\d{2}:\d{2}\.\d{3}$/
//   - checks that if the response text mentions a lecture/timestamp, the citedChunks array is
//     NOT empty (i.e. the response isn't claiming a specific timestamp without backing metadata)
//   - returns { isValid: boolean, issues: [string] } listing any format problems found

export const checkTimestampFormat = (responseText, citedChunks) => {
    const timestampRegex = /^\d{2}:\d{2}:\d{2}\.\d{3}$/;
    const issues = [];

    // Check each citedChunk's start_time and end_time
    citedChunks.forEach((chunk, index) => {
        if (!timestampRegex.test(chunk.start_time)) {   
            issues.push(`Cited chunk ${index} has invalid start_time format: ${chunk.start_time}`);
        }
        if (!timestampRegex.test(chunk.end_time)) {
            issues.push(`Cited chunk ${index} has invalid end_time format: ${chunk.end_time}`);
        }   
    });

    // Check if response text mentions a timestamp but citedChunks is empty
    const timestampMentioned = /\b\d{2}:\d{2}:\d{2}\.\d{3}\b/.test(responseText);
    if (timestampMentioned && citedChunks.length === 0) {
        issues.push("Response text mentions a timestamp, but no cited chunks are provided.");
    }   

    const isValid = issues.length === 0;
    return { isValid, issues };
}


// comment: this is a lightweight, non-LLM structural check — fast and deterministic,
//   run right before the response is sent to the user