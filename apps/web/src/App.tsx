import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { LogListView } from "@/views/LogListView";
import { LogView } from "@/views/LogView";
import { RecorderView } from "@/views/RecorderView";
import { usePersonalLog } from "@/hooks/usePersonalLog";
import type { LogId } from "@personal-log/plugin-api";

type AppMode = "list" | "record" | "view";

export default function App() {
  const {
    logs,
    refreshLogs,
    loadLogData,
    deleteLog,
    finishedLog,
    playbackSrc,
  } = usePersonalLog();
  const [mode, setMode] = useState<AppMode>("list");

  useEffect(() => {
    void refreshLogs().then((loaded) => {
      if (loaded.length === 0) {
        setMode("record");
      }
    });
  }, [refreshLogs]);

  const handleRecorded = useCallback(() => {
    void refreshLogs();
    setMode("view");
  }, [refreshLogs]);

  const handleOpen = useCallback(
    async (logId: LogId) => {
      const loaded = await loadLogData(logId);
      if (loaded === undefined) {
        return;
      }
      setMode("view");
    },
    [loadLogData],
  );

  const handleDelete = useCallback(
    async (logId: LogId) => {
      await deleteLog(logId);
      setMode(logs.length <= 1 ? "record" : "list");
    },
    [deleteLog, logs.length],
  );

  const handleBackToList = useCallback(() => {
    setMode("list");
  }, []);

  const handleNew = useCallback(() => {
    setMode("record");
  }, []);

  if (mode === "record") {
    return (
      <RecorderView
        onRecorded={handleRecorded}
        onBack={logs.length > 0 ? handleBackToList : undefined}
      />
    );
  }

  if (mode === "view" && finishedLog !== null && playbackSrc !== null) {
    return (
      <LogView
        log={finishedLog}
        audioUrl={playbackSrc}
        onBack={handleBackToList}
      />
    );
  }

  const header = (
    <Button type="button" className="ml-auto" onClick={handleNew}>
      New
    </Button>
  );

  return (
    <AppShell header={header}>
      <div className="min-h-0 w-full flex-1 overflow-y-auto pb-6">
        <LogListView logs={logs} onOpen={handleOpen} onDelete={handleDelete} />
      </div>
    </AppShell>
  );
}