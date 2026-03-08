import { useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2, Clock, Terminal, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreateCronJobDialogProps {
  onJobCreated: () => void;
  existingFunctions: string[];
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

const AVAILABLE_FUNCTIONS = [
  "check-deliverability-alerts",
  "escalate-alerts",
  "notify-cron-failures",
  "process-scheduled-emails",
];

const CreateCronJobDialog = ({ onJobCreated, existingFunctions }: CreateCronJobDialogProps) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jobName, setJobName] = useState("");
  const [schedulePreset, setSchedulePreset] = useState("");
  const [customSchedule, setCustomSchedule] = useState("");
  const [functionName, setFunctionName] = useState("");
  const { toast } = useToast();

  // Combine available functions with any from existing jobs
  const allFunctions = Array.from(new Set([...AVAILABLE_FUNCTIONS, ...existingFunctions]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const schedule = schedulePreset === "custom" ? customSchedule : schedulePreset;
    
    if (!jobName.trim()) {
      toast({
        title: "Validation Error",
        description: "Job name is required",
        variant: "destructive",
      });
      return;
    }

    if (!schedule) {
      toast({
        title: "Validation Error",
        description: "Schedule is required",
        variant: "destructive",
      });
      return;
    }

    if (!functionName) {
      toast({
        title: "Validation Error",
        description: "Function name is required",
        variant: "destructive",
      });
      return;
    }

    // Validate job name format
    const jobNameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!jobNameRegex.test(jobName)) {
      toast({
        title: "Validation Error",
        description: "Job name can only contain letters, numbers, hyphens, and underscores",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await supabase.functions.invoke("manage-cron-jobs", {
        body: {
          action: "create",
          jobName: jobName.trim(),
          schedule,
          functionName,
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
        description: `Cron job "${jobName}" created successfully`,
      });

      // Reset form and close
      setJobName("");
      setSchedulePreset("");
      setCustomSchedule("");
      setFunctionName("");
      setOpen(false);
      onJobCreated();
    } catch (error: any) {
      console.error("Error creating cron job:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create cron job",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Create Scheduled Task
            </DialogTitle>
            <DialogDescription>
              Schedule an edge function to run automatically on a recurring basis.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Job Name */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="jobName">Job Name</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      A unique identifier for this job. Use letters, numbers, hyphens, or underscores.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="jobName"
                placeholder="e.g., daily-cleanup"
                value={jobName}
                onChange={(e) => setJobName(e.target.value)}
                maxLength={63}
              />
            </div>

            {/* Schedule */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Schedule</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      How often the job should run. Select a preset or enter a custom cron expression.
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

            {/* Function */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label>Edge Function</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      The edge function to invoke on schedule. Must be deployed and accessible.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select value={functionName} onValueChange={setFunctionName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select function">
                    {functionName && (
                      <span className="flex items-center gap-2">
                        <Terminal className="h-3.5 w-3.5" />
                        {functionName}
                      </span>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {allFunctions.map((fn) => (
                    <SelectItem key={fn} value={fn}>
                      <span className="flex items-center gap-2">
                        <Terminal className="h-3.5 w-3.5" />
                        {fn}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCronJobDialog;
