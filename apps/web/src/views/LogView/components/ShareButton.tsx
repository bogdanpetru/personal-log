import { Share2 } from "lucide-react";
import { Button } from "@/components/Button";
import type { Log } from "@personal-log/plugin-api";

interface ShareButtonProps {
  log: Log;
  audio: Blob;
  audioUrl: string;
}

function fileNameFor(log: Log): string {
  const date = new Date(log.createdAt);
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-");
  const time = [
    pad(date.getHours()),
    pad(date.getMinutes()),
    pad(date.getSeconds()),
  ].join("-");
  const subtype = log.audio.mimeType.split(";")[0].split("/")[1];
  return `personal-log-${stamp}_${time}.${subtype ?? "webm"}`;
}

function saveAsFile(log: Log, audioUrl: string): void {
  const anchor = document.createElement("a");
  anchor.href = audioUrl;
  anchor.download = fileNameFor(log);
  anchor.click();
}

export function ShareButton({ log, audio, audioUrl }: ShareButtonProps) {
  const fileName = fileNameFor(log);

  const handleShare = () => {
    const file = new File([audio], fileName, { type: log.audio.mimeType });
    if (
      navigator.canShare === undefined ||
      !navigator.canShare({ files: [file] })
    ) {
      saveAsFile(log, audioUrl);
      return;
    }
    void navigator
      .share({ files: [file], title: fileName })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          saveAsFile(log, audioUrl);
        }
      });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label="Share recording"
      onClick={handleShare}
    >
      <Share2 aria-hidden />
    </Button>
  );
}