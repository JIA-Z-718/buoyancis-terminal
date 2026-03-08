import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertTriangle, CheckCircle, TrendingUp, BellOff, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  command: string;
  active: boolean;
}

interface CronJobThresholdDialogProps {
  job: CronJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
  currentThreshold?: number;
  notificationsEnabled?: boolean;
}

const DEFAULT_THRESHOLD = 80;

const CronJobThresholdDialog = ({
  job,
  open,
  onOpenChange,
  onSaved,
  currentThreshold,
  notificationsEnabled = true,
}: CronJobThresholdDialogProps) => {
  const [threshold, setThreshold] = useState(currentThreshold ?? DEFAULT_THRESHOLD);
  const [saving, setSaving] = useState(false);
  const [useDefault, setUseDefault] = useState(!currentThreshold);
  const [emailNotifications, setEmailNotifications] = useState(notificationsEnabled);
  const { toast } = useToast();

  useEffect(() => {
    if (open && job) {
      setThreshold(currentThreshold ?? DEFAULT_THRESHOLD);
      setUseDefault(!currentThreshold);
      setEmailNotifications(notificationsEnabled);
    }
  }, [open, job, currentThreshold, notificationsEnabled]);

  const handleSave = async () => {
    if (!job) return;

    setSaving(true);
    try {
      if (useDefault && emailNotifications) {
        // Delete any custom threshold to use global default (only if notifications are enabled)
        const { error } = await supabase
          .from("cron_job_thresholds")
          .delete()
          .eq("jobid", job.jobid);

        if (error) throw error;

        toast({
          title: "Threshold Reset",
          description: `${job.jobname} will now use the global default threshold.`,
        });
      } else {
        // Upsert custom threshold and notification settings
        const { error } = await supabase
          .from("cron_job_thresholds")
          .upsert(
            {
              jobid: job.jobid,
              threshold_value: useDefault ? DEFAULT_THRESHOLD : threshold,
              notifications_enabled: emailNotifications,
            },
            { onConflict: "jobid" }
          );

        if (error) throw error;

        const notificationStatus = emailNotifications ? "enabled" : "disabled";
        toast({
          title: "Settings Saved",
          description: useDefault 
            ? `${job.jobname}: using global threshold, notifications ${notificationStatus}.`
            : `${job.jobname}: ${threshold}% threshold, notifications ${notificationStatus}.`,
        });
      }

      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving threshold:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save threshold",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getThresholdStatus = (value: number) => {
    if (value >= 95) return { label: "Strict", color: "text-green-600 dark:text-green-400", icon: CheckCircle };
    if (value >= 80) return { label: "Standard", color: "text-emerald-600 dark:text-emerald-400", icon: TrendingUp };
    if (value >= 50) return { label: "Lenient", color: "text-amber-600 dark:text-amber-400", icon: AlertTriangle };
    return { label: "Very Lenient", color: "text-orange-600 dark:text-orange-400", icon: AlertTriangle };
  };

  const status = getThresholdStatus(threshold);
  const StatusIcon = status.icon;

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure Success Rate Threshold</DialogTitle>
          <DialogDescription>
            Set a custom success rate threshold for <strong>{job.jobname}</strong>.
            Alerts will trigger when the job's 24-hour success rate drops below this value.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Use Default Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
            <div>
              <p className="text-sm font-medium">Use Global Default</p>
              <p className="text-xs text-muted-foreground">Currently 80%</p>
            </div>
            <Button
              variant={useDefault ? "default" : "outline"}
              size="sm"
              onClick={() => setUseDefault(!useDefault)}
            >
              {useDefault ? "Using Default" : "Custom"}
            </Button>
          </div>

          {/* Custom Threshold Slider */}
          <div className={cn("space-y-4 transition-opacity", useDefault && "opacity-50 pointer-events-none")}>
            <div className="flex items-center justify-between">
              <Label>Custom Threshold</Label>
              <div className="flex items-center gap-2">
                <StatusIcon className={cn("h-4 w-4", status.color)} />
                <Badge variant="outline" className={status.color}>
                  {status.label}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              <Slider
                value={[threshold]}
                onValueChange={([value]) => setThreshold(value)}
                min={10}
                max={100}
                step={5}
                disabled={useDefault}
              />
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">10%</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={threshold}
                    onChange={(e) => setThreshold(Math.min(100, Math.max(10, parseInt(e.target.value) || 10)))}
                    className="w-20 h-8 text-center"
                    min={10}
                    max={100}
                    disabled={useDefault}
                  />
                  <span className="text-muted-foreground">%</span>
                </div>
                <span className="text-muted-foreground">100%</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              An alert will be triggered if the success rate falls below {threshold}% in a 24-hour period.
            </p>
          </div>

          {/* Email Notifications Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
            <div className="flex items-center gap-3">
              {emailNotifications ? (
                <Bell className="h-4 w-4 text-primary" />
              ) : (
                <BellOff className="h-4 w-4 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">
                  {emailNotifications 
                    ? "Receive alerts when this job fails its threshold" 
                    : "No emails will be sent for this job's failures"}
                </p>
              </div>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>

          {/* Preview */}
          <div className="p-3 rounded-lg border bg-card">
            <p className="text-sm font-medium mb-2">Current Configuration</p>
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-muted-foreground">Alert Threshold:</span>
              <span className="font-medium">
                {useDefault ? "80% (global default)" : `${threshold}% (custom)`}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Notifications:</span>
              <span className={cn("font-medium", emailNotifications ? "text-green-600" : "text-muted-foreground")}>
                {emailNotifications ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Threshold
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CronJobThresholdDialog;
