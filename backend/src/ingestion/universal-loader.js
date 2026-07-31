// comment: import PDFLoader from "@langchain/community/document_loaders/fs/pdf"
// comment: import DocxLoader from "@langchain/community/document_loaders/fs/docx"
// comment: import { CSVLoader } from "@langchain/community/document_loaders/fs/csv"
// comment: import { TextLoader } from "langchain/document_loaders/fs/text"
// comment: import path from "path" (node built-in) — used to extract file extension

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import path from "path"; // Node.js built-in module for handling file paths


// comment: create and export an async function loadUniversalFile(filePath) that:
//   - extracts the file extension from filePath using path.extname()
//   - based on extension (.pdf, .docx, .csv, .txt), picks the matching LangChain loader
//   - instantiates the loader with filePath and calls await loader.load()
//   - LangChain loaders return an array of Document objects, each with { pageContent, metadata }
//   - if extension is unsupported, throw a clear error ("Unsupported file type: X")
//   - return the array of loaded Document objects as-is (chunking happens in a separate step

export const loadUniversalFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const loaderMap = {
    ".pdf": PDFLoader,
    ".docx": DocxLoader,
    ".csv": CSVLoader,
    ".txt": TextLoader
  };

  const LoaderClass = loaderMap[ext];
  if (!LoaderClass) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const loader = new LoaderClass(filePath);
  return await loader.load();
};


// comment: note — this function does NOT handle .srt/.vtt files, those go through
//   srt-vtt-loader.js instead — ingestion-service.js decides which loader to call based on extension

