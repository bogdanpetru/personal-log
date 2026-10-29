import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { nextThemeMode, THEME_LABELS, type ThemeMode } from "@/lib/theme";

const ICONS: Record<ThemeMode, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

export function ThemeSwitch() {
  const { mode, cycle } = useTheme();
  const Icon = ICONS[mode];
  const label = `Theme: ${THEME_LABELS[mode]}. Switch to ${THEME_LABELS[nextThemeMode(mode)]}.`;

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={cycle}
      className="bg-background/80 fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 rounded-full shadow-sm backdrop-blur"
    >
      <Icon aria-hidden />
    </Button>
  );
}
