import { Button } from "@/components/Button";
import { THEME_LABELS, THEME_MODES, type ThemeMode } from "@/lib/theme";

interface ThemeSelectorProps {
  value: ThemeMode;
  onChange: (mode: ThemeMode) => void;
}

export function ThemeSelector({ value, onChange }: ThemeSelectorProps) {
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
          {THEME_LABELS[mode]}
        </Button>
      ))}
    </div>
  );
}
