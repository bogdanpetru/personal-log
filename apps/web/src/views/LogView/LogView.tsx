import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Text } from "@/components/Text";
import { useDownloadFile } from "@/hooks/useDownloadFile";
import { useSettings } from "@/hooks/useSettings";
import { useTranslation } from "@/hooks/useTranslation";
import { findFormat, type AudioFormatId } from "@/lib/audio/formats";
import { LANGUAGES } from "@/lib/languages";
import { logTitle } from "@/lib/logTitle";
import { FormatSelector } from "@/views/LogView/components/FormatSelector";
import { ShareButton } from "@/views/LogView/components/ShareButton";
import { PlaybackView } from "@/views/PlaybackView";
import { RecordingTitle } from "@/views/components/RecordingTitle";
import { Transcript } from "@/views/components/Transcript";
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

export function LogView({ log, audio, audioUrl, onRename }: LogViewProps) {
  const { settings } = useSettings();
  const { t } = useTranslation();
  const [format, setFormat] = useState<AudioFormatId>(
    settings.downloadFormat,
  );
  const { file, converting, failed } = useDownloadFile(log, audio, format);
  const language = languageLabel(log);

  const header = (
    <>
      <Button asChild variant="ghost" size="sm">
        <Link to="/records">
          <ArrowLeft aria-hidden className="size-4" />
          {t("nav.back")}
        </Link>
      </Button>
      <div className="flex items-center gap-2">
        <FormatSelector value={format} onChange={setFormat} />
        <ShareButton file={file} busy={converting} />
      </div>
    </>
  );

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
        {converting || failed ? (
          <Text as="p" size="xs" muted className="w-full text-end">
            {converting
              ? t("log.preparing", { format: findFormat(format).label })
              : t("log.convertFailed", { format: findFormat(format).label })}
          </Text>
        ) : null}
      </div>
      <Transcript
        autoScroll={false}
        transcript={log.transcriptions[0]?.text ?? ""}
        partial=""
      />
    </AppShell>
  );
}
