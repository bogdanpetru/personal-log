import { useMemo } from "react";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { PlaybackView } from "@/views/PlaybackView";
import { Transcript } from "@/views/components/Transcript";
import { LANGUAGES } from "@/lib/languages";
import type { Log } from "@personal-log/plugin-api";

interface LogViewProps {
  log: Log;
  audioUrl: string;
  onBack: () => void;
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

export function LogView({ log, audioUrl, onBack }: LogViewProps) {
  const language = log.transcriptions[0]?.language;
  const header = useMemo(
    () => (
      <>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft aria-hidden className="size-4" />
          Back
        </Button>
        {language !== undefined && (
          <Text as="span" size="sm" muted>
            {LANGUAGES.find((option) => option.code === language)?.label ??
              language}
          </Text>
        )}
      </>
    ),
    [language, onBack],
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