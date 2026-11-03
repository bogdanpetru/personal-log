import type { StoragePlugin } from "@personal-log/plugin-api";
import { unpackLogFiles } from "./BackupArchive";

export interface RestoreResult {
  imported: number;
  skipped: number;
}

export async function restoreBackup(
  storage: StoragePlugin,
  file: File,
): Promise<RestoreResult> {
  const entries = unpackLogFiles(new Uint8Array(await file.arrayBuffer()));
  let imported = 0;
  let skipped = 0;
  for (const { log, audio } of entries) {
    const existing = await storage.get(log.id);
    if (existing !== undefined) {
      skipped += 1;
      continue;
    }
    await storage.save(log, { logId: log.id, audio });
    imported += 1;
  }
  return { imported, skipped };
}
