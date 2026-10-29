import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { nextThemeMode, type ThemeMode } from "@/lib/theme";
import type { MessageKey } from "@/lib/i18n/translate";

const ICONS: Record<ThemeMode, typeof Sun> = {
  system: Monitor,
  light: Sun,
  dark: Moon,
};

const LABELS: Record<ThemeMode, MessageKey> = {
  system: "theme.system",
  light: "theme.light",
  dark: "theme.dark",
};

export function ThemeSwitch() {
  const { t } = useTranslation();
  const { mode, cycle } = useTheme();
  const Icon = ICONS[mode];
  const label = t("theme.switch", {
    current: t(LABELS[mode]),
    next: t(LABELS[nextThemeMode(mode)]),
  });

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      aria-label={label}
      title={label}
      onClick={cycle}
      className="bg-background/80 fixed end-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 rounded-full shadow-sm backdrop-blur"
    >
      <Icon aria-hidden />
    </Button>
  );
}
