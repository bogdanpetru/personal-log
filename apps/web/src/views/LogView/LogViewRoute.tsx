import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Text } from "@/components/Text";
import { usePersonalLog } from "@/hooks/usePersonalLog";
import { useTranslation } from "@/hooks/useTranslation";
import { LogView } from "@/views/LogView/LogView";
import type { Log } from "@personal-log/plugin-api";

interface LoadedLog {
  log: Log;
  audio: Blob;
  url: string;
}

export function LogViewRoute() {
  const { logId } = useParams();
  const { loadLogData, renameLog } = usePersonalLog();
  const { t } = useTranslation();
  const [prevLogId, setPrevLogId] = useState(logId);
  const [loaded, setLoaded] = useState<LoadedLog | null>(null);
  const [missing, setMissing] = useState(false);

  if (prevLogId !== logId) {
    setPrevLogId(logId);
    setLoaded(null);
    setMissing(false);
  }

  useEffect(() => {
    let cancelled = false;
    if (logId === undefined) {
      return;
    }
    void loadLogData(logId).then((data) => {
      if (cancelled) {
        return;
      }
      if (data === undefined) {
        setMissing(true);
      } else {
        setLoaded({ log: data.log, audio: data.audio, url: data.url });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [logId, loadLogData]);

  if (logId === undefined || missing) {
    return (
      <AppShell>
        <Text as="p">{t("recorder.notFound")}</Text>
      </AppShell>
    );
  }

  if (loaded === null) {
    return null;
  }

  const rename = (title: string) => {
    void renameLog(loaded.log.id, title);
    setLoaded({ ...loaded, log: { ...loaded.log, title } });
  };

  return (
    <LogView
      key={loaded.log.id}
      log={loaded.log}
      audio={loaded.audio}
      audioUrl={loaded.url}
      onRename={rename}
    />
  );
}
