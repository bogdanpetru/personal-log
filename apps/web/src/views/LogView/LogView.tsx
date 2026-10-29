import { useMemo, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { PlaybackView } from "@/views/PlaybackView";
import { RecordingTitle } from "@/views/components/RecordingTitle";
import { Transcript } from "@/views/components/Transcript";
import { ShareButton } from "@/views/LogView/components/ShareButton";
import { LANGUAGES } from "@/lib/languages";
import { logTitle } from "@/lib/logTitle";
import type { Log } from "@personal-log/plugin-api";

interface LogViewProps {
  log: Log;
  audio: Blob;
  audioUrl: string;
  onRename: (title: string) => void;
}

function languageLabel(log: Log): string | undefined {
  const code = log.transcriptions[0]?.language;
  if (code === undefined) {
    return undefined;
  }
  return LANGUAGES.find((option) => option.code === code)?.label ?? code;
}

function headerFor(log: Log, audio: Blob, audioUrl: string): ReactNode {
  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link to="/records">
          <ArrowLeft aria-hidden className="size-4" />
          Back
        </Link>
      </Button>
      <ShareButton log={log} audio={audio} audioUrl={audioUrl} />
    </>
  );
}

export function LogView({ log, audio, audioUrl, onRename }: LogViewProps) {
  const header = useMemo(
    () => headerFor(log, audio, audioUrl),
    [log, audio, audioUrl],
  );
  const language = languageLabel(log);

  return (
    <AppShell header={header}>
      <div className="flex w-full flex-col items-center gap-6">
        <PlaybackView
          key={audioUrl}
          src={audioUrl}
          durationMs={log.durationMs}
        />
        <div className="flex w-full items-center justify-between gap-5">
          <RecordingTitle title={logTitle(log)} onCommit={onRename} />
          {language !== undefined && (
            <Badge variant="secondary">{language}</Badge>
          )}
        </div>
      </div>
      <Transcript
        autoScroll={false}
        transcript={log.transcriptions[0]?.text ?? ""}
        partial=""
      />
    </AppShell>
  );
}
