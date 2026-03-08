import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDateRangePersistence, DATE_RANGE_STORAGE_KEYS } from "./useDateRangePersistence";

describe("useDateRangePersistence", () => {
  const testStorageKey = "test-component";
  const fullKey = `date-range-${testStorageKey}`;
  const historyKey = `date-range-history-${testStorageKey}`;

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("initialization", () => {
    it("should use default days when no stored value exists", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      expect(result.current.selectedDays).toBe("30");
      expect(result.current.activeDays).toBe(30);
      expect(result.current.hasStoredPreference).toBe(false);
    });

    it("should use custom default days when provided", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey, defaultDays: "7" })
      );

      expect(result.current.selectedDays).toBe("7");
      expect(result.current.activeDays).toBe(7);
    });

    it("should load stored value from localStorage", () => {
      localStorage.setItem(fullKey, "14");

      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      expect(result.current.selectedDays).toBe("14");
      expect(result.current.activeDays).toBe(14);
      expect(result.current.hasStoredPreference).toBe(true);
    });

    it("should load history from localStorage", () => {
      const historyData = [
        { days: "30", timestamp: new Date().toISOString(), label: "Test entry" }
      ];
      localStorage.setItem(historyKey, JSON.stringify(historyData));

      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].days).toBe("30");
      expect(result.current.history[0].label).toBe("Test entry");
    });
  });

  describe("setSelectedDays", () => {
    it("should update state and persist to localStorage", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      act(() => {
        result.current.setSelectedDays("90");
      });

      expect(result.current.selectedDays).toBe("90");
      expect(result.current.activeDays).toBe(90);
      expect(localStorage.getItem(fullKey)).toBe("90");
      expect(result.current.hasStoredPreference).toBe(true);
    });

    it("should add history entry when changing days", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      act(() => {
        result.current.setSelectedDays("7");
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].days).toBe("30"); // Previous value
    });

    it("should not add duplicate history entries", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      act(() => {
        result.current.setSelectedDays("30"); // Same as default
      });

      expect(result.current.history).toHaveLength(0);
    });
  });

  describe("resetToDefault", () => {
    it("should reset to default value and clear localStorage", () => {
      localStorage.setItem(fullKey, "90");

      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey, defaultDays: "30" })
      );

      expect(result.current.selectedDays).toBe("90");

      act(() => {
        result.current.resetToDefault();
      });

      expect(result.current.selectedDays).toBe("30");
      expect(result.current.activeDays).toBe(30);
      expect(localStorage.getItem(fullKey)).toBeNull();
      expect(result.current.hasStoredPreference).toBe(false);
    });

    it("should add history entry when resetting", () => {
      localStorage.setItem(fullKey, "90");

      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey, defaultDays: "30" })
      );

      act(() => {
        result.current.resetToDefault();
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].days).toBe("90");
    });
  });

  describe("history management", () => {
    it("should restore from history entry", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      act(() => {
        result.current.setSelectedDays("7");
      });

      act(() => {
        result.current.setSelectedDays("14");
      });

      const historyEntry = result.current.history[0];
      
      act(() => {
        result.current.restoreFromHistory(historyEntry);
      });

      expect(result.current.selectedDays).toBe(historyEntry.days);
    });

    it("should clear history", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      act(() => {
        result.current.setSelectedDays("7");
        result.current.setSelectedDays("14");
      });

      expect(result.current.history.length).toBeGreaterThan(0);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.history).toHaveLength(0);
      expect(localStorage.getItem(historyKey)).toBeNull();
    });

    it("should limit history to 10 entries", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      // Make 12 changes
      const values = ["7", "14", "30", "60", "90", "7", "14", "30", "60", "90", "7", "14"];
      
      for (const val of values) {
        act(() => {
          result.current.setSelectedDays(val);
        });
      }

      expect(result.current.history.length).toBeLessThanOrEqual(10);
    });
  });

  describe("export and import", () => {
    it("should export history as JSON", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      act(() => {
        result.current.setSelectedDays("7");
      });

      const exported = result.current.exportHistory();
      const parsed = JSON.parse(exported);

      expect(parsed.version).toBe(1);
      expect(parsed.storageKey).toBe(testStorageKey);
      expect(parsed.currentValue).toBe("7");
      expect(parsed.history).toHaveLength(1);
    });

    it("should import history from JSON", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      const importData = {
        version: 1,
        storageKey: testStorageKey,
        currentValue: "14",
        history: [
          { days: "30", timestamp: new Date().toISOString(), label: "Imported entry" }
        ]
      };

      act(() => {
        const importResult = result.current.importHistory(JSON.stringify(importData));
        expect(importResult.success).toBe(true);
      });

      expect(result.current.selectedDays).toBe("14");
      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].label).toBe("Imported entry");
    });

    it("should handle invalid import JSON", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      act(() => {
        const importResult = result.current.importHistory("invalid json");
        expect(importResult.success).toBe(false);
        expect(importResult.error).toBeDefined();
      });
    });
  });

  describe("cross-tab synchronization", () => {
    it("should update state when storage event is fired from another tab", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      expect(result.current.selectedDays).toBe("30");

      act(() => {
        const event = new StorageEvent("storage", {
          key: fullKey,
          newValue: "14",
          oldValue: "30",
        });
        window.dispatchEvent(event);
      });

      expect(result.current.selectedDays).toBe("14");
      expect(result.current.hasStoredPreference).toBe(true);
    });

    it("should sync history from other tabs", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      const historyData = [
        { days: "7", timestamp: new Date().toISOString(), label: "From other tab" }
      ];

      act(() => {
        const event = new StorageEvent("storage", {
          key: historyKey,
          newValue: JSON.stringify(historyData),
          oldValue: null,
        });
        window.dispatchEvent(event);
      });

      expect(result.current.history).toHaveLength(1);
      expect(result.current.history[0].label).toBe("From other tab");
    });

    it("should ignore storage events for different keys", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey })
      );

      expect(result.current.selectedDays).toBe("30");

      act(() => {
        const event = new StorageEvent("storage", {
          key: "date-range-other-component",
          newValue: "7",
          oldValue: null,
        });
        window.dispatchEvent(event);
      });

      expect(result.current.selectedDays).toBe("30");
    });
  });

  describe("activeDays parsing", () => {
    it("should correctly parse string days to number", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey, defaultDays: "365" })
      );

      expect(result.current.activeDays).toBe(365);
      expect(typeof result.current.activeDays).toBe("number");
    });
  });

  describe("DATE_RANGE_STORAGE_KEYS", () => {
    it("should have predefined storage keys", () => {
      expect(DATE_RANGE_STORAGE_KEYS.ALERT_TRENDS).toBe("alert-trends");
      expect(DATE_RANGE_STORAGE_KEYS.CRON_TRENDS).toBe("cron-trends");
      expect(DATE_RANGE_STORAGE_KEYS.CLEANUP_TRENDS).toBe("cleanup-trends");
      expect(DATE_RANGE_STORAGE_KEYS.SECURITY_TRENDS).toBe("security-trends");
      expect(DATE_RANGE_STORAGE_KEYS.GLOBAL).toBe("admin-global");
    });
  });

  describe("trackHistory option", () => {
    it("should not track history when trackHistory is false", () => {
      const { result } = renderHook(() =>
        useDateRangePersistence({ storageKey: testStorageKey, trackHistory: false })
      );

      act(() => {
        result.current.setSelectedDays("7");
      });

      expect(result.current.history).toHaveLength(0);
    });
  });
});
