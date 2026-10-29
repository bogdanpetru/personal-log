import { useEffect, useMemo, useState } from "react";
import type { Log } from "@personal-log/plugin-api";
import { convertRecording } from "@/lib/audio/convertRecording";
import {
  createDownloadFile,
  extensionForMime,
  type AudioFormatId,
} from "@/lib/audio/formats";

interface DownloadFile {
  file: File;
  converting: boolean;
  failed: boolean;
}

export function useDownloadFile(
  log: Log,
  audio: Blob,
  format: AudioFormatId,
): DownloadFile {
  const original = useMemo(
    () => createDownloadFile(log, audio, "original"),
    [log, audio],
  );
  const [prepared, setPrepared] = useState<{
    format: AudioFormatId;
    file: File;
  } | null>(null);
  const [failedFormat, setFailedFormat] = useState<AudioFormatId | null>(null);

  useEffect(() => {
    if (format === "original") {
      return;
    }
    let cancelled = false;
    void convertRecording(audio, format, extensionForMime(log.audio.mimeType))
      .then((converted) => {
        if (!cancelled) {
          setPrepared({
            format,
            file: createDownloadFile(log, converted, format),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailedFormat(format);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [log, audio, format]);

  if (format === "original" || prepared?.format === format) {
    return {
      file: prepared?.format === format ? prepared.file : original,
      converting: false,
      failed: false,
    };
  }

  return {
    file: original,
    converting: failedFormat !== format,
    failed: failedFormat === format,
  };
}
