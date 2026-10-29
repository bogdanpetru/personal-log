import { Square } from "lucide-react";
import { Button } from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";

interface StopButtonProps {
  onStop: () => void;
}

export function StopButton({ onStop }: StopButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      aria-label={t("recorder.stop")}
      onClick={onStop}
      variant="destructive"
      size="icon-lg"
      className="size-12"
    >
      <Square aria-hidden className="size-5" />
    </Button>
  );
}
