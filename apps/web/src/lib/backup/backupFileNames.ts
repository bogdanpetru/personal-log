export const BACKUP_LOGS_DIR = "logs";
export const BACKUP_METADATA_FILE = "metadata.json";

export function audioRecordingName(mimeType: string): string {
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

export function backupMetadataPath(logId: string): string {
  return `${BACKUP_LOGS_DIR}/${logId}/${BACKUP_METADATA_FILE}`;
}

export function backupAudioPath(logId: string, mimeType: string): string {
  return `${BACKUP_LOGS_DIR}/${logId}/${audioRecordingName(mimeType)}`;
}
