// Purpose: given a relative file path like "module-1/lecture.srt" or "mod_2/lecture.vtt",
// extract the module number from the top-level folder name using a flexible regex.

// Function: extractModuleNumber(relativePath)
//   - split relativePath on "/" (or path.sep) to get the folder segments
//   - take the first segment (top-level folder) as the candidate string
//   - apply regex: /(?:module|mod)[\s_-]?(\d+)/i against that folder name
//   - if a match is found, return Number(match[1])
//   - if no match, return null (caller must handle this — reject the file or flag it
//     for manual correction, don't silently default to some arbitrary module number)

export const extractModuleNumber = (relativePath) => {
  if (!relativePath || typeof relativePath !== "string") {
    return null;
  }

  const segments = relativePath.split(/[/\\]/).filter(Boolean);
  const topLevelFolder = segments[0];

  if (!topLevelFolder) {
    return null;
  }

  const moduleRegex = /(?:module|mod)[\s_-]?(\d+)/i;
  const match = topLevelFolder.match(moduleRegex);

  if (!match) {
    return null;
  }

  return Number(match[1]);
};