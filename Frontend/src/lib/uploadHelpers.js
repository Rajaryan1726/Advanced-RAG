// Pure helper functions, no React, no API calls.
// - Export function `fileListToRelativePaths(fileList)`:
//   Takes a FileList (from an <input type="file" webkitdirectory> element).
//   Each File object has a `.webkitRelativePath` property (e.g.
//   "class-subtitle/module 1/01_what-is-mobile-development/file.srt").
//   Return an array of objects: [{ file, relativePath }] where relativePath
//   is exactly file.webkitRelativePath (don't strip or modify it — backend's
//   manifest route does the module-number regex extraction from this string).
// - Export function `filterSupportedFiles(entries)`:
//   Takes the array from fileListToRelativePaths. Filters out any entry
//   whose relativePath doesn't end in .srt, .vtt, .pdf, .docx, .csv, or .txt
//   (case-insensitive). Return the filtered array. This prevents junk files
//   like .DS_Store or Thumbs.db (which webkitdirectory can pick up) from
//   being sent to the manifest endpoint.

const SUPPORTED_EXTENSIONS = ['.srt', '.vtt', '.pdf', '.docx', '.csv', '.txt'];

export function fileListToRelativePaths(fileList) {
    const filesWithRelativePaths = [];
    for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        filesWithRelativePaths.push({ file, relativePath: file.webkitRelativePath });
    }

    return filesWithRelativePaths;
}

export function filterSupportedFiles(entries) {
    return entries.filter(entry => {
        const lowerCasePath = entry.relativePath.toLowerCase();
        return SUPPORTED_EXTENSIONS.some(ext => lowerCasePath.endsWith(ext));
    });
}

