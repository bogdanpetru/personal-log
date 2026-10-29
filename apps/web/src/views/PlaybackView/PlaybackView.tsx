import { useEffect, useRef, useState } from "react";
import { Audio } from "@/components/Audio";
import { PlayButton } from "./components/PlayButton";
import { PlaybackTime } from "./components/PlaybackTime";
import { SeekBar } from "./components/SeekBar";

interface PlaybackViewProps {
  src: string;
  durationMs?: number;
}

export function PlaybackView({ src, durationMs = 0 }: PlaybackViewProps) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [mediaDuration, setMediaDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const duration = mediaDuration > 0 ? mediaDuration : durationMs / 1000;

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

  const seek = (seconds: number) => {
    const audio = audioRef.current;
    if (audio === null) {
      return;
    }
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  };

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <PlaybackTime currentTime={currentTime} duration={duration} />
      <div className="flex w-full items-center gap-3">
        <PlayButton playing={playing} onToggle={handleToggle} />
        <SeekBar
          className="flex-1"
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
        />
      </div>
      <Audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onLoadedMetadata={(event) => {
          const media = event.currentTarget.duration;
          if (Number.isFinite(media)) {
            setMediaDuration(media);
          }
        }}
        onDurationChange={(event) => {
          const media = event.currentTarget.duration;
          if (Number.isFinite(media)) {
            setMediaDuration(media);
          }
        }}
      />
    </div>
  );
}
