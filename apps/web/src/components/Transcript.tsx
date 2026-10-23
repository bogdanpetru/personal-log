import { useEffect, useRef } from "react";
import { Text } from "@/components/Text";

interface TranscriptProps {
  transcript: string;
  partial: string;
  autoScroll?: boolean;
}

export function Transcript({
  transcript,
  partial,
  autoScroll = false,
}: TranscriptProps) {
  const panelRef = useRef<HTMLDivElement>(null);

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
      className="min-h-0 w-full flex-1 overflow-y-auto text-left"
    >
      <Text className="whitespace-pre-wrap text-white">
        {transcript}
        {partial !== "" && (
          <Text as="span" muted>
            {" "}
            {partial}
          </Text>
        )}
      </Text>
    </div>
  );
}