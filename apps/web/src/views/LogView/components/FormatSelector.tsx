import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";
import { useTranslation } from "@/hooks/useTranslation";
import {
  AUDIO_FORMATS,
  isAudioFormatId,
  type AudioFormatId,
} from "@/lib/audio/formats";

interface FormatSelectorProps {
  value: AudioFormatId;
  onChange: (format: AudioFormatId) => void;
}

export function FormatSelector({ value, onChange }: FormatSelectorProps) {
  const { t } = useTranslation();

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        if (isAudioFormatId(next)) {
          onChange(next);
        }
      }}
    >
      <SelectTrigger
        size="sm"
        aria-label={t("log.format")}
        className="w-24"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {AUDIO_FORMATS.map((format) => (
          <SelectItem key={format.id} value={format.id}>
            {format.id === "original" ? t("format.original") : format.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
