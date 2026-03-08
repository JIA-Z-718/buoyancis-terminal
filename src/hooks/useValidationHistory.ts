import { useState, useCallback, useEffect } from "react";
import { ValidationError } from "@/lib/schemaValidator";

export interface ValidationHistoryEntry {
  id: string;
  timestamp: string;
  action: "validate" | "export" | "copy" | "import";
  success: boolean;
  errorCount: number;
  errors: ValidationError[];
}

const STORAGE_KEY = "compliance-validation-history";
const MAX_HISTORY_ENTRIES = 50;

export function useValidationHistory() {
  const [history, setHistory] = useState<ValidationHistoryEntry[]>([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ValidationHistoryEntry[];
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Failed to load validation history:", error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  const saveHistory = useCallback((newHistory: ValidationHistoryEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error("Failed to save validation history:", error);
    }
  }, []);

  const addEntry = useCallback((
    action: ValidationHistoryEntry["action"],
    success: boolean,
    errors: ValidationError[] = []
  ) => {
    const entry: ValidationHistoryEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      action,
      success,
      errorCount: errors.length,
      errors: errors.slice(0, 10), // Limit stored errors
    };

    setHistory((prev) => {
      const newHistory = [entry, ...prev].slice(0, MAX_HISTORY_ENTRIES);
      saveHistory(newHistory);
      return newHistory;
    });

    return entry;
  }, [saveHistory]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const getRecentHistory = useCallback((count: number = 10) => {
    return history.slice(0, count);
  }, [history]);

  const getStats = useCallback(() => {
    const total = history.length;
    const successful = history.filter((e) => e.success).length;
    const failed = total - successful;
    const successRate = total > 0 ? (successful / total) * 100 : 0;

    const byAction = history.reduce((acc, entry) => {
      acc[entry.action] = (acc[entry.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return { total, successful, failed, successRate, byAction };
  }, [history]);

  return {
    history,
    addEntry,
    clearHistory,
    getRecentHistory,
    getStats,
  };
}
