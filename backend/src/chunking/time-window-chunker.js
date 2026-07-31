// comment: this chunker works on the `cues` array output from srt-vtt-loader.js
//   (shape: [{ start_time, end_time, text }, ...]) — NOT on LangChain Document objects

// comment: create and export a helper function timeToSeconds(timeString) that:
//   - converts a timestamp string (format: HH:MM:SS.mmm) into total seconds as a float
//   - needed because cues need to be compared/added numerically to build fixed time windows
const timeToSeconds = (timeString) => {
  const [hms, ms] = timeString.split('.');
  const [hours, minutes, seconds] = hms.split(':').map(Number);
  const milliseconds = ms ? Number(ms) : 0;
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};

// comment: create and export a helper function secondsToTimeString(totalSeconds) that:
//   - does the reverse of timeToSeconds — converts a float seconds value back into
//     HH:MM:SS.mmm format, used when storing final chunk start_time/end_time as readable strings
const secondsToTimeString = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

  const pad = (num, len = 2) => String(num).padStart(len, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
};

// comment: create and export a function chunkCuesByTimeWindow(cues, windowSeconds = 40, overlapSeconds = 5) that:
//   - returns an empty array immediately if cues is empty or undefined
//   - finds the total timeline span: starts from the first cue's start_time,
//     ends at the last cue's end_time (converted to seconds using timeToSeconds)
//   - loops using a while condition: continues as long as windowStartSeconds is before the last cue's end
//   - for each iteration, defines a windowEndSeconds = windowStartSeconds + windowSeconds
//   - filters cues whose start_time falls within [windowStartSeconds, windowEndSeconds) —
//     these become the cues belonging to the current window
//   - if the window has at least one cue:
//     - takes the first cue's start_time as the chunk's start_time
//     - takes the last cue's end_time as the chunk's end_time
//     - joins all cue texts with a space to form chunk_text
//     - pushes { start_time, end_time, chunk_text } into the chunks array
//   - after processing the window, advances windowStartSeconds forward by (windowSeconds - overlapSeconds)
//     instead of a full windowSeconds jump — this smaller step is what creates the ~5s overlap
//     between consecutive windows, since the next window starts before the current one fully ends
//   - returns the final chunks array once the loop ends

const chunkCuesByTimeWindow = (cues, windowSeconds = 40, overlapSeconds = 5) => {
  if (!cues || cues.length === 0) return [];

  const chunks = [];
  const totalCues = cues.length;
  let windowStartSeconds = timeToSeconds(cues[0].start_time);
  const lastCueEndSeconds = timeToSeconds(cues[totalCues - 1].end_time);

  while (windowStartSeconds < lastCueEndSeconds) {
    const windowEndSeconds = windowStartSeconds + windowSeconds;

    const cuesInWindow = cues.filter((cue) => {
      const cueStart = timeToSeconds(cue.start_time);
      return cueStart >= windowStartSeconds && cueStart < windowEndSeconds;
    });

    if (cuesInWindow.length > 0) {
      const chunkStart = cuesInWindow[0].start_time;
      const chunkEnd = cuesInWindow[cuesInWindow.length - 1].end_time;
      const chunkText = cuesInWindow.map((c) => c.text).join(' ');

      chunks.push({
        start_time: chunkStart,
        end_time: chunkEnd,
        chunk_text: chunkText
      });
    }

    windowStartSeconds += (windowSeconds - overlapSeconds);
  }

  return chunks;
};

// comment: create and export a function buildChunkMetadata(timeWindowChunks, lectureInfo) that:
//   - accepts the output of chunkCuesByTimeWindow() and the lectureInfo object from
//     srt-vtt-loader.js (module_number, lecture_title, source_file)
//   - merges each time-window chunk with the lecture-level metadata to produce the final
//     chunk shape needed for vector-store upsert:
//     { module_number, lecture_title, start_time, end_time, chunk_text, source_file }
//   - returns this final array, ready to be passed to embeddings + vector-store/upsert.js
const buildChunkMetadata = (timeWindowChunks, lectureInfo) => {
  const { module_number, lecture_title, source_file } = lectureInfo;

  return timeWindowChunks.map((chunk) => ({
    module_number,
    lecture_title,
    start_time: chunk.start_time,
    end_time: chunk.end_time,
    chunk_text: chunk.chunk_text,
    source_file
  }));
};

export {
  timeToSeconds,
  secondsToTimeString,
  chunkCuesByTimeWindow,
  buildChunkMetadata
};