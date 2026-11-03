import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import type { Log } from "@personal-log/plugin-api";
import { backupAudioPath, backupMetadataPath } from "./backupFileNames";

export interface BackupLogEntry {
  log: Log;
  audio: Blob;
}

export async function packLogFiles(
  entries: BackupLogEntry[],
): Promise<Uint8Array> {
  const files: Record<string, Uint8Array> = {};
  for (const { log, audio } of entries) {
    files[backupMetadataPath(log.id)] = strToU8(JSON.stringify(log));
    files[backupAudioPath(log.id, log.audio.mimeType)] = new Uint8Array(
      await audio.arrayBuffer(),
    );
  }
  return zipSync(files);
}

function isLog(candidate: unknown): candidate is Log {
  const log = candidate as Log;
  return (
    typeof log?.id === "string" &&
    typeof log?.createdAt === "string" &&
    typeof log?.audio?.mimeType === "string" &&
    Array.isArray(log?.transcriptions)
  );
}

export function unpackLogFiles(zip: Uint8Array): BackupLogEntry[] {
  const files = unzipSync(zip);
  const grouped = new Map<
    string,
    { metadata?: Uint8Array; audioPath?: string; audio?: Uint8Array }
  >();
  for (const [path, content] of Object.entries(files)) {
    const match = /^logs\/([^/]+)\/(metadata\.json|recording\..+)$/.exec(path);
    if (!match) {
      continue;
    }
    const [, logId, kind] = match;
    const group = grouped.get(logId) ?? {};
    if (kind === "metadata.json") {
      group.metadata = content;
    } else {
      group.audio = content;
      group.audioPath = path;
    }
    grouped.set(logId, group);
  }
  const entries: BackupLogEntry[] = [];
  for (const group of grouped.values()) {
    if (group.metadata === undefined || group.audio === undefined) {
      continue;
    }
    try {
      const log = JSON.parse(strFromU8(group.metadata)) as unknown;
      if (!isLog(log)) {
        continue;
      }
      entries.push({
        log,
        audio: new Blob([group.audio.slice()], { type: log.audio.mimeType }),
      });
    } catch {
      continue;
    }
  }
  return entries;
}
