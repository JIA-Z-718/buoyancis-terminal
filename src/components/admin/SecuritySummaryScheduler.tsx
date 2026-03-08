import { useState, useEffect } from "react";
import { Shield, Mail, Clock, Save, Loader2, Trash2, Send } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MultiEmailAutocompleteInput from "@/components/ui/multi-email-autocomplete-input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DAYS_OF_WEEK = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
  value: `${i.toString().padStart(2, "0")}:00:00`,
  label: format(new Date().setHours(i, 0, 0, 0), "h:mm a"),
}));

interface ScheduleData {
  id?: string;
  frequency: "daily" | "weekly";
  day_of_week: number | null;
  time_of_day: string;
  recipient_emails: string[];
  is_enabled: boolean;
  last_sent_at?: string | null;
}

export default function SecuritySummaryScheduler() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [emailInputValue, setEmailInputValue] = useState("");
  const [schedule, setSchedule] = useState<ScheduleData>({
    frequency: "weekly",
    day_of_week: 1,
    time_of_day: "09:00:00",
    recipient_emails: [],
    is_enabled: false,
  });

  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("security_summary_schedules")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSchedule({
          id: data.id,
          frequency: data.frequency as "daily" | "weekly",
          day_of_week: data.day_of_week,
          time_of_day: data.time_of_day,
          recipient_emails: data.recipient_emails || [],
          is_enabled: data.is_enabled,
          last_sent_at: data.last_sent_at,
        });
      }
    } catch (error) {
      console.error("Error loading schedule:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (schedule.recipient_emails.length > 0 && !emailInputValue) {
      setEmailInputValue(schedule.recipient_emails.join(", ") + ", ");
    }
  }, [schedule.recipient_emails]);

  const handleSave = async () => {
    if (schedule.recipient_emails.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one recipient email",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const scheduleData = {
        user_id: user.id,
        frequency: schedule.frequency,
        day_of_week: schedule.frequency === "weekly" ? schedule.day_of_week : null,
        time_of_day: schedule.time_of_day,
        recipient_emails: schedule.recipient_emails,
        is_enabled: schedule.is_enabled,
      };

      if (schedule.id) {
        const { error } = await supabase
          .from("security_summary_schedules")
          .update(scheduleData)
          .eq("id", schedule.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("security_summary_schedules")
          .insert(scheduleData)
          .select()
          .single();

        if (error) throw error;
        setSchedule((prev) => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Schedule Saved",
        description: schedule.is_enabled
          ? `Security summary will be sent ${schedule.frequency} at ${format(
              new Date().setHours(parseInt(schedule.time_of_day.split(":")[0]), 0, 0, 0),
              "h:mm a"
            )}`
          : "Schedule saved but currently disabled",
      });
    } catch (error) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Error",
        description: "Failed to save schedule",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!schedule.id) return;

    try {
      const { error } = await supabase
        .from("security_summary_schedules")
        .delete()
        .eq("id", schedule.id);

      if (error) throw error;

      setSchedule({
        frequency: "weekly",
        day_of_week: 1,
        time_of_day: "09:00:00",
        recipient_emails: [],
        is_enabled: false,
      });
      setEmailInputValue("");

      toast({
        title: "Schedule Deleted",
        description: "Security summary schedule has been removed",
      });
    } catch (error) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      });
    }
  };

  const handleSendTestEmail = async () => {
    if (schedule.recipient_emails.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please add at least one recipient email",
        variant: "destructive",
      });
      return;
    }

    setIsSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke("send-security-summary", {
        body: {
          recipientEmails: schedule.recipient_emails,
          isManualTrigger: true,
        },
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `Security summary sent to ${schedule.recipient_emails.length} recipient(s)`,
      });
    } catch (error) {
      console.error("Error sending test email:", error);
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    } finally {
      setIsSendingTest(false);
    }
  };
  const handleEmailValueChange = (value: string) => {
    setEmailInputValue(value);
    // Parse emails from comma-separated value
    const emails = value
      .split(",")
      .map((e) => e.trim())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
    setSchedule((prev) => ({ ...prev, recipient_emails: emails }));
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <div>
            <CardTitle className="text-lg">Security Summary Schedule</CardTitle>
            <CardDescription>
              Configure automated weekly security reports sent to admins
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label htmlFor="schedule-enabled" className="text-sm font-medium">
                Enable Scheduled Reports
              </Label>
              <p className="text-xs text-muted-foreground">
                Automatically send security summaries on schedule
              </p>
            </div>
          </div>
          <Switch
            id="schedule-enabled"
            checked={schedule.is_enabled}
            onCheckedChange={(checked) =>
              setSchedule((prev) => ({ ...prev, is_enabled: checked }))
            }
          />
        </div>

        {/* Frequency Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={schedule.frequency}
              onValueChange={(value: "daily" | "weekly") =>
                setSchedule((prev) => ({ ...prev, frequency: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {schedule.frequency === "weekly" && (
            <div className="space-y-2">
              <Label>Day of Week</Label>
              <Select
                value={String(schedule.day_of_week ?? 1)}
                onValueChange={(value) =>
                  setSchedule((prev) => ({ ...prev, day_of_week: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_OF_WEEK.map((day) => (
                    <SelectItem key={day.value} value={day.value}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Time Selection */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Time of Day
          </Label>
          <Select
            value={schedule.time_of_day}
            onValueChange={(value) =>
              setSchedule((prev) => ({ ...prev, time_of_day: value }))
            }
          >
            <SelectTrigger className="w-full md:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIME_OPTIONS.map((time) => (
                <SelectItem key={time.value} value={time.value}>
                  {time.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recipient Emails */}
        <div className="space-y-2">
          <Label>Recipient Emails</Label>
          <MultiEmailAutocompleteInput
            value={emailInputValue}
            onValueChange={handleEmailValueChange}
            placeholder="Enter admin email addresses..."
          />
          {schedule.recipient_emails.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {schedule.recipient_emails.length} recipient(s) configured
            </p>
          )}
        </div>

        {/* Last Sent Info */}
        {schedule.last_sent_at && (
          <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg">
            Last sent: {format(new Date(schedule.last_sent_at), "PPpp")}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Schedule
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={handleSendTestEmail}
            disabled={isSendingTest || schedule.recipient_emails.length === 0}
          >
            {isSendingTest ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Test Email
              </>
            )}
          </Button>

          {schedule.id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Schedule</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this security summary schedule?
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
