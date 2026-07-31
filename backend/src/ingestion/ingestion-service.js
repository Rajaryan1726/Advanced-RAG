// comment: import loadUniversalFile from ./universal-loader.js
// comment: import loadSrtVttFile from ./srt-vtt-loader.js
// comment: import path from "path

import { loadUniversalFile } from "./universal-loader.js";
import { loadSrtVttFile } from "./srt-vtt-loader.js";
import path from "path"; // Node.js built-in module for handling file paths

// comment: create and export an async function ingestFile(filePath) that:
//   - extracts the file extension using path.extname(filePath)
//   - if extension is .srt or .vtt → call loadSrtVttFile(filePath), return its result
//   - otherwise → call loadUniversalFile(filePath), return its result
//   - this function is the SINGLE entry point other files (routes/, queue/workers/) should call —
//     they never need to know which specific loader handles which file type

const ingestFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.srt' || ext === '.vtt') {
    return await loadSrtVttFile(filePath);
  }
  return await loadUniversalFile(filePath);
};

export { ingestFile };


// comment: TODO — later, this function's result needs to be passed to the appropriate chunker
//   (time-window-chunker.js for srt/vtt output, text-chunker.js for universal-loader output)
//   that wiring happens in the ingestion worker (queue/workers/ingestion-worker.js), not here —
//   this file's job is ONLY loading/parsing, not chunking or embedding

