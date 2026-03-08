import { useState, useEffect, forwardRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Cookie, Shield, Settings, BarChart3 } from "lucide-react";
import { flushQueuedEvents, clearAnalyticsData, hasAnalyticsConsent } from "@/lib/analytics";

const COOKIE_CONSENT_KEY = "buoyancis-cookie-consent";

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CookiePreferencesModal = forwardRef<HTMLDivElement, CookiePreferencesModalProps>(function CookiePreferencesModal({ isOpen, onClose }, _ref) {
  const [essentialEnabled] = useState(true); // Always enabled, can't be changed
  const [functionalEnabled, setFunctionalEnabled] = useState(false);
  
  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent === "accepted") {
      setFunctionalEnabled(true);
    }
  }, [isOpen]);

  const handleSave = () => {
    const previouslyAccepted = hasAnalyticsConsent();
    
    if (functionalEnabled) {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
      // Flush queued events if user just enabled functional cookies
      if (!previouslyAccepted) {
        flushQueuedEvents();
      }
    } else {
      localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
      // Clear analytics data if user just disabled functional cookies
      if (previouslyAccepted) {
        clearAnalyticsData();
      }
    }
    onClose();
  };

  const handleAcceptAll = () => {
    const previouslyAccepted = hasAnalyticsConsent();
    setFunctionalEnabled(true);
    localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    if (!previouslyAccepted) {
      flushQueuedEvents();
    }
    onClose();
  };

  const handleRejectAll = () => {
    const previouslyAccepted = hasAnalyticsConsent();
    setFunctionalEnabled(false);
    localStorage.setItem(COOKIE_CONSENT_KEY, "declined");
    if (previouslyAccepted) {
      clearAnalyticsData();
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cookie className="w-5 h-5 text-primary" />
            Cookie Preferences
          </DialogTitle>
          <DialogDescription>
            Manage your cookie settings. Essential cookies cannot be disabled as they are 
            required for the website to function properly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Essential Cookies */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg bg-muted/50">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-primary" />
                <Label className="font-medium">Essential Cookies</Label>
                <Badge variant="secondary" className="text-xs">Required</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                These cookies are necessary for the website to function. They enable core 
                functionality such as authentication and session management.
              </p>
            </div>
            <Switch 
              checked={essentialEnabled} 
              disabled 
              aria-label="Essential cookies (always enabled)"
            />
          </div>

          <Separator />

          {/* Functional Cookies */}
          <div className="flex items-start justify-between gap-4 p-4 rounded-lg border">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Settings className="w-4 h-4 text-primary" />
                <Label htmlFor="functional-cookies" className="font-medium">
                  Functional Cookies
                </Label>
                <Badge variant="outline" className="text-xs">Optional</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                These cookies enable enhanced functionality and personalization. They may be 
                set by us or third-party providers whose services we use.
              </p>
            </div>
            <Switch 
              id="functional-cookies"
              checked={functionalEnabled} 
              onCheckedChange={setFunctionalEnabled}
              aria-label="Functional cookies"
            />
          </div>

          {/* Analytics Info */}
          <div className="p-3 rounded-lg bg-muted/30 border border-dashed">
            <div className="flex items-start gap-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Analytics Tracking</p>
                <p>
                  {functionalEnabled 
                    ? "Analytics is enabled. We collect anonymous usage data to improve your experience."
                    : "Analytics is disabled. Enable functional cookies to help us improve the site."}
                </p>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Note: We do not use any third-party advertising cookies. 
            Your privacy is important to us.
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleRejectAll} className="flex-1 sm:flex-none">
              Reject All
            </Button>
            <Button variant="outline" onClick={handleAcceptAll} className="flex-1 sm:flex-none">
              Accept All
            </Button>
          </div>
          <Button onClick={handleSave} className="w-full sm:w-auto">
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

export default CookiePreferencesModal;
