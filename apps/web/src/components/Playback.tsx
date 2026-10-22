import { useEffect, useRef, useState } from "react";

interface PlaybackProps {
  /** Object URL of the recorded audio. */
  src: string;
}

function formatSeconds(total: number): string {
  const whole = Math.floor(total);
  const minutes = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

export function Playback({ src }: PlaybackProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Playback resets when the source changes because the usage site remounts
  // this component with `key={src}` — state initializes fresh on a new
  // recording, and this cleanup only stops audio on unmount.
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

  const progress =
    duration > 0 ? `${Math.min(100, (currentTime / duration) * 100)}%` : "0%";

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label={playing ? "Pause playback" : "Play recording"}
        onClick={handleToggle}
        className="h-10 cursor-pointer rounded-[3px] border border-border px-4 text-sm transition-colors hover:bg-muted/50"
      >
        {playing ? "Pause" : "Play"}
      </button>
      <div
        role="progressbar"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        className="h-1.5 w-40 overflow-hidden rounded-full bg-muted"
      >
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: progress }}
        />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">
        {formatSeconds(currentTime)} / {formatSeconds(duration)}
      </span>
      <audio
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
        className="hidden"
      />
    </div>
  );
}