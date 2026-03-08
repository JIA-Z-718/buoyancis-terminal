import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Bell, Loader2, MessageSquare, Webhook, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface NotificationSettings {
  slack_channel: string;
  webhook_url: string;
}

const AlertNotificationSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>({
    slack_channel: "",
    webhook_url: "",
  });
  const { toast } = useToast();

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("alert_email_template")
        .select("setting_key, setting_value")
        .in("setting_key", ["slack_channel", "webhook_url"]);

      if (error) throw error;

      const loadedSettings = { slack_channel: "", webhook_url: "" };
      data?.forEach((item) => {
        if (item.setting_key in loadedSettings) {
          loadedSettings[item.setting_key as keyof NotificationSettings] = item.setting_value;
        }
      });
      setSettings(loadedSettings);
    } catch (error: any) {
      console.error("Error fetching notification settings:", error);
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from("alert_email_template")
          .update({ setting_value: value, updated_at: new Date().toISOString() })
          .eq("setting_key", key);

        if (error) throw error;
      }

      toast({
        title: "Settings saved",
        description: "Notification settings have been updated.",
      });
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error saving notification settings:", error);
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const hasSlackConnector = false; // Would check for Slack connector

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Bell className="h-3.5 w-3.5" />
          Notifications
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Alert Notifications</DialogTitle>
          <DialogDescription>
            Configure additional notification channels for critical alerts.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Slack Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-medium">Slack</Label>
              </div>
              
              {!hasSlackConnector && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    To enable Slack notifications, connect the Slack integration first. You can do this from the workspace settings.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="slack_channel" className="text-sm text-muted-foreground">
                  Channel ID
                </Label>
                <Input
                  id="slack_channel"
                  value={settings.slack_channel}
                  onChange={(e) => setSettings({ ...settings, slack_channel: e.target.value })}
                  placeholder="e.g., C0123456789"
                  disabled={!hasSlackConnector}
                />
                <p className="text-xs text-muted-foreground">
                  Find the channel ID by right-clicking on a channel → View channel details → Copy ID
                </p>
              </div>
            </div>

            {/* Webhook Section */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-muted-foreground" />
                <Label className="text-base font-medium">Custom Webhook</Label>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="webhook_url" className="text-sm text-muted-foreground">
                  Webhook URL
                </Label>
                <Input
                  id="webhook_url"
                  type="url"
                  value={settings.webhook_url}
                  onChange={(e) => setSettings({ ...settings, webhook_url: e.target.value })}
                  placeholder="https://hooks.example.com/..."
                />
                <p className="text-xs text-muted-foreground">
                  Receives a POST request with alert details when critical alerts are triggered. Works with Zapier, Make, n8n, etc.
                </p>
              </div>
            </div>

            {/* Payload Preview */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Webhook Payload Preview</Label>
              <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
{`{
  "alerts": [
    {
      "type": "bounce_rate_critical",
      "severity": "critical",
      "value": 5.5,
      "threshold": 5.0,
      "message": "Critical: Bounce rate is 5.50%"
    }
  ],
  "timestamp": "2024-01-24T12:00:00Z"
}`}
              </pre>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertNotificationSettings;
