import { Slider } from "@/components/Slider";
import { useTranslation } from "@/hooks/useTranslation";

interface SeekBarProps {
  currentTime: number;
  duration: number;
  onSeek: (seconds: number) => void;
  className?: string;
}

export function SeekBar({
  currentTime,
  duration,
  onSeek,
  className,
}: SeekBarProps) {
  const { t } = useTranslation();
  const ready = duration > 0;

  return (
    <Slider
      aria-label={t("play.position")}
      className={className}
      min={0}
      max={ready ? duration : 1}
      step={1}
      value={[ready ? Math.min(currentTime, duration) : 0]}
      disabled={!ready}
      onValueChange={(next) => {
        const [seconds] = next;
        if (seconds !== undefined) {
          onSeek(seconds);
        }
      }}
    />
  );
}
