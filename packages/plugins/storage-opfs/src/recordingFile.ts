/** Recording file name for an audio mime type ("audio/webm" → recording.webm). */
export function recordingFile(mimeType: string): string {
  const extension = mimeType.includes("webm")
    ? "webm"
    : mimeType.includes("mp4")
      ? "m4a"
      : mimeType.includes("ogg")
        ? "ogg"
        : mimeType.includes("mpeg")
          ? "mp3"
          : "bin";
  return `recording.${extension}`;
}