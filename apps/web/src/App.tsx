import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { usePersonalLog } from "@/hooks/usePersonalLog";
import { LogListView } from "@/views/LogListView";
import { LogViewRoute } from "@/views/LogView";
import { RecorderView } from "@/views/RecorderView";
import type { LogId } from "@personal-log/plugin-api";

export default function App() {
  const { core, logs, refreshLogs, deleteLog } = usePersonalLog();
  const navigate = useNavigate();
  const location = useLocation();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void refreshLogs().finally(() => setLoaded(true));
  }, [location.pathname, refreshLogs]);

  useEffect(
    () =>
      core.on("recorded", (log) => {
        void refreshLogs();
        navigate(`/records/${log.id}`);
      }),
    [core, navigate, refreshLogs],
  );

  const handleDelete = useCallback(
    async (logId: LogId) => {
      await deleteLog(logId);
      navigate(logs.length <= 1 ? "/record" : "/records");
    },
    [deleteLog, logs.length, navigate],
  );

  const header = (
    <Button asChild className="ml-auto">
      <Link to="/record">New</Link>
    </Button>
  );

  const list = (
    <AppShell header={header}>
      <div className="min-h-0 w-full flex-1 overflow-y-auto pb-6">
        {loaded && logs.length === 0 ? (
          <Navigate to="/record" replace />
        ) : (
          <LogListView logs={logs} onDelete={handleDelete} />
        )}
      </div>
    </AppShell>
  );

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/records" replace />} />
      <Route path="/records" element={list} />
      <Route path="/record" element={<RecorderView />} />
      <Route path="/records/:logId" element={<LogViewRoute />} />
    </Routes>
  );
}
