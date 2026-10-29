import { Text } from "@/components/Text";

interface PlaybackTimeProps {
  currentTime: number;
  duration: number;
}

function formatSeconds(total: number): string {
  const whole = Math.max(0, Math.floor(total));
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function PlaybackTime({ currentTime, duration }: PlaybackTimeProps) {
  return (
    <div className="flex items-baseline gap-2 tabular-nums">
      <Text as="span" size="display" className="text-foreground">
        {formatSeconds(currentTime)}
      </Text>
      <Text as="span" size="sm" muted>
        / {formatSeconds(duration)}
      </Text>
    </div>
  );
}
