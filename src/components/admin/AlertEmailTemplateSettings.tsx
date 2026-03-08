import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Mail, Loader2, Send } from "lucide-react";

interface TemplateSettings {
  subject_critical: string;
  subject_warning: string;
  from_name: string;
  heading: string;
  intro: string;
  footer: string;
  signature: string;
}

const DEFAULT_SETTINGS: TemplateSettings = {
  subject_critical: "🚨 Critical Email Deliverability Alert",
  subject_warning: "⚠️ Email Deliverability Warning",
  from_name: "Alerts",
  heading: "Email Deliverability Alert",
  intro: "The following deliverability issues have been detected:",
  footer: "Please review your email list hygiene and sending practices to maintain good deliverability.",
  signature: "This is an automated alert from your email system.",
};

interface AlertEmailTemplateSettingsProps {
  onSettingsUpdated?: () => void;
}

const AlertEmailTemplateSettings = ({ onSettingsUpdated }: AlertEmailTemplateSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [settings, setSettings] = useState<TemplateSettings>(DEFAULT_SETTINGS);
  const { toast } = useToast();

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("alert_email_template")
        .select("setting_key, setting_value");

      if (error) throw error;

      const loadedSettings = { ...DEFAULT_SETTINGS };
      data?.forEach((item) => {
        if (item.setting_key in loadedSettings) {
          loadedSettings[item.setting_key as keyof TemplateSettings] = item.setting_value;
        }
      });
      setSettings(loadedSettings);
    } catch (error: any) {
      console.error("Error fetching template settings:", error);
      toast({
        title: "Error loading template",
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
      // Update each setting
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from("alert_email_template")
          .update({ setting_value: value, updated_at: new Date().toISOString() })
          .eq("setting_key", key);

        if (error) throw error;
      }

      toast({
        title: "Template saved",
        description: "Alert email template has been updated.",
      });
      setIsOpen(false);
      onSettingsUpdated?.();
    } catch (error: any) {
      console.error("Error saving template:", error);
      toast({
        title: "Error saving template",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: keyof TemplateSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const sendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke("send-test-alert-email", {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (error) throw error;

      toast({
        title: "Test email sent",
        description: `Preview email sent to ${data.sentTo}`,
      });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast({
        title: "Failed to send test email",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          Email Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Customize Alert Email Template</DialogTitle>
          <DialogDescription>
            Customize the content of deliverability alert notification emails.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject_critical">Critical Alert Subject</Label>
                <Input
                  id="subject_critical"
                  value={settings.subject_critical}
                  onChange={(e) => updateSetting("subject_critical", e.target.value)}
                  placeholder="Subject for critical alerts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject_warning">Warning Alert Subject</Label>
                <Input
                  id="subject_warning"
                  value={settings.subject_warning}
                  onChange={(e) => updateSetting("subject_warning", e.target.value)}
                  placeholder="Subject for warning alerts"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_name">From Name</Label>
                <Input
                  id="from_name"
                  value={settings.from_name}
                  onChange={(e) => updateSetting("from_name", e.target.value)}
                  placeholder="Sender name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heading">Email Heading</Label>
                <Input
                  id="heading"
                  value={settings.heading}
                  onChange={(e) => updateSetting("heading", e.target.value)}
                  placeholder="Main heading"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intro">Introduction Text</Label>
              <Textarea
                id="intro"
                value={settings.intro}
                onChange={(e) => updateSetting("intro", e.target.value)}
                placeholder="Text shown before the alert list"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer">Footer Text</Label>
              <Textarea
                id="footer"
                value={settings.footer}
                onChange={(e) => updateSetting("footer", e.target.value)}
                placeholder="Text shown after the alert list"
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signature">Signature</Label>
              <Input
                id="signature"
                value={settings.signature}
                onChange={(e) => updateSetting("signature", e.target.value)}
                placeholder="Footer signature text"
              />
            </div>

            {/* Preview Section */}
            <div className="mt-6 border rounded-lg p-4 bg-muted/30">
              <Label className="text-sm font-medium mb-3 block">Preview</Label>
              <div className="bg-background rounded border p-4 text-sm">
                <div className="text-xs text-muted-foreground mb-2">
                  From: {settings.from_name} &lt;alerts@...&gt;
                </div>
                <div className="text-xs text-muted-foreground mb-4">
                  Subject: {settings.subject_critical}
                </div>
                <h2 className="text-lg font-semibold text-destructive mb-3">{settings.heading}</h2>
                <p className="text-muted-foreground mb-3">{settings.intro}</p>
                <ul className="list-disc pl-5 mb-4 text-muted-foreground">
                  <li>Critical: Bounce rate is 5.50% (threshold: 5%)</li>
                </ul>
                <p className="text-sm text-muted-foreground mb-4">{settings.footer}</p>
                <hr className="my-3" />
                <p className="text-xs text-muted-foreground">{settings.signature}</p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={sendTestEmail}
            disabled={isSendingTest || isLoading}
            className="sm:mr-auto"
          >
            {isSendingTest ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send Test Email
          </Button>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertEmailTemplateSettings;
