import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/Select";
import { Text } from "@/components/Text";
import { useSettings } from "@/hooks/useSettings";
import { useTheme } from "@/hooks/useTheme";
import { useTranslation } from "@/hooks/useTranslation";
import { AUDIO_FORMATS, isAudioFormatId } from "@/lib/audio/formats";
import { LanguageSelector } from "@/views/components/LanguageSelector";
import { AppLanguageSelector } from "@/views/SettingsView/components/AppLanguageSelector";
import { ThemeSelector } from "@/views/SettingsView/components/ThemeSelector";

export function SettingsView() {
  const { settings, updateSettings } = useSettings();
  const { mode, setMode } = useTheme();
  const { t } = useTranslation();

  const header = (
    <Button asChild variant="ghost" size="sm">
      <Link to="/records">
        <ArrowLeft aria-hidden className="size-4" />
        {t("nav.back")}
      </Link>
    </Button>
  );

  return (
    <AppShell header={header}>
      <div className="flex w-full flex-col gap-8">
        <section className="flex flex-col gap-2">
          <Text as="h2" size="sm">
            {t("settings.appLanguage")}
          </Text>
          <Text as="p" size="xs" muted>
            {t("settings.appLanguageHint")}
          </Text>
          <AppLanguageSelector
            value={settings.locale}
            onChange={(locale) => updateSettings({ locale })}
          />
        </section>

        <section className="flex flex-col gap-2">
          <Text as="h2" size="sm">
            {t("settings.theme")}
          </Text>
          <Text as="p" size="xs" muted>
            {t("settings.themeHint")}
          </Text>
          <ThemeSelector value={mode} onChange={setMode} />
        </section>

        <section className="flex flex-col gap-2">
          <Text as="h2" size="sm">
            {t("settings.transcriptionLanguage")}
          </Text>
          <Text as="p" size="xs" muted>
            {t("settings.transcriptionLanguageHint")}
          </Text>
          <LanguageSelector
            value={settings.language}
            onChange={(language) => updateSettings({ language })}
          />
        </section>

        <section className="flex flex-col gap-2">
          <Text as="h2" size="sm">
            {t("settings.downloadFormat")}
          </Text>
          <Text as="p" size="xs" muted>
            {t("settings.downloadFormatHint")}
          </Text>
          <Select
            value={settings.downloadFormat}
            onValueChange={(value) => {
              if (isAudioFormatId(value)) {
                updateSettings({ downloadFormat: value });
              }
            }}
          >
            <SelectTrigger
              aria-label={t("settings.downloadFormat")}
              className="w-48"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIO_FORMATS.map((format) => (
                <SelectItem key={format.id} value={format.id}>
                  {format.id === "original"
                    ? t("format.original")
                    : format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      </div>
    </AppShell>
  );
}
