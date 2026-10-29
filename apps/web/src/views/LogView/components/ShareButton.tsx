import { Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";

interface ShareButtonProps {
  file: File;
  busy?: boolean;
}

function saveAsFile(file: File): void {
  const url = URL.createObjectURL(file);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ShareButton({ file, busy = false }: ShareButtonProps) {
  const { t } = useTranslation();

  const handleShare = () => {
    if (
      navigator.canShare === undefined ||
      !navigator.canShare({ files: [file] })
    ) {
      saveAsFile(file);
      return;
    }
    void navigator
      .share({ files: [file], title: file.name })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          saveAsFile(file);
        }
      });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={t("log.share")}
      aria-busy={busy}
      disabled={busy}
      onClick={handleShare}
    >
      {busy ? (
        <Loader2 aria-hidden className="animate-spin" />
      ) : (
        <Share2 aria-hidden />
      )}
    </Button>
  );
}
