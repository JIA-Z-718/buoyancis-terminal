import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY_PREFIX = "date-range-";
const HISTORY_KEY_PREFIX = "date-range-history-";
const DEFAULT_DAYS = "30";
const MAX_HISTORY_ENTRIES = 10;

export interface DateRangeHistoryEntry {
  days: string;
  timestamp: Date;
  label?: string;
}

export interface UseDateRangePersistenceOptions {
  /** Unique key for this component's localStorage entry */
  storageKey: string;
  /** Default number of days if no stored value exists */
  defaultDays?: string;
  /** Enable history tracking (default: true) */
  trackHistory?: boolean;
}

export interface UseDateRangePersistenceResult {
  /** Current selected days as string (e.g., "7", "14", "30", "90") */
  selectedDays: string;
  /** Parsed active days as number */
  activeDays: number;
  /** Update the selected days (persists to localStorage) */
  setSelectedDays: (days: string) => void;
  /** Clear stored preference and reset to default */
  resetToDefault: () => void;
  /** Check if there's a stored preference */
  hasStoredPreference: boolean;
  /** History of date range changes */
  history: DateRangeHistoryEntry[];
  /** Restore a previous date range setting */
  restoreFromHistory: (entry: DateRangeHistoryEntry) => void;
  /** Clear all history entries */
  clearHistory: () => void;
  /** Export history as JSON string */
  exportHistory: () => string;
  /** Import history from JSON string */
  importHistory: (jsonString: string) => { success: boolean; error?: string };
}

/**
 * Hook for standardized date range persistence across trend components.
 * Provides localStorage-backed state with a consistent API and history tracking.
 * 
 * @example
 * ```tsx
 * const { selectedDays, activeDays, setSelectedDays, history, restoreFromHistory } = useDateRangePersistence({
 *   storageKey: "alert-trends",
 *   defaultDays: "30",
 * });
 * ```
 */
export function useDateRangePersistence({
  storageKey,
  defaultDays = DEFAULT_DAYS,
  trackHistory = true,
}: UseDateRangePersistenceOptions): UseDateRangePersistenceResult {
  const fullKey = `${STORAGE_KEY_PREFIX}${storageKey}`;
  const historyKey = `${HISTORY_KEY_PREFIX}${storageKey}`;

  const [selectedDays, setSelectedDaysState] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(fullKey) || defaultDays;
    }
    return defaultDays;
  });

  const [hasStoredPreference, setHasStoredPreference] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(fullKey) !== null;
    }
    return false;
  });

  const [history, setHistory] = useState<DateRangeHistoryEntry[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(historyKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return parsed.map((entry: { days: string; timestamp: string; label?: string }) => ({
            ...entry,
            timestamp: new Date(entry.timestamp),
          }));
        }
      } catch {
        // Ignore parse errors
      }
    }
    return [];
  });

  const activeDays = parseInt(selectedDays, 10);

  // Persist history to localStorage
  useEffect(() => {
    if (typeof window !== "undefined" && trackHistory) {
      if (history.length === 0) {
        localStorage.removeItem(historyKey);
      } else {
        const serialized = history.map(entry => ({
          ...entry,
          timestamp: entry.timestamp.toISOString(),
        }));
        localStorage.setItem(historyKey, JSON.stringify(serialized));
      }
    }
  }, [history, historyKey, trackHistory]);

  const addHistoryEntry = useCallback((days: string, previousDays: string) => {
    if (!trackHistory || days === previousDays) return;
    
    const entry: DateRangeHistoryEntry = {
      days: previousDays,
      timestamp: new Date(),
      label: `Changed from ${previousDays} to ${days} days`,
    };
    
    setHistory(prev => {
      // Avoid duplicate consecutive entries
      if (prev.length > 0 && prev[0].days === previousDays) {
        return prev;
      }
      return [entry, ...prev].slice(0, MAX_HISTORY_ENTRIES);
    });
  }, [trackHistory]);

  const setSelectedDays = useCallback((days: string) => {
    setSelectedDaysState(prev => {
      if (prev !== days) {
        addHistoryEntry(days, prev);
      }
      return days;
    });
    if (typeof window !== "undefined") {
      localStorage.setItem(fullKey, days);
      setHasStoredPreference(true);
    }
  }, [fullKey, addHistoryEntry]);

  const resetToDefault = useCallback(() => {
    setSelectedDaysState(prev => {
      if (prev !== defaultDays) {
        addHistoryEntry(defaultDays, prev);
      }
      return defaultDays;
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem(fullKey);
      setHasStoredPreference(false);
    }
  }, [fullKey, defaultDays, addHistoryEntry]);

  const restoreFromHistory = useCallback((entry: DateRangeHistoryEntry) => {
    setSelectedDaysState(prev => {
      if (prev !== entry.days) {
        const restoreEntry: DateRangeHistoryEntry = {
          days: prev,
          timestamp: new Date(),
          label: `Restored ${entry.days} days (was ${prev})`,
        };
        setHistory(prevHistory => [restoreEntry, ...prevHistory].slice(0, MAX_HISTORY_ENTRIES));
      }
      return entry.days;
    });
    if (typeof window !== "undefined") {
      localStorage.setItem(fullKey, entry.days);
      setHasStoredPreference(true);
    }
  }, [fullKey]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(historyKey);
    }
  }, [historyKey]);

  const exportHistory = useCallback((): string => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      storageKey,
      currentValue: selectedDays,
      history: history.map(entry => ({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      })),
    };
    return JSON.stringify(exportData, null, 2);
  }, [history, selectedDays, storageKey]);

  const importHistory = useCallback((jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (!parsed || typeof parsed !== "object") {
        return { success: false, error: "Invalid JSON structure" };
      }

      if (!Array.isArray(parsed.history)) {
        return { success: false, error: "Missing history array" };
      }

      const importedHistory: DateRangeHistoryEntry[] = parsed.history.map(
        (entry: { days: string; timestamp: string; label?: string }) => ({
          days: entry.days,
          timestamp: new Date(entry.timestamp),
          label: entry.label,
        })
      );

      setHistory(importedHistory.slice(0, MAX_HISTORY_ENTRIES));

      // Optionally restore the current value
      if (parsed.currentValue) {
        setSelectedDaysState(parsed.currentValue);
        if (typeof window !== "undefined") {
          localStorage.setItem(fullKey, parsed.currentValue);
          setHasStoredPreference(true);
        }
      }

      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Failed to parse JSON" };
    }
  }, [fullKey]);

  // Sync with localStorage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === fullKey) {
        const newValue = e.newValue || defaultDays;
        setSelectedDaysState(newValue);
        setHasStoredPreference(e.newValue !== null);
      }
      if (e.key === historyKey) {
        try {
          if (e.newValue) {
            const parsed = JSON.parse(e.newValue);
            setHistory(parsed.map((entry: { days: string; timestamp: string; label?: string }) => ({
              ...entry,
              timestamp: new Date(entry.timestamp),
            })));
          } else {
            setHistory([]);
          }
        } catch {
          // Ignore parse errors
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [fullKey, historyKey, defaultDays]);

  return {
    selectedDays,
    activeDays,
    setSelectedDays,
    resetToDefault,
    hasStoredPreference,
    history,
    restoreFromHistory,
    clearHistory,
    exportHistory,
    importHistory,
  };
}

/**
 * Pre-configured storage keys for consistency across the app.
 * Use these when calling useDateRangePersistence to ensure consistent keys.
 */
export const DATE_RANGE_STORAGE_KEYS = {
  ALERT_TRENDS: "alert-trends",
  CRON_TRENDS: "cron-trends",
  CLEANUP_TRENDS: "cleanup-trends",
  SECURITY_TRENDS: "security-trends",
  GLOBAL: "admin-global",
} as const;

export type DateRangeStorageKey = typeof DATE_RANGE_STORAGE_KEYS[keyof typeof DATE_RANGE_STORAGE_KEYS];
