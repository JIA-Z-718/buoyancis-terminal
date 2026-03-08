import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import MultiEmailAutocompleteInput from "@/components/ui/multi-email-autocomplete-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Settings, Loader2, Save, CheckCircle, UserPlus, AlertTriangle, Bell, Send, Volume2, VolumeX, ShieldCheck } from "lucide-react";
import { playAlertSound, initAudioContext } from "@/lib/alertSound";

const STORAGE_KEY = "admin_email_suggestions";
const SOUND_ENABLED_KEY = "admin_alert_sound_enabled";

type TestCategory = "signups" | "errors" | "alerts";

interface NotificationPreferences {
  adminEmail: string;
  signupsEnabled: boolean;
  errorsEnabled: boolean;
  alertsEnabled: boolean;
  roleChangesEnabled: boolean;
}

interface LastTestedTimestamps {
  signups: string;
  errors: string;
  alerts: string;
}

const AdminNotificationSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingCategory, setTestingCategory] = useState<TestCategory | null>(null);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    adminEmail: "",
    signupsEnabled: true,
    errorsEnabled: true,
    alertsEnabled: true,
    roleChangesEnabled: true,
  });
  const [lastTested, setLastTested] = useState<LastTestedTimestamps>({
    signups: "",
    errors: "",
    alerts: "",
  });
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem(SOUND_ENABLED_KEY);
    return saved !== null ? saved === "true" : true;
  });
  const { toast } = useToast();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const emailValidations = useMemo(() => {
    if (!preferences.adminEmail.trim()) return [];
    return preferences.adminEmail
      .split(",")
      .map((e) => e.trim())
      .filter(Boolean)
      .map((email) => ({
        email,
        isValid: emailRegex.test(email),
      }));
  }, [preferences.adminEmail]);

  const hasInvalidEmails = emailValidations.some((v) => !v.isValid);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("escalation_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "admin_notification_email",
          "notify_signups_enabled",
          "notify_errors_enabled",
          "notify_alerts_enabled",
          "notify_role_changes_enabled",
          "last_tested_signups",
          "last_tested_errors",
          "last_tested_alerts",
        ]);

      if (error) throw error;

      const loadedPrefs: NotificationPreferences = {
        adminEmail: "",
        signupsEnabled: true,
        errorsEnabled: true,
        alertsEnabled: true,
        roleChangesEnabled: true,
      };

      const loadedTimestamps: LastTestedTimestamps = {
        signups: "",
        errors: "",
        alerts: "",
      };

      data?.forEach((item) => {
        switch (item.setting_key) {
          case "admin_notification_email":
            loadedPrefs.adminEmail = item.setting_value || "";
            break;
          case "notify_signups_enabled":
            loadedPrefs.signupsEnabled = item.setting_value === "true";
            break;
          case "notify_errors_enabled":
            loadedPrefs.errorsEnabled = item.setting_value === "true";
            break;
          case "notify_alerts_enabled":
            loadedPrefs.alertsEnabled = item.setting_value === "true";
            break;
          case "notify_role_changes_enabled":
            loadedPrefs.roleChangesEnabled = item.setting_value === "true";
            break;
          case "last_tested_signups":
            loadedTimestamps.signups = item.setting_value || "";
            break;
          case "last_tested_errors":
            loadedTimestamps.errors = item.setting_value || "";
            break;
          case "last_tested_alerts":
            loadedTimestamps.alerts = item.setting_value || "";
            break;
        }
      });

      setPreferences(loadedPrefs);
      setLastTested(loadedTimestamps);
    } catch (error: any) {
      console.error("Error fetching notification settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (!preferences.adminEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter at least one admin email address.",
        variant: "destructive",
      });
      return;
    }

    if (hasInvalidEmails) {
      toast({
        title: "Invalid email(s)",
        description: "Please fix the invalid email addresses before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const now = new Date().toISOString();

      const updates = [
        { key: "admin_notification_email", value: preferences.adminEmail.trim() },
        { key: "notify_signups_enabled", value: String(preferences.signupsEnabled) },
        { key: "notify_errors_enabled", value: String(preferences.errorsEnabled) },
        { key: "notify_alerts_enabled", value: String(preferences.alertsEnabled) },
        { key: "notify_role_changes_enabled", value: String(preferences.roleChangesEnabled) },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("escalation_settings")
          .update({
            setting_value: update.value,
            updated_at: now,
            updated_by: user?.id,
          })
          .eq("setting_key", update.key);

        if (error) throw error;
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      toast({
        title: "Settings saved",
        description: "Notification preferences have been updated.",
      });
    } catch (error: any) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const togglePreference = (key: keyof Omit<NotificationPreferences, "adminEmail">) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem(SOUND_ENABLED_KEY, String(newValue));
    
    if (newValue) {
      initAudioContext();
      playAlertSound("warning");
      toast({
        title: "Sound enabled",
        description: "You'll hear audio alerts for real-time notifications.",
      });
    } else {
      toast({
        title: "Sound disabled",
        description: "Audio alerts are now muted.",
      });
    }
  };

  const sendTestEmail = async (category: TestCategory) => {
    if (!preferences.adminEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter admin email(s) before sending a test.",
        variant: "destructive",
      });
      return;
    }

    setTestingCategory(category);
    try {
      const functionName = category === "signups" 
        ? "send-test-signup-notification"
        : category === "errors"
        ? "send-test-error-notification"
        : "send-test-alert-email";

      const { data, error } = await supabase.functions.invoke(functionName);

      if (error) throw error;

      const now = new Date().toISOString();
      const settingKey = `last_tested_${category}`;
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase
        .from("escalation_settings")
        .update({
          setting_value: now,
          updated_at: now,
          updated_by: user?.id,
        })
        .eq("setting_key", settingKey);

      setLastTested((prev) => ({ ...prev, [category]: now }));

      toast({
        title: "Test email sent",
        description: `Test ${category} notification sent to ${Array.isArray(data?.sentTo) ? data.sentTo.join(", ") : data?.sentTo || preferences.adminEmail}`,
      });
    } catch (error: any) {
      console.error(`Error sending test ${category} email:`, error);
      toast({
        title: "Failed to send test",
        description: error.message || "Could not send test email",
        variant: "destructive",
      });
    } finally {
      setTestingCategory(null);
    }
  };

  const formatLastTested = (timestamp: string): string => {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">Notification Settings</CardTitle>
                  <CardDescription>
                    Configure admin email and notification preferences
                  </CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Admin Email */}
                <div className="space-y-2">
                  <Label htmlFor="admin-email">Admin Email(s)</Label>
                  <MultiEmailAutocompleteInput
                    id="admin-email"
                    value={preferences.adminEmail}
                    onValueChange={(value) =>
                      setPreferences((prev) => ({ ...prev, adminEmail: value }))
                    }
                    placeholder="Type email and press Enter or comma to add"
                    autocompleteOptions={{
                      includeLocalStorage: true,
                      localStorageKey: STORAGE_KEY,
                    }}
                  />
                </div>

                {/* Sound Toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${soundEnabled ? "bg-primary/10" : "bg-muted"}`}>
                      {soundEnabled ? (
                        <Volume2 className="h-4 w-4 text-primary" />
                      ) : (
                        <VolumeX className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Alert Sound</p>
                      <p className="text-xs text-muted-foreground">
                        Play audio alerts for real-time notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={soundEnabled}
                    onCheckedChange={toggleSound}
                  />
                </div>

                {/* Notification Categories */}
                <div className="space-y-4">
                  <Label className="text-base">Notification Categories</Label>
                  
                  <div className="space-y-3">
                    {/* Signups */}
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <UserPlus className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">New Signups</p>
                          <p className="text-xs text-muted-foreground">
                            Get notified when users sign up for early access
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {lastTested.signups && (
                            <span className="text-xs text-muted-foreground">
                              Tested {formatLastTested(lastTested.signups)}
                            </span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendTestEmail("signups")}
                            disabled={testingCategory !== null}
                            className="gap-1.5"
                          >
                            {testingCategory === "signups" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Test
                          </Button>
                        </div>
                        <Switch
                          checked={preferences.signupsEnabled}
                          onCheckedChange={() => togglePreference("signupsEnabled")}
                        />
                      </div>
                    </div>

                    {/* Errors */}
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-destructive/10">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Signup Errors</p>
                          <p className="text-xs text-muted-foreground">
                            Get alerted when signup attempts fail
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {lastTested.errors && (
                            <span className="text-xs text-muted-foreground">
                              Tested {formatLastTested(lastTested.errors)}
                            </span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendTestEmail("errors")}
                            disabled={testingCategory !== null}
                            className="gap-1.5"
                          >
                            {testingCategory === "errors" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Test
                          </Button>
                        </div>
                        <Switch
                          checked={preferences.errorsEnabled}
                          onCheckedChange={() => togglePreference("errorsEnabled")}
                        />
                      </div>
                    </div>

                    {/* Alerts */}
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-warning/10">
                          <Bell className="h-4 w-4 text-warning" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">System Alerts</p>
                          <p className="text-xs text-muted-foreground">
                            Deliverability warnings, cron failures, and escalations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {lastTested.alerts && (
                            <span className="text-xs text-muted-foreground">
                              Tested {formatLastTested(lastTested.alerts)}
                            </span>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => sendTestEmail("alerts")}
                            disabled={testingCategory !== null}
                            className="gap-1.5"
                          >
                            {testingCategory === "alerts" ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Send className="h-3.5 w-3.5" />
                            )}
                            Test
                          </Button>
                        </div>
                        <Switch
                          checked={preferences.alertsEnabled}
                          onCheckedChange={() => togglePreference("alertsEnabled")}
                        />
                      </div>
                    </div>

                    {/* Admin Role Changes */}
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <ShieldCheck className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Admin Role Changes</p>
                          <p className="text-xs text-muted-foreground">
                            Get notified when admin roles are assigned or revoked
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch
                          checked={preferences.roleChangesEnabled}
                          onCheckedChange={() => togglePreference("roleChangesEnabled")}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : saved ? (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Saved!
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Settings
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default AdminNotificationSettings;
