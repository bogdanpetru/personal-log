import { useEffect, useRef, useState } from "react";
import { CirclePause, CirclePlay } from "lucide-react";
import { Audio } from "@/components/Audio";
import { Button } from "@/components/Button";
import { Progress } from "@/components/Progress";
import { Text } from "@/components/Text";

interface PlaybackViewProps {
  src: string;
}

function formatSeconds(total: number): string {
  const whole = Math.floor(total);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function PlaybackView({ src }: PlaybackViewProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const progress =
    duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  useEffect(() => {
    const audio = audioRef.current;
    return () => audio?.pause();
  }, []);

  const handleToggle = () => {
    const audio = audioRef.current;
    if (audio === null) {
      return;
    }
    if (audio.paused) {
      void audio.play();
    } else {
      audio.pause();
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        type="button"
        aria-label={playing ? "Pause playback" : "Play recording"}
        onClick={handleToggle}
        variant="outline"
        size="icon"
      >
        {playing ? (
          <CirclePause aria-hidden />
        ) : (
          <CirclePlay aria-hidden />
        )}
      </Button>
      <Progress
        value={progress}
        aria-label="Playback progress"
        className="w-40"
      />
      <Text as="span" size="xs" muted className="tabular-nums">
        {formatSeconds(currentTime)} / {formatSeconds(duration)}
      </Text>
      <Audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const media = event.currentTarget.duration;
          setDuration(Number.isFinite(media) ? media : 0);
        }}
      />
    </div>
  );
}
