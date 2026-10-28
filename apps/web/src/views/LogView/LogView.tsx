import { useMemo, type ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { PlaybackView } from "@/views/PlaybackView";
import { Transcript } from "@/views/components/Transcript";
import { ShareButton } from "@/views/LogView/components/ShareButton";
import { LANGUAGES } from "@/lib/languages";
import type { Log } from "@personal-log/plugin-api";

interface LogViewProps {
  log: Log;
  audio: Blob;
  audioUrl: string;
}

function formatTitle(log: Log): string {
  return new Date(log.createdAt).toLocaleString("sv", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function headerFor(log: Log, audio: Blob, audioUrl: string): ReactNode {
  const language = log.transcriptions[0]?.language;
  return (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link to="/records">
          <ArrowLeft aria-hidden className="size-4" />
          Back
        </Link>
      </Button>
      <div className="flex items-center gap-1">
        <ShareButton log={log} audio={audio} audioUrl={audioUrl} />
        {language !== undefined && (
          <Text as="span" size="sm" muted>
            {LANGUAGES.find((option) => option.code === language)?.label ??
              language}
          </Text>
        )}
      </div>
    </>
  );
}

export function LogView({ log, audio, audioUrl }: LogViewProps) {
  const header = useMemo(
    () => headerFor(log, audio, audioUrl),
    [log, audio, audioUrl],
  );

  return (
    <AppShell header={header}>
      <div className="flex w-full flex-col items-center gap-4">
        <PlaybackView key={audioUrl} src={audioUrl} />
        <Text
          as="h1"
          size="sm"
          className="w-full self-start text-white"
        >
          {formatTitle(log)}
        </Text>
      </div>
      <Transcript
        autoScroll={false}
        transcript={log.transcriptions[0]?.text ?? ""}
        partial=""
      />
    </AppShell>
  );
}
