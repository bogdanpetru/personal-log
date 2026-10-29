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
import { AUDIO_FORMATS, isAudioFormatId } from "@/lib/audio/formats";
import { LanguageSelector } from "@/views/components/LanguageSelector";
import { ThemeSelector } from "@/views/SettingsView/components/ThemeSelector";

export function SettingsView() {
  const { settings, updateSettings } = useSettings();
  const { mode, setMode } = useTheme();

  const header = (
    <Button asChild variant="ghost" size="sm">
      <Link to="/records">
        <ArrowLeft aria-hidden className="size-4" />
        Back
      </Link>
    </Button>
  );

  return (
    <AppShell header={header}>
      <div className="flex w-full flex-col gap-8">
        <section className="flex flex-col gap-2">
          <Text as="h2" size="sm">
            Theme
          </Text>
          <Text as="p" size="xs" muted>
            Follow the system or pick a theme for this device.
          </Text>
          <ThemeSelector value={mode} onChange={setMode} />
        </section>

        <section className="flex flex-col gap-2">
          <Text as="h2" size="sm">
            Default language
          </Text>
          <Text as="p" size="xs" muted>
            Used when starting a new recording.
          </Text>
          <LanguageSelector
            value={settings.language}
            onChange={(language) => updateSettings({ language })}
          />
        </section>

        <section className="flex flex-col gap-2">
          <Text as="h2" size="sm">
            Download format
          </Text>
          <Text as="p" size="xs" muted>
            Used by the share button and by the format picker in view mode.
          </Text>
          <Select
            value={settings.downloadFormat}
            onValueChange={(value) => {
              if (isAudioFormatId(value)) {
                updateSettings({ downloadFormat: value });
              }
            }}
          >
            <SelectTrigger aria-label="Download format" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AUDIO_FORMATS.map((format) => (
                <SelectItem key={format.id} value={format.id}>
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>
      </div>
    </AppShell>
  );
}
