// comment: import fs from "fs" (node built-in) to read raw file content
// comment: import path from "path" — used to extract module_number and lecture info from the file's folder structure
//   (recall folder structure: class-subtitle/module N/lecture-folder-name/file.srt)

import fs from "fs";
import path from "path";

// comment: create and export a function parseSrtContent(rawText) that:
//   - splits the raw SRT text into individual cue blocks (cues are separated by blank lines)
//   - for each cue block, extracts: sequence number, start_time, end_time (format: HH:MM:SS,mmm --> HH:MM:SS,mmm),
//     and the spoken text lines that follow
//   - converts SRT timestamp format (comma for ms) into a consistent format (e.g. total seconds, or HH:MM:SS.mmm)
//   - returns an array of cue objects: [{ start_time, end_time, text }, ...]

const parseSrtContent = (rawText) => {
  const cueBlocks = rawText.split(/\r?\n\r?\n/);
    const cues = cueBlocks.map((block) => {
        const lines = block.split(/\r?\n/).filter(line => line.trim() !== '');
        if (lines.length < 2) return null; // Skip invalid blocks

        const [sequence, timeRange, ...textLines] = lines;
        const [startTime, endTime] = timeRange.split(' --> ').map(time => time.replace(',', '.'));  
        const text = textLines.join(' ');
        return { start_time: startTime, end_time: endTime, text };
    }).filter(Boolean);
    return cues;
};

export { parseSrtContent };


// comment: create and export a function parseVttContent(rawText) that:
//   - same as parseSrtContent but handles VTT format differences:
//     - strips the "WEBVTT" header line at the top
//     - VTT timestamps use dots instead of commas for ms (HH:MM:SS.mmm --> HH:MM:SS.mmm)
//   - returns cue objects in the SAME shape as parseSrtContent, so downstream code doesn't care which format was parsed


const parseVttContent = (rawText) => {
  const cleanedText = rawText.replace(/^WEBVTT\s*\r?\n/, '');
  const cueBlocks = cleanedText.split(/\r?\n\r?\n/);

  const cues = cueBlocks.map((block) => {
    const lines = block.split(/\r?\n/).filter(line => line.trim() !== '');

    // find the line containing the timestamp arrow, instead of assuming a fixed position
    const timeLineIndex = lines.findIndex(line => line.includes('-->'));
    if (timeLineIndex === -1) return null; // no timestamp line found, skip this block

    const timeRange = lines[timeLineIndex];
    const textLines = lines.slice(timeLineIndex + 1);

    const [startTime, endTime] = timeRange.split(' --> ').map(time => time.trim());
    const text = textLines.join(' ').trim();

    if (!startTime || !endTime || !text) return null; // skip malformed cues

    return { start_time: startTime, end_time: endTime, text };
  }).filter(Boolean);

  return cues;
};

export { parseVttContent };



// comment: create and export an async function loadSrtVttFile(filePath) that:
//   - reads the raw file content using fs.readFileSync(filePath, 'utf-8')
//   - determines whether it's .srt or .vtt based on file extension, calls the matching parser
//   - extracts module_number from the folder structure: the parent-of-parent folder name (e.g. "module 1")
//   - extracts lecture_number/lecture_title from the immediate parent folder name (e.g. "01_what-is-mobile-development_epm")
//   - returns an object: { module_number, lecture_title, cues: [...], source_file: filePath }
//   - this raw cue-level output is NOT yet chunked — that happens in chunking/time-window-chunker.js next

const loadSrtVttFile = async (filePath) => {
  const rawText = fs.readFileSync(filePath, 'utf-8');
  const ext = path.extname(filePath).toLowerCase();
  let cues;

  if (ext === '.srt') {
    cues = parseSrtContent(rawText);
  } else if (ext === '.vtt') {
    cues = parseVttContent(rawText);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  // Extract module_number and lecture_title from the folder structure
  const fileDir = path.dirname(filePath);
  const parentDir = path.basename(fileDir);
  const grandParentDir = path.basename(path.dirname(fileDir));

  return {
    module_number: grandParentDir,
    lecture_title: parentDir,
    cues,
    source_file: filePath
  };
};

export { loadSrtVttFile };
