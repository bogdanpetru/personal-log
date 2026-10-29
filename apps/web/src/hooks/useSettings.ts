import { useCallback, useSyncExternalStore } from "react";
import {
  getSettings,
  subscribeSettings,
  updateSettings,
  type Settings,
} from "@/lib/settings";

interface UseSettings {
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

export function useSettings(): UseSettings {
  const settings = useSyncExternalStore(subscribeSettings, getSettings);
  const update = useCallback((patch: Partial<Settings>) => {
    updateSettings(patch);
  }, []);

  return { settings, updateSettings: update };
}
