import { createContext, useContext, ReactNode, useMemo } from "react";
import { subDays } from "date-fns";
import { useDateRangePersistence, DATE_RANGE_STORAGE_KEYS } from "@/hooks/useDateRangePersistence";

export const DATE_RANGE_OPTIONS = [
  { value: "7", label: "7d" },
  { value: "14", label: "14d" },
  { value: "30", label: "30d" },
  { value: "90", label: "90d" },
] as const;

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangeContextValue {
  selectedDays: string;
  activeDays: number;
  dateRange: DateRange;
  setSelectedDays: (days: string) => void;
  resetToDefault: () => void;
  hasStoredPreference: boolean;
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null);

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const {
    selectedDays,
    activeDays,
    setSelectedDays,
    resetToDefault,
    hasStoredPreference,
  } = useDateRangePersistence({
    storageKey: DATE_RANGE_STORAGE_KEYS.GLOBAL,
    defaultDays: "30",
  });

  const dateRange = useMemo(() => {
    const to = new Date();
    const from = subDays(to, activeDays - 1);
    return { from, to };
  }, [activeDays]);

  const value = useMemo(() => ({
    selectedDays,
    activeDays,
    dateRange,
    setSelectedDays,
    resetToDefault,
    hasStoredPreference,
  }), [selectedDays, activeDays, dateRange, setSelectedDays, resetToDefault, hasStoredPreference]);

  return (
    <DateRangeContext.Provider value={value}>
      {children}
    </DateRangeContext.Provider>
  );
}

export function useDateRange() {
  const context = useContext(DateRangeContext);
  if (!context) {
    throw new Error("useDateRange must be used within a DateRangeProvider");
  }
  return context;
}

export function useOptionalDateRange() {
  return useContext(DateRangeContext);
}
