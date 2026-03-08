import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Clock, Info, Save } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditCronJobDialogProps {
  job: {
    jobid: number;
    jobname: string;
    schedule: string;
  } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobUpdated: () => void;
}

const SCHEDULE_PRESETS = [
  { label: "Every minute", value: "* * * * *" },
  { label: "Every 5 minutes", value: "*/5 * * * *" },
  { label: "Every 10 minutes", value: "*/10 * * * *" },
  { label: "Every 15 minutes", value: "*/15 * * * *" },
  { label: "Every 30 minutes", value: "*/30 * * * *" },
  { label: "Every hour", value: "0 * * * *" },
  { label: "Every 2 hours", value: "0 */2 * * *" },
  { label: "Every 6 hours", value: "0 */6 * * *" },
  { label: "Every 12 hours", value: "0 */12 * * *" },
  { label: "Daily at midnight", value: "0 0 * * *" },
  { label: "Daily at 6 AM", value: "0 6 * * *" },
  { label: "Daily at noon", value: "0 12 * * *" },
  { label: "Weekly on Sunday", value: "0 0 * * 0" },
  { label: "Weekly on Monday", value: "0 0 * * 1" },
  { label: "Custom", value: "custom" },
];

const EditCronJobDialog = ({ job, open, onOpenChange, onJobUpdated }: EditCronJobDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [schedulePreset, setSchedulePreset] = useState("");
  const [customSchedule, setCustomSchedule] = useState("");
  const { toast } = useToast();

  // Initialize form when job changes
  useEffect(() => {
    if (job) {
      const preset = SCHEDULE_PRESETS.find(p => p.value === job.schedule);
      if (preset && preset.value !== "custom") {
        setSchedulePreset(job.schedule);
        setCustomSchedule("");
      } else {
        setSchedulePreset("custom");
        setCustomSchedule(job.schedule);
      }
    }
  }, [job]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!job) return;

    const schedule = schedulePreset === "custom" ? customSchedule : schedulePreset;
    
    if (!schedule) {
      toast({
        title: "Validation Error",
        description: "Schedule is required",
        variant: "destructive",
      });
      return;
    }

    // Validate cron format
    const cronRegex = /^(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)\s+(\*|[0-9,\-\/]+)$/;
    if (!cronRegex.test(schedule)) {
      toast({
        title: "Validation Error",
        description: "Invalid cron schedule format",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke("manage-cron-jobs", {
        body: {
          action: "update",
          jobId: job.jobid,
          schedule,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.error) {
        throw new Error(response.data.error);
      }

      toast({
        title: "Success",
        description: `Schedule for "${job.jobname}" updated successfully`,
      });

      onOpenChange(false);
      onJobUpdated();
    } catch (error: any) {
      console.error("Error updating cron job:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update cron job",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const parseScheduleLabel = (schedule: string): string => {
    const preset = SCHEDULE_PRESETS.find(p => p.value === schedule);
    return preset ? preset.label : schedule;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Edit Schedule
            </DialogTitle>
            <DialogDescription>
              Update the schedule for <span className="font-medium">{job?.jobname}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Current Schedule */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="text-xs text-muted-foreground mb-1">Current Schedule</div>
              <div className="font-mono text-sm">{job?.schedule}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {job && parseScheduleLabel(job.schedule)}
              </div>
            </div>

            {/* New Schedule */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>New Schedule</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      Select a preset or enter a custom cron expression.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={schedulePreset} onValueChange={setSchedulePreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_PRESETS.map((preset) => (
                    <SelectItem key={preset.value} value={preset.value}>
                      {preset.label}
                      {preset.value !== "custom" && (
                        <span className="ml-2 text-muted-foreground text-xs">
                          ({preset.value})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {schedulePreset === "custom" && (
                <div className="space-y-2">
                  <Input
                    placeholder="e.g., */15 * * * * (every 15 min)"
                    value={customSchedule}
                    onChange={(e) => setCustomSchedule(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Format: minute hour day-of-month month day-of-week
                  </p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditCronJobDialog;
