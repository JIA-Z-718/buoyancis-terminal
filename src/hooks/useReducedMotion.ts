import { useState, useEffect } from "react";

/**
 * Detects if the user prefers reduced motion via OS/browser settings.
 * Also returns true on low-end devices (heuristic: ≤ 4 logical cores).
 */
export const useReducedMotion = (): boolean => {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return prefersReduced;
};

/**
 * Heuristic: detect low-end device based on hardwareConcurrency and deviceMemory.
 * Returns true if the device is likely to struggle with heavy animations.
 */
export const useIsLowEndDevice = (): boolean => {
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 4;
    // @ts-ignore - deviceMemory is not in all browsers
    const memory = (navigator as any).deviceMemory || 8;
    setIsLowEnd(cores <= 4 || memory <= 4);
  }, []);

  return isLowEnd;
};
