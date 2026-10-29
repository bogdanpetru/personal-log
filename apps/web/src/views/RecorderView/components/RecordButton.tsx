import { Mic } from "lucide-react";
import { Button } from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";

interface RecordButtonProps {
  supported: boolean;
  onToggle: () => void;
}

export function RecordButton({ supported, onToggle }: RecordButtonProps) {
  const { t } = useTranslation();

  return (
    <Button
      type="button"
      aria-label={t("recorder.start")}
      disabled={!supported}
      onClick={onToggle}
      variant="default"
      size="icon"
      className="size-[120px]"
    >
      <Mic aria-hidden className="size-10" />
    </Button>
  );
}
