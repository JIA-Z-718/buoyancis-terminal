import { useState, useEffect } from "react";

/**
 * Hook that triggers a re-render at a specified interval.
 * Useful for keeping relative timestamps (e.g., "5 minutes ago") accurate.
 * 
 * @param intervalMs - Refresh interval in milliseconds (default: 60000 = 1 minute)
 * @returns A tick counter that increments each interval, triggering re-renders
 */
export function useRelativeTimeRefresh(intervalMs: number = 60000): number {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return tick;
}

/**
 * Hook that returns the current time, updating at the specified interval.
 * Useful when you need to recalculate time-based values.
 * 
 * @param intervalMs - Refresh interval in milliseconds (default: 60000 = 1 minute)
 * @returns Current Date object, updated each interval
 */
export function useCurrentTime(intervalMs: number = 60000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, intervalMs);

    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
