import type { PersonalLog } from "@personal-log/core";
import type { Log } from "@personal-log/plugin-api";
import { packLogFiles, type BackupLogEntry } from "./BackupArchive";

const PAGE_SIZE = 100;

async function collectLogs(
  core: Pick<PersonalLog, "getLogs">,
): Promise<Log[]> {
  const all: Log[] = [];
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const page = await core.getLogs({ skip, limit: PAGE_SIZE });
    all.push(...page);
    if (page.length < PAGE_SIZE) {
      return all;
    }
  }
}

export async function exportBackup(
  core: Pick<PersonalLog, "getLogs" | "getLogData">,
): Promise<File> {
  const logs = await collectLogs(core);
  const entries: BackupLogEntry[] = [];
  for (const log of logs) {
    const data = await core.getLogData(log.id);
    if (data !== undefined) {
      entries.push({ log, audio: data.audio });
    }
  }
  const zip = await packLogFiles(entries);
  const date = new Date().toISOString().slice(0, 10);
  return new File([zip as unknown as BlobPart], `personal-log-backup-${date}.zip`, {
    type: "application/zip",
  });
}
