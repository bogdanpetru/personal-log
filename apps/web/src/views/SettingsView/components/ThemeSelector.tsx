import { Button } from "@/components/Button";
import { useTranslation } from "@/hooks/useTranslation";
import type { MessageKey } from "@/lib/i18n/translate";
import { THEME_MODES, type ThemeMode } from "@/lib/theme";

interface ThemeSelectorProps {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

const LABELS: Record<ThemeMode, MessageKey> = {
  system: "theme.system",
  light: "theme.light",
  dark: "theme.dark",
};

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
  const { t } = useTranslation();

  return (
    <div
      role="group"
      aria-label="Theme"
      className="border-border inline-flex w-fit items-center gap-1 rounded-lg border p-1"
    >
      {THEME_MODES.map((mode) => (
        <Button
          key={mode}
          type="button"
          size="sm"
          variant={mode === value ? "default" : "ghost"}
          aria-pressed={mode === value}
          onClick={() => onChange(mode)}
        >
          {t(LABELS[mode])}
        </Button>
      ))}
    </div>
  );
}
