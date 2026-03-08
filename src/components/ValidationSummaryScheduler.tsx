import { useState, useEffect } from "react";
import { CalendarClock, Mail, Clock, Save, Loader2, Trash2 } from "lucide-react";
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

export default function ValidationSummaryScheduler() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [emailInputValue, setEmailInputValue] = useState("");
  const [schedule, setSchedule] = useState<ScheduleData>({
    frequency: "daily",
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
        .from("validation_summary_schedules")
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

  // Sync emailInputValue with recipient_emails for MultiEmailAutocompleteInput
  useEffect(() => {
    if (schedule.recipient_emails.length > 0 && !emailInputValue) {
      setEmailInputValue(schedule.recipient_emails.join(", ") + ", ");
    }
  }, [schedule.recipient_emails]);

  const parseEmailsFromValue = (value: string): string[] => {
    return value
      .split(",")
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  };

  const handleEmailValueChange = (value: string) => {
    setEmailInputValue(value);
    const validEmails = parseEmailsFromValue(value);
    setSchedule(prev => ({ ...prev, recipient_emails: validEmails }));
  };

  const handleSave = async () => {
    if (schedule.recipient_emails.length === 0) {
      toast({
        title: "Recipients Required",
        description: "Please add at least one email recipient.",
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
          .from("validation_summary_schedules")
          .update(scheduleData)
          .eq("id", schedule.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("validation_summary_schedules")
          .insert(scheduleData)
          .select()
          .single();
        if (error) throw error;
        setSchedule(prev => ({ ...prev, id: data.id }));
      }

      toast({
        title: "Schedule Saved",
        description: schedule.is_enabled 
          ? `${schedule.frequency === "daily" ? "Daily" : "Weekly"} digest scheduled successfully.`
          : "Schedule saved but currently disabled.",
      });
    } catch (error: any) {
      console.error("Error saving schedule:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save schedule.",
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
        .from("validation_summary_schedules")
        .delete()
        .eq("id", schedule.id);

      if (error) throw error;

      setSchedule({
        frequency: "daily",
        day_of_week: 1,
        time_of_day: "09:00:00",
        recipient_emails: [],
        is_enabled: false,
      });

      toast({
        title: "Schedule Deleted",
        description: "The validation summary schedule has been removed.",
      });
    } catch (error: any) {
      console.error("Error deleting schedule:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete schedule.",
        variant: "destructive",
      });
    }
  };

  const handleSendTestEmail = async () => {
    if (schedule.recipient_emails.length === 0) {
      toast({
        title: "Recipients Required",
        description: "Please add at least one email recipient.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke("send-validation-summary", {
        body: {
          frequency: schedule.frequency,
          recipientEmails: schedule.recipient_emails,
          summaryData: {
            totalValidations: 42,
            successCount: 38,
            failedCount: 4,
            topErrors: [
              { path: "/data/items/0/id", message: "must be string", count: 2 },
              { path: "/metadata/version", message: "must match pattern", count: 1 },
              { path: "/config/timeout", message: "must be >= 0", count: 1 },
            ],
          },
        },
      });

      if (error) throw error;

      toast({
        title: "Test Email Sent",
        description: `Sent test ${schedule.frequency} digest to ${schedule.recipient_emails.length} recipient(s).`,
      });
    } catch (error: any) {
      console.error("Error sending test email:", error);
      toast({
        title: "Send Failed",
        description: error.message || "Failed to send test email.",
        variant: "destructive",
      });
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Scheduled Digests</CardTitle>
          </div>
          <Switch
            checked={schedule.is_enabled}
            onCheckedChange={(checked) => setSchedule(prev => ({ ...prev, is_enabled: checked }))}
          />
        </div>
        <CardDescription>
          Receive automated validation summary emails on a schedule
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Frequency */}
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Select
            value={schedule.frequency}
            onValueChange={(value: "daily" | "weekly") => 
              setSchedule(prev => ({ ...prev, frequency: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily Digest</SelectItem>
              <SelectItem value="weekly">Weekly Digest</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Day of Week (for weekly) */}
        {schedule.frequency === "weekly" && (
          <div className="space-y-2">
            <Label>Day of Week</Label>
            <Select
              value={schedule.day_of_week?.toString() || "1"}
              onValueChange={(value) => 
                setSchedule(prev => ({ ...prev, day_of_week: parseInt(value) }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map(day => (
                  <SelectItem key={day.value} value={day.value}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Time */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Time
          </Label>
          <Select
            value={schedule.time_of_day}
            onValueChange={(value) => 
              setSchedule(prev => ({ ...prev, time_of_day: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-64">
              {TIME_OPTIONS.map(time => (
                <SelectItem key={time.value} value={time.value}>
                  {time.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Recipients */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Mail className="h-3.5 w-3.5" />
            Recipients
          </Label>
          <MultiEmailAutocompleteInput
            value={emailInputValue}
            onValueChange={handleEmailValueChange}
            placeholder="Add recipients from history..."
            autocompleteOptions={{ maxSuggestions: 6 }}
          />
        </div>

        {/* Last Sent */}
        {schedule.last_sent_at && (
          <p className="text-xs text-muted-foreground">
            Last sent: {format(new Date(schedule.last_sent_at), "PPpp")}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1">
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <Save className="h-4 w-4 mr-1.5" />
            )}
            Save Schedule
          </Button>
          <Button variant="outline" onClick={handleSendTestEmail}>
            Send Test
          </Button>
          {schedule.id && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Schedule?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently remove your validation summary schedule. 
                    You can create a new one at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
