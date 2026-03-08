import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { flushQueuedEvents, clearAnalyticsData } from "@/lib/analytics";

const COOKIE_CONSENT_KEY = "buoyancis-cookie-consent";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Small delay for smoother appearance
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    // Flush any queued analytics events now that consent is given
    flushQueuedEvents();
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    // Clear any analytics data when user declines
    clearAnalyticsData();
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom-4 duration-500">
      <div className="container-narrow">
        <div className="bg-card border border-border/60 rounded-lg shadow-lg p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use essential cookies to ensure our site functions properly. 
                We do not use third-party advertising or tracking cookies.{" "}
                <Link 
                  to="/legal/privacy" 
                  className="text-primary hover:underline underline-offset-2"
                >
                  Learn more in our Privacy Policy
                </Link>
              </p>
              
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleAccept}
                  size="sm"
                  className="text-sm"
                >
                  Accept
                </Button>
                <Button
                  onClick={handleDecline}
                  variant="ghost"
                  size="sm"
                  className="text-sm text-muted-foreground"
                >
                  Decline
                </Button>
              </div>
            </div>
            
            <button
              onClick={handleDecline}
              className="text-muted-foreground/60 hover:text-muted-foreground transition-colors p-1"
              aria-label="Dismiss cookie banner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
