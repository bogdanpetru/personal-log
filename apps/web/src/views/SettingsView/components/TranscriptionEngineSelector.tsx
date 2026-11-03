import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Progress } from "@/components/Progress";
import { Text } from "@/components/Text";
import { useTranslation } from "@/hooks/useTranslation";
import type { MessageKey } from "@/lib/i18n/translate";
import {
  TRANSCRIPTION_ENGINES,
  type TranscriptionEngine,
} from "@/lib/transcription/TranscriptionEngine";
import { whisperTranscriber } from "@/lib/transcription/whisperTranscriber";

interface TranscriptionEngineSelectorProps {
  value: TranscriptionEngine;
  onChange: (engine: TranscriptionEngine) => void;
}

const LABELS: Record<TranscriptionEngine, MessageKey> = {
  native: "settings.engineNative",
  whisper: "settings.engineWhisper",
};

type WhisperEngineState =
  | { kind: "idle" }
  | { kind: "downloading"; ratio: number }
  | { kind: "ready" }
  | { kind: "error" };

export function TranscriptionEngineSelector({
  value,
  onChange,
}: TranscriptionEngineSelectorProps) {
  const { t } = useTranslation();
  const [whisperState, setWhisperState] = useState<WhisperEngineState>({
    kind: "idle",
  });
  const requested = useRef(false);

  useEffect(() => {
    if (value !== "whisper" || requested.current) {
      return;
    }
    requested.current = true;
    setWhisperState({ kind: "downloading", ratio: 0 });
    whisperTranscriber
      .ensureReady((ratio) => {
        setWhisperState({ kind: "downloading", ratio });
      })
      .then(() => {
        setWhisperState({ kind: "ready" });
      })
      .catch(() => {
        setWhisperState({ kind: "error" });
      });
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label="Transcription engine"
        className="border-border inline-flex w-fit items-center gap-1 rounded-lg border p-1"
      >
        {TRANSCRIPTION_ENGINES.map((engine) => (
          <Button
            key={engine}
            type="button"
            size="sm"
            variant={engine === value ? "default" : "ghost"}
            aria-pressed={engine === value}
            onClick={() => onChange(engine)}
          >
            {t(LABELS[engine])}
          </Button>
        ))}
      </div>
      {value === "whisper" && whisperState.kind === "downloading" ? (
        <Progress
          aria-label={t("settings.engine")}
          value={whisperState.ratio * 100}
        />
      ) : null}
      {value === "whisper" && whisperState.kind === "ready" ? (
        <Text as="p" size="xs">
          {t("settings.engineReady")}
        </Text>
      ) : null}
      {value === "whisper" && whisperState.kind === "error" ? (
        <Text as="p" size="xs">
          {t("settings.engineDownloadFailed")}
        </Text>
      ) : null}
    </div>
  );
}
