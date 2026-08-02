import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { PPTXLoader } from "@langchain/community/document_loaders/fs/pptx";
import fs from "node:fs";
import path from "path";

export const loadUniversalFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".txt") {
    const buffer = fs.readFileSync(filePath);
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
    ".pptx": PPTXLoader,
  };

  const LoaderClass = loaderMap[ext];
  if (!LoaderClass) {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const loader = new LoaderClass(filePath);
  return await loader.load();
};