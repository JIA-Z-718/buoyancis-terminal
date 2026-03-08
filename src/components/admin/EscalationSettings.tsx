import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowUpCircle, Loader2, Save, Play } from "lucide-react";

interface EscalationSettingsData {
  escalation_enabled: boolean;
  escalation_delay_minutes: number;
  escalation_emails: string;
  second_escalation_delay_minutes: number;
  second_escalation_emails: string;
}

const EscalationSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [settings, setSettings] = useState<EscalationSettingsData>({
    escalation_enabled: true,
    escalation_delay_minutes: 60,
    escalation_emails: "",
    second_escalation_delay_minutes: 120,
    second_escalation_emails: "",
  });
  const { toast } = useToast();

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("escalation_settings")
        .select("setting_key, setting_value");

      if (error) throw error;

      if (data) {
        const newSettings: EscalationSettingsData = { ...settings };
        data.forEach((row) => {
          switch (row.setting_key) {
            case "escalation_enabled":
              newSettings.escalation_enabled = row.setting_value === "true";
              break;
            case "escalation_delay_minutes":
              newSettings.escalation_delay_minutes = parseInt(row.setting_value, 10) || 60;
              break;
            case "escalation_emails":
              newSettings.escalation_emails = row.setting_value || "";
              break;
            case "second_escalation_delay_minutes":
              newSettings.second_escalation_delay_minutes = parseInt(row.setting_value, 10) || 120;
              break;
            case "second_escalation_emails":
              newSettings.second_escalation_emails = row.setting_value || "";
              break;
          }
        });
        setSettings(newSettings);
      }
    } catch (error: any) {
      console.error("Error fetching escalation settings:", error);
      toast({
        title: "Error loading settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const updates = [
        { key: "escalation_enabled", value: String(settings.escalation_enabled) },
        { key: "escalation_delay_minutes", value: String(settings.escalation_delay_minutes) },
        { key: "escalation_emails", value: settings.escalation_emails },
        { key: "second_escalation_delay_minutes", value: String(settings.second_escalation_delay_minutes) },
        { key: "second_escalation_emails", value: settings.second_escalation_emails },
      ];

      for (const { key, value } of updates) {
        const { error } = await supabase
          .from("escalation_settings")
          .update({ 
            setting_value: value, 
            updated_at: new Date().toISOString(),
            updated_by: user?.id 
          })
          .eq("setting_key", key);

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Escalation settings have been updated.",
      });
    } catch (error: any) {
      console.error("Error saving escalation settings:", error);
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const runEscalationCheck = async () => {
    setIsRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("escalate-alerts");
      
      if (error) throw error;

      toast({
        title: "Escalation check complete",
        description: data?.escalated?.length > 0
          ? `${data.escalated.length} alert(s) escalated`
          : `Checked ${data.checkedAlerts} alerts, none needed escalation`,
      });
    } catch (error: any) {
      console.error("Error running escalation check:", error);
      toast({
        title: "Error running check",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" title="Escalation settings">
          <ArrowUpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Alert Escalation Settings</DialogTitle>
          <DialogDescription>
            Configure automatic escalation for unresolved alerts. Escalation emails
            are sent when alerts remain unresolved past the configured time thresholds.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Escalation</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically escalate unresolved alerts
                </p>
              </div>
              <Switch
                checked={settings.escalation_enabled}
                onCheckedChange={(checked) =>
                  setSettings((prev) => ({ ...prev, escalation_enabled: checked }))
                }
              />
            </div>

            {settings.escalation_enabled && (
              <>
                {/* First Escalation Level */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                  <h4 className="font-medium text-sm">Level 1 Escalation</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="first-delay">Delay (minutes)</Label>
                    <Input
                      id="first-delay"
                      type="number"
                      min={5}
                      max={1440}
                      value={settings.escalation_delay_minutes}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          escalation_delay_minutes: parseInt(e.target.value, 10) || 60,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Time before first escalation (5-1440 minutes)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="first-emails">Notification Emails</Label>
                    <Input
                      id="first-emails"
                      type="text"
                      placeholder="admin1@example.com, admin2@example.com"
                      value={settings.escalation_emails}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, escalation_emails: e.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of emails for Level 1 escalation
                    </p>
                  </div>
                </div>

                {/* Second Escalation Level */}
                <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                  <h4 className="font-medium text-sm">Level 2 Escalation</h4>
                  
                  <div className="space-y-2">
                    <Label htmlFor="second-delay">Delay (minutes)</Label>
                    <Input
                      id="second-delay"
                      type="number"
                      min={5}
                      max={1440}
                      value={settings.second_escalation_delay_minutes}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          second_escalation_delay_minutes: parseInt(e.target.value, 10) || 120,
                        }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Time before second escalation (must be greater than Level 1)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="second-emails">Notification Emails</Label>
                    <Input
                      id="second-emails"
                      type="text"
                      placeholder="manager@example.com, cto@example.com"
                      value={settings.second_escalation_emails}
                      onChange={(e) =>
                        setSettings((prev) => ({ ...prev, second_escalation_emails: e.target.value }))
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of emails for Level 2 escalation (e.g., senior admins)
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={runEscalationCheck}
                disabled={isRunning || isSaving}
                className="gap-1.5"
              >
                <Play className={isRunning ? "h-3.5 w-3.5 animate-pulse" : "h-3.5 w-3.5"} />
                {isRunning ? "Running..." : "Run Check Now"}
              </Button>
              
              <Button onClick={saveSettings} disabled={isSaving} className="gap-1.5">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EscalationSettings;
