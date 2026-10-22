import { useEffect, useRef } from "react";

interface TranscriptProps {
  transcript: string;
  partial: string;
  /** While true, arriving text scrolls the panel to the bottom (recording). */
  autoScroll?: boolean;
}

export function Transcript({
  transcript,
  partial,
  autoScroll = false,
}: TranscriptProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // Keep the newest transcription in view while the text streams in.
  useEffect(() => {
    if (!autoScroll) {
      return;
    }
    const panel = panelRef.current;
    if (panel !== null) {
      panel.scrollTop = panel.scrollHeight;
    }
  }, [autoScroll, partial, transcript]);

  if (transcript === "" && partial === "") {
    return null;
  }
  return (
    <div
      ref={panelRef}
      className="min-h-0 w-full max-w-prose flex-1 overflow-y-auto text-left"
    >
      {/* Pre-style wrapping preserves the paragraph breaks inserted on pause. */}
      <p className="whitespace-pre-wrap">
        {transcript}
        {partial !== "" && (
          <span className="text-muted-foreground"> {partial}</span>
        )}
      </p>
    </div>
  );
}