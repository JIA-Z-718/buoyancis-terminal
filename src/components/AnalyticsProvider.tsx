import { useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView, flushQueuedEvents, hasAnalyticsConsent } from "@/lib/analytics";

interface AnalyticsProviderProps {
  children: ReactNode;
}

/**
 * Analytics provider component that handles page tracking
 * and listens for consent changes
 */
export default function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const location = useLocation();

  // Track page views on route changes
  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);

  // Listen for consent changes via storage events (cross-tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "buoyancis-cookie-consent" && e.newValue === "accepted") {
        flushQueuedEvents();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Also check on mount if consent was already given
  useEffect(() => {
    if (hasAnalyticsConsent()) {
      flushQueuedEvents();
    }
  }, []);

  return <>{children}</>;
}
