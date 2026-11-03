import { useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { useTranslation } from "@/hooks/useTranslation";
import { exportBackup } from "@/lib/backup/exportBackup";
import { restoreBackup } from "@/lib/backup/restoreBackup";
import { shareBackupFile } from "@/lib/backup/shareBackupFile";
import type { MessageKey } from "@/lib/i18n/translate";
import { logStorage } from "@/lib/logStorage";
import { personalLogCore } from "@/lib/personalLogCore";

type BackupStatus =
  | { kind: "done"; imported: number; skipped: number }
  | { kind: "error"; message: MessageKey }
  | null;

type BusyAction = "export" | "restore" | null;

export function BackupSection() {
  const { t } = useTranslation();
  const [busy, setBusy] = useState<BusyAction>(null);
  const [status, setStatus] = useState<BackupStatus>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setBusy("export");
    setStatus(null);
    try {
      shareBackupFile(await exportBackup(personalLogCore));
    } catch {
      setStatus({ kind: "error", message: "settings.backupExportFailed" });
    } finally {
      setBusy(null);
    }
  };

  const handleRestoreFile = async (file: File) => {
    setBusy("restore");
    setStatus(null);
    try {
      const result = await restoreBackup(logStorage, file);
      setStatus({ kind: "done", ...result });
    } catch {
      setStatus({ kind: "error", message: "settings.backupRestoreFailed" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy !== null}
        onClick={() => void handleExport()}
      >
        {t(busy === "export" ? "settings.backupExporting" : "settings.backupExport")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={busy !== null}
        onClick={() => fileInput.current?.click()}
      >
        {t(busy === "restore" ? "settings.backupRestoring" : "settings.backupRestore")}
      </Button>
      <input
        ref={fileInput}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        aria-hidden
        tabIndex={-1}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) {
            void handleRestoreFile(file);
          }
        }}
      />
      {status === null ? null : status.kind === "done" ? (
        <Text as="p" size="xs">
          {t("settings.backupRestoreDone", {
            imported: status.imported,
            skipped: status.skipped,
          })}
        </Text>
      ) : (
        <Text as="p" size="xs">
          {t(status.message)}
        </Text>
      )}
    </div>
  );
}
