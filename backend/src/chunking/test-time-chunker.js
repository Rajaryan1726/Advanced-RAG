import { chunkCuesByTimeWindow, buildChunkMetadata } from "./time-window-chunker.js";

// fake sample cues — jaisa srt-vtt-loader.js output karega
const sampleCues = [
  { start_time: "00:00:00.000", end_time: "00:00:05.000", text: "Hello everyone welcome" },
  { start_time: "00:00:05.000", end_time: "00:00:12.000", text: "today we will learn about React Native" },
  { start_time: "00:00:12.000", end_time: "00:00:20.000", text: "which is a cross platform framework" },
  { start_time: "00:00:20.000", end_time: "00:00:30.000", text: "used to build mobile applications" },
  { start_time: "00:00:30.000", end_time: "00:00:38.000", text: "using JavaScript and React concepts" },
  { start_time: "00:00:38.000", end_time: "00:00:45.000", text: "let's get started with the basics" },
  { start_time: "00:00:45.000", end_time: "00:00:55.000", text: "first we need to install expo cli" },
  { start_time: "00:00:55.000", end_time: "00:01:05.000", text: "and then create a new project" },
];

const timeChunks = chunkCuesByTimeWindow(sampleCues, 40, 5);
console.log("Time window chunks:");
console.log(JSON.stringify(timeChunks, null, 2));

const finalChunks = buildChunkMetadata(timeChunks, {
  module_number: "module 1",
  lecture_title: "01_what-is-mobile-development_epm",
  source_file: "test.srt"
});

console.log("\nFinal chunks with metadata:");
console.log(JSON.stringify(finalChunks, null, 2));