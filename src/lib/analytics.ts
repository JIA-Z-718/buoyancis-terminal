/**
 * Analytics tracking module that integrates with Plausible Analytics.
 * Plausible is privacy-first and doesn't require cookie consent.
 * Also maintains local tracking that respects cookie preferences.
 */

const COOKIE_CONSENT_KEY = "buoyancis-cookie-consent";
const ANALYTICS_SESSION_KEY = "buoyancis-analytics-session";

// Plausible Analytics configuration
const PLAUSIBLE_DOMAIN = "buoyancis.com";

export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean>;
  timestamp?: number;
};

type ConsentStatus = "accepted" | "declined" | "pending";

/**
 * Check if functional cookies have been accepted
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COOKIE_CONSENT_KEY) === "accepted";
}

/**
 * Get the current consent status
 */
export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return "pending";
  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (consent === "accepted") return "accepted";
  if (consent === "declined") return "declined";
  return "pending";
}

/**
 * Get or create a session ID for grouping events
 */
function getSessionId(): string {
  if (typeof window === "undefined") return "";
  
  let sessionId = sessionStorage.getItem(ANALYTICS_SESSION_KEY);
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(ANALYTICS_SESSION_KEY, sessionId);
  }
  return sessionId;
}

/**
 * Analytics queue for events that occur before consent is given
 * These will be sent if user later accepts functional cookies
 */
const eventQueue: AnalyticsEvent[] = [];

/**
 * Send event to Plausible Analytics
 * Plausible is privacy-first and doesn't require cookie consent
 */
function sendToPlausible(eventName: string, props?: Record<string, string | number | boolean>): void {
  if (typeof window === "undefined") return;

  // Use Plausible's built-in API
  const plausible = (window as any).plausible;
  if (plausible) {
    plausible(eventName, { props });
    return;
  }

  // Fallback: Send directly to Plausible API
  try {
    const payload = {
      n: eventName,
      u: window.location.href,
      d: PLAUSIBLE_DOMAIN,
      r: document.referrer || null,
      w: window.innerWidth,
      p: props ? JSON.stringify(props) : undefined,
    };

    // Use sendBeacon for reliability
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      navigator.sendBeacon("https://plausible.io/api/event", blob);
    } else {
      fetch("https://plausible.io/api/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {
        // Silently fail - analytics should never break the app
      });
    }
  } catch {
    // Silently fail
  }
}

/**
 * Track a page view - sends to Plausible (no consent needed)
 */
export function trackPageView(path: string, title?: string): void {
  // Plausible tracks page views automatically via script
  // But we also send manually for SPA navigation
  sendToPlausible("pageview");

  // Also track in local system if consent given
  track("page_view", {
    path,
    title: title || document.title,
    referrer: document.referrer || "direct",
  });
}

/**
 * Track a custom event - local tracking requires consent, Plausible doesn't
 */
export function track(
  eventName: string,
  properties?: Record<string, string | number | boolean>
): void {
  // Always send to Plausible (privacy-first, no consent needed)
  if (eventName !== "page_view") {
    sendToPlausible(eventName, properties);
  }

  const event: AnalyticsEvent = {
    name: eventName,
    properties: {
      ...properties,
      session_id: getSessionId(),
      url: window.location.href,
      user_agent: navigator.userAgent,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
  };

  // Local detailed tracking respects consent
  if (!hasAnalyticsConsent()) {
    // Queue events for later if consent is pending
    if (getConsentStatus() === "pending") {
      eventQueue.push(event);
      // Keep queue size reasonable
      if (eventQueue.length > 50) {
        eventQueue.shift();
      }
    }
    return;
  }

  sendEvent(event);
}

/**
 * Send event to local analytics storage
 */
function sendEvent(event: AnalyticsEvent): void {
  // Log to console in development
  if (import.meta.env.DEV) {
    console.log("[Analytics]", event.name, event.properties);
  }

  // Store locally
  storeEventLocally(event);
}

/**
 * Store event in localStorage for local analytics
 */
function storeEventLocally(event: AnalyticsEvent): void {
  try {
    const EVENTS_KEY = "buoyancis-analytics-events";
    const MAX_STORED_EVENTS = 100;
    
    const stored = localStorage.getItem(EVENTS_KEY);
    const events: AnalyticsEvent[] = stored ? JSON.parse(stored) : [];
    
    events.push(event);
    
    // Keep only recent events
    while (events.length > MAX_STORED_EVENTS) {
      events.shift();
    }
    
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Flush queued events after consent is given
 */
export function flushQueuedEvents(): void {
  if (!hasAnalyticsConsent()) return;
  
  while (eventQueue.length > 0) {
    const event = eventQueue.shift();
    if (event) {
      sendEvent(event);
    }
  }
}

/**
 * Clear all analytics data (for GDPR compliance)
 */
export function clearAnalyticsData(): void {
  sessionStorage.removeItem(ANALYTICS_SESSION_KEY);
  localStorage.removeItem("buoyancis-analytics-events");
  eventQueue.length = 0;
}

/**
 * Get stored analytics events (for admin dashboard)
 */
export function getStoredEvents(): AnalyticsEvent[] {
  try {
    const stored = localStorage.getItem("buoyancis-analytics-events");
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

// Track common user interactions
export const analyticsEvents = {
  // Navigation
  navigation: (from: string, to: string) => 
    track("navigation", { from, to }),
  
  // User actions
  buttonClick: (buttonId: string, context?: string) => 
    track("button_click", { button_id: buttonId, context: context || "" }),
  
  formSubmit: (formId: string, success: boolean) => 
    track("form_submit", { form_id: formId, success }),
  
  // Feature usage
  featureUsed: (featureName: string, details?: string) => 
    track("feature_used", { feature: featureName, details: details || "" }),
  
  // Errors
  error: (errorType: string, message: string) => 
    track("error", { error_type: errorType, message }),
  
  // Early access signup
  earlyAccessSignup: (success: boolean) => 
    track("early_access_signup", { success }),
  
  // Auth events
  login: (method: string) => 
    track("login", { method }),
  
  logout: () => 
    track("logout", {}),
  
  signup: (method: string) => 
    track("signup", { method }),
  
  // Decoder events
  decode: (word: string) => 
    track("decode", { word }),
  
  // Check-in events
  checkin: (success: boolean) => 
    track("checkin", { success }),
};
