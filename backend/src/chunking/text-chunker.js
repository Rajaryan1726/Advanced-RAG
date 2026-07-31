// comment: import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"

import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

// comment: create and export an async function chunkDocuments(documents, options = {}) that:
//   - accepts an array of LangChain Document objects (the output of universal-loader.js, each with { pageContent, metadata })
//   - accepts optional chunkSize (default 1000) and chunkOverlap (default 150) via options
//   - creates a new RecursiveCharacterTextSplitter instance with { chunkSize, chunkOverlap }
//   - calls await splitter.splitDocuments(documents) — this preserves each original Document's
//     metadata (e.g. source file path, page number) onto every resulting chunk automatically
//   - returns the resulting array of chunked Document objects, each still shaped as { pageContent, metadata }

const chunkDocuments = async (documents, options = {}) => {
  const { chunkSize = 1000, chunkOverlap = 150 } = options;
  const splitter = new RecursiveCharacterTextSplitter({ chunkSize, chunkOverlap });
  const chunkedDocuments = await splitter.splitDocuments(documents);
  return chunkedDocuments;
}


export { chunkDocuments };

// comment: note — chunkSize/chunkOverlap are character-based, not token-based; 1000/150 is a
//   reasonable starting default for general text documents, can be tuned later per file type if needed

