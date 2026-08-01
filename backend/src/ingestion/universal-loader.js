// comment: import PDFLoader from "@langchain/community/document_loaders/fs/pdf"
// comment: import DocxLoader from "@langchain/community/document_loaders/fs/docx"
// comment: import { CSVLoader } from "@langchain/community/document_loaders/fs/csv"
// comment: TextLoader does not exist in this installed version — handle .txt manually via
//   fs.readFileSync, with BOM-sniffing to correctly decode both UTF-8 and UTF-16LE files
//   (Windows tools like PowerShell's `echo >` and Notepad default to UTF-16LE, which garbles
//   text if blindly decoded as UTF-8)
// comment: import fs from "node:fs" for manual text reading
// comment: import path from "path" (node built-in) — used to extract file extension

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import fs from "node:fs";
import path from "path";

export const loadUniversalFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".txt") {
    const buffer = fs.readFileSync(filePath);
    // Detect UTF-16 LE BOM (0xFF 0xFE) which Windows tools commonly produce
    const isUtf16LE = buffer[0] === 0xFF && buffer[1] === 0xFE;
    const content = isUtf16LE
      ? buffer.toString("utf16le").replace(/^\uFEFF/, '')
      : buffer.toString("utf-8").replace(/^\uFEFF/, '');
    return [{ pageContent: content, metadata: { source: path.basename(filePath) } }];
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