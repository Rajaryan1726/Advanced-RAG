// comment: import PDFLoader from "@langchain/community/document_loaders/fs/pdf"
// comment: import DocxLoader from "@langchain/community/document_loaders/fs/docx"
// comment: import { CSVLoader } from "@langchain/community/document_loaders/fs/csv"
// comment: TextLoader does not exist in this installed version of @langchain/community or langchain —
//   handle .txt manually via fs.readFileSync, wrapped into the same { pageContent, metadata } shape
//   that LangChain Document loaders return, so downstream chunking code doesn't need special-casing
// comment: import fs from "node:fs" for manual text reading
// comment: import path from "path" (node built-in) — used to extract file extension

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import fs from "node:fs";
import path from "path";

// comment: create and export an async function loadUniversalFile(filePath) that:
//   - extracts the file extension from filePath using path.extname()
//   - based on extension (.pdf, .docx, .csv, .txt), picks the matching LangChain loader
//   - for .txt: reads the file manually and wraps it into a single-element array matching
//     LangChain's Document shape: [{ pageContent: string, metadata: { source: filePath } }]
//   - for .pdf/.docx/.csv: instantiates the matching loader with filePath, calls await loader.load()
//   - LangChain loaders return an array of Document objects, each with { pageContent, metadata }
//   - if extension is unsupported, throw a clear error ("Unsupported file type: X")
//   - return the array of loaded Document objects as-is (chunking happens in a separate step)

export const loadUniversalFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".txt") {
    const content = fs.readFileSync(filePath, "utf-8");
    return [{ pageContent: content, metadata: { source: filePath } }];
  }

  const loaderMap = {
    ".pdf": PDFLoader,
    ".docx": DocxLoader,
    ".csv": CSVLoader,
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