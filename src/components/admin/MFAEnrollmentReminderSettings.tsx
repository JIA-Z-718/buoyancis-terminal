import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bell, Send, Clock, Users, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface ReminderHistory {
  id: string;
  user_email: string;
  sent_at: string;
  reminder_type: string;
}

export default function MFAEnrollmentReminderSettings() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [reminderDays, setReminderDays] = useState(3);
  const [frequencyDays, setFrequencyDays] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [reminderHistory, setReminderHistory] = useState<ReminderHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    fetchReminderHistory();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      // Fetch enabled setting
      const { data: enabledData } = await supabase
        .from("mfa_settings")
        .select("setting_value")
        .eq("setting_key", "mfa_enrollment_reminder_enabled")
        .single();

      if (enabledData) {
        setIsEnabled(enabledData.setting_value);
      }

      // Fetch numeric settings
      const { data: alertSettings } = await supabase
        .from("alert_settings")
        .select("setting_key, setting_value")
        .in("setting_key", ["mfa_enrollment_reminder_days", "mfa_enrollment_reminder_frequency_days"]);

      if (alertSettings) {
        const daysSetting = alertSettings.find((s) => s.setting_key === "mfa_enrollment_reminder_days");
        const freqSetting = alertSettings.find((s) => s.setting_key === "mfa_enrollment_reminder_frequency_days");
        if (daysSetting) setReminderDays(daysSetting.setting_value);
        if (freqSetting) setFrequencyDays(freqSetting.setting_value);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReminderHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("mfa_enrollment_reminders")
        .select("*")
        .order("sent_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setReminderHistory(data || []);
    } catch (error) {
      console.error("Error fetching reminder history:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Update enabled setting
      const { error: enabledError } = await supabase
        .from("mfa_settings")
        .update({ setting_value: isEnabled, updated_at: new Date().toISOString() })
        .eq("setting_key", "mfa_enrollment_reminder_enabled");

      if (enabledError) throw enabledError;

      // Update reminder days
      const { error: daysError } = await supabase
        .from("alert_settings")
        .update({ setting_value: reminderDays, updated_at: new Date().toISOString() })
        .eq("setting_key", "mfa_enrollment_reminder_days");

      if (daysError) throw daysError;

      // Update frequency days
      const { error: freqError } = await supabase
        .from("alert_settings")
        .update({ setting_value: frequencyDays, updated_at: new Date().toISOString() })
        .eq("setting_key", "mfa_enrollment_reminder_frequency_days");

      if (freqError) throw freqError;

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendRemindersNow = async () => {
    setIsSending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        toast.error("Not authenticated");
        return;
      }

      const { data, error } = await supabase.functions.invoke("notify-mfa-enrollment-reminder", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;

      if (data.sent > 0) {
        toast.success(`Sent ${data.sent} reminder(s) successfully`);
        fetchReminderHistory();
      } else {
        toast.info(data.message || "No reminders needed to be sent");
      }
    } catch (error: unknown) {
      console.error("Error sending reminders:", error);
      const errorMessage = error instanceof Error ? error.message : "Failed to send reminders";
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            MFA Enrollment Reminders
          </CardTitle>
          <CardDescription>
            Send email reminders to administrators who haven't enabled MFA after a configurable period.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="reminder-enabled">Enable Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Automatically send reminders to unenrolled admins
              </p>
            </div>
            <Switch
              id="reminder-enabled"
              checked={isEnabled}
              onCheckedChange={setIsEnabled}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reminder-days" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Days Before First Reminder
              </Label>
              <Input
                id="reminder-days"
                type="number"
                min={1}
                max={30}
                value={reminderDays}
                onChange={(e) => setReminderDays(parseInt(e.target.value) || 3)}
                disabled={!isEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Send first reminder after this many days as admin without MFA
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="frequency-days" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Days Between Reminders
              </Label>
              <Input
                id="frequency-days"
                type="number"
                min={1}
                max={14}
                value={frequencyDays}
                onChange={(e) => setFrequencyDays(parseInt(e.target.value) || 1)}
                disabled={!isEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Wait this many days before sending another reminder
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Settings"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleSendRemindersNow}
              disabled={isSending || !isEnabled}
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send Reminders Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Reminders Sent</CardTitle>
          <CardDescription>
            History of MFA enrollment reminder emails sent to administrators
          </CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reminderHistory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No reminders have been sent yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Sent At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminderHistory.map((reminder) => (
                  <TableRow key={reminder.id}>
                    <TableCell className="font-medium">{reminder.user_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {reminder.reminder_type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(reminder.sent_at), "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
