import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  track,
  trackPageView,
  hasAnalyticsConsent,
  getConsentStatus,
  flushQueuedEvents,
  analyticsEvents,
} from "@/lib/analytics";

/**
 * Hook to handle analytics tracking with cookie consent awareness
 */
export function useAnalytics() {
  const location = useLocation();

  // Track page views when location changes
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  // Listen for consent changes and flush queued events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "buoyancis-cookie-consent" && e.newValue === "accepted") {
        flushQueuedEvents();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Wrapped tracking functions that respect consent
  const trackEvent = useCallback(
    (eventName: string, properties?: Record<string, string | number | boolean>) => {
      track(eventName, properties);
    },
    []
  );

  const trackButtonClick = useCallback((buttonId: string, context?: string) => {
    analyticsEvents.buttonClick(buttonId, context);
  }, []);

  const trackFormSubmit = useCallback((formId: string, success: boolean) => {
    analyticsEvents.formSubmit(formId, success);
  }, []);

  const trackFeatureUsed = useCallback((featureName: string, details?: string) => {
    analyticsEvents.featureUsed(featureName, details);
  }, []);

  const trackError = useCallback((errorType: string, message: string) => {
    analyticsEvents.error(errorType, message);
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackButtonClick,
    trackFormSubmit,
    trackFeatureUsed,
    trackError,
    hasConsent: hasAnalyticsConsent,
    consentStatus: getConsentStatus,
    events: analyticsEvents,
  };
}

/**
 * Hook specifically for page view tracking
 * Use this in components that need basic page tracking
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname, document.title);
  }, [location.pathname]);
}
