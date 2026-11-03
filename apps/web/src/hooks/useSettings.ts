import { useCallback, useSyncExternalStore } from "react";
import { settingsService } from "@/lib/settingsService";
import type { Settings } from "@/lib/settings/Settings";

interface UseSettings {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

const get = () => settingsService.get();
const subscribe = (listener: () => void) => settingsService.subscribe(listener);

export function useSettings(): UseSettings {
  const settings = useSyncExternalStore(subscribe, get);
  const update = useCallback((patch: Partial<Settings>) => {
    settingsService.update(patch);
  }, []);

  return { settings, updateSettings: update };
}
