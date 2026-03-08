import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, Loader2, Save, Mail, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SenderSettings {
  senderName: string;
  senderEmailNoreply: string;
  senderEmailAlerts: string;
}

const EmailSenderSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [settings, setSettings] = useState<SenderSettings>({
    senderName: "Buoyancis",
    senderEmailNoreply: "noreply@buoyancis.com",
    senderEmailAlerts: "alerts@buoyancis.com",
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("escalation_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["sender_name", "sender_email_noreply", "sender_email_alerts"]);

      if (error) throw error;

      const newSettings = { ...settings };
      data?.forEach((item) => {
        if (item.setting_key === "sender_name") {
          newSettings.senderName = item.setting_value;
        }
        if (item.setting_key === "sender_email_noreply") {
          newSettings.senderEmailNoreply = item.setting_value;
        }
        if (item.setting_key === "sender_email_alerts") {
          newSettings.senderEmailAlerts = item.setting_value;
        }
      });
      setSettings(newSettings);
    } catch (error) {
      console.error("Error fetching sender settings:", error);
      toast.error("Failed to load sender settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(settings.senderEmailNoreply)) {
      toast.error("Invalid noreply email address");
      return;
    }
    if (!emailRegex.test(settings.senderEmailAlerts)) {
      toast.error("Invalid alerts email address");
      return;
    }
    if (!settings.senderName.trim()) {
      toast.error("Sender name is required");
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const updates = [
        { setting_key: "sender_name", setting_value: settings.senderName.trim() },
        { setting_key: "sender_email_noreply", setting_value: settings.senderEmailNoreply.trim() },
        { setting_key: "sender_email_alerts", setting_value: settings.senderEmailAlerts.trim() },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from("escalation_settings")
          .update({
            setting_value: update.setting_value,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq("setting_key", update.setting_key);

        if (error) throw error;
      }

      toast.success("Sender settings saved");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (error) {
      console.error("Error saving sender settings:", error);
      toast.error("Failed to save sender settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle className="text-base">Email Sender Settings</CardTitle>
                  <CardDescription className="text-sm">
                    Configure the "from" address for outgoing emails
                  </CardDescription>
                </div>
              </div>
              {isOpen ? (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="sender-name">Sender Display Name</Label>
                  <Input
                    id="sender-name"
                    value={settings.senderName}
                    onChange={(e) => setSettings({ ...settings, senderName: e.target.value })}
                    placeholder="Buoyancis"
                  />
                  <p className="text-xs text-muted-foreground">
                    The name shown in recipients' inboxes (e.g., "Buoyancis")
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender-noreply">Campaigns & Signups Email</Label>
                  <Input
                    id="sender-noreply"
                    type="email"
                    value={settings.senderEmailNoreply}
                    onChange={(e) => setSettings({ ...settings, senderEmailNoreply: e.target.value })}
                    placeholder="noreply@yourdomain.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for welcome emails, campaigns, and transactional messages
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sender-alerts">System Alerts Email</Label>
                  <Input
                    id="sender-alerts"
                    type="email"
                    value={settings.senderEmailAlerts}
                    onChange={(e) => setSettings({ ...settings, senderEmailAlerts: e.target.value })}
                    placeholder="alerts@yourdomain.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    Used for deliverability alerts, cron failures, and escalations
                  </p>
                </div>

                <div className="bg-muted/50 rounded-md p-3 text-sm text-muted-foreground">
                  <strong>Important:</strong> Make sure these email addresses use a domain verified in your Resend account at{" "}
                  <a 
                    href="https://resend.com/domains" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    resend.com/domains
                  </a>
                </div>

                <Button onClick={handleSave} disabled={isSaving} className="w-full">
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isSaved ? (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaved ? "Saved" : "Save Sender Settings"}
                </Button>
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default EmailSenderSettings;
