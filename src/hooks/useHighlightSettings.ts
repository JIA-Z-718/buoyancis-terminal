import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "admin-highlight-settings";

export interface HighlightSettings {
  signups: number;
  feedback: number;
  notifications: number;
}

const DEFAULT_SETTINGS: HighlightSettings = {
  signups: 3000,
  feedback: 3000,
  notifications: 3000,
};

const DURATION_OPTIONS = [
  { value: 1000, label: "1 second" },
  { value: 2000, label: "2 seconds" },
  { value: 3000, label: "3 seconds" },
  { value: 5000, label: "5 seconds" },
  { value: 7000, label: "7 seconds" },
  { value: 10000, label: "10 seconds" },
];

export { DURATION_OPTIONS };

export function useHighlightSettings() {
  const [settings, setSettingsState] = useState<HighlightSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
      } catch {
        // Ignore parse errors
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings]);

  const updateSetting = useCallback(
    (key: keyof HighlightSettings, value: number) => {
      setSettingsState((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    setSettingsState(DEFAULT_SETTINGS);
  }, []);

  return {
    settings,
    updateSetting,
    resetToDefaults,
    defaultSettings: DEFAULT_SETTINGS,
  };
}
