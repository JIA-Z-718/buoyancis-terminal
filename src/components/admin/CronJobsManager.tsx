import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Play, 
  Pause, 
  Trash2, 
  PlayCircle,
  Calendar,
  Terminal,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  Timer,
  Activity,
  TrendingUp,
  Zap,
  BarChart3,
  Bell,
  CalendarIcon,
  TrendingDown,
  Pencil
} from "lucide-react";
import { format, formatDistanceToNow, subDays } from "date-fns";
import { cn } from "@/lib/utils";
import CronJobTrendsChart from "./CronJobTrendsChart";
import CreateCronJobDialog from "./CreateCronJobDialog";
import EditCronJobDialog from "./EditCronJobDialog";
import CronSuccessRateWidget from "./CronSuccessRateWidget";
import CronJobThresholdDialog from "./CronJobThresholdDialog";

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  command: string;
  nodename: string;
  nodeport: number;
  database: string;
  username: string;
  active: boolean;
}

interface JobRunHistory {
  runid: number;
  jobid: number;
  job_pid: number;
  database: string;
  username: string;
  command: string;
  status: string;
  return_message: string | null;
  start_time: string;
  end_time: string | null;
}

const CronJobsManager = () => {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [history, setHistory] = useState<JobRunHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteJobId, setDeleteJobId] = useState<number | null>(null);
  const [editingJob, setEditingJob] = useState<CronJob | null>(null);
  const [thresholdJob, setThresholdJob] = useState<CronJob | null>(null);
  const [jobThresholds, setJobThresholds] = useState<Record<number, number>>({});
  const [jobNotifications, setJobNotifications] = useState<Record<number, boolean>>({});
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState("jobs");
  const [testingNotifications, setTestingNotifications] = useState(false);
  const [checkingSuccessRate, setCheckingSuccessRate] = useState(false);
  const [trendDateRange, setTrendDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const { toast } = useToast();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("manage-cron-jobs", {
        body: { action: "list" },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setJobs(response.data.jobs || []);
    } catch (error: any) {
      console.error("Error fetching cron jobs:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch cron jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async (jobId?: number, limit: number = 50) => {
    setHistoryLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("manage-cron-jobs", {
        body: { 
          action: "history", 
          jobId: jobId || null,
          limit
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setHistory(response.data.history || []);
    } catch (error: any) {
      console.error("Error fetching job history:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch job history",
        variant: "destructive",
      });
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchJobThresholds = async () => {
    try {
      const { data, error } = await supabase
        .from("cron_job_thresholds")
        .select("jobid, threshold_value, notifications_enabled");
      
      if (error) throw error;
      
      const thresholdMap: Record<number, number> = {};
      const notificationMap: Record<number, boolean> = {};
      for (const item of data || []) {
        thresholdMap[item.jobid] = Number(item.threshold_value);
        notificationMap[item.jobid] = item.notifications_enabled !== false;
      }
      setJobThresholds(thresholdMap);
      setJobNotifications(notificationMap);
    } catch (error) {
      console.error("Error fetching job thresholds:", error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchJobThresholds();
    // Fetch extended history for trends chart (7 days worth, higher limit)
    fetchHistory(undefined, 500);
  }, []);

  useEffect(() => {
    if (activeTab === "history" || activeTab === "trends") {
      const jobId = selectedJobFilter === "all" ? undefined : parseInt(selectedJobFilter);
      // Use higher limit for trends tab to get 7 days of data
      const limit = activeTab === "trends" ? 500 : 50;
      fetchHistory(jobId, limit);
    }
  }, [activeTab, selectedJobFilter]);

  // Calculate health metrics from history
  const healthMetrics = useMemo(() => {
    if (history.length === 0) {
      return {
        totalRuns: 0,
        successRate: 0,
        failedRuns: 0,
        avgRunTimeMs: 0,
        lastRunStatus: null as string | null,
        lastRunTime: null as string | null,
      };
    }

    const completedRuns = history.filter(h => h.status === "succeeded" || h.status === "failed");
    const successfulRuns = history.filter(h => h.status === "succeeded");
    const failedRuns = history.filter(h => h.status === "failed");
    
    const successRate = completedRuns.length > 0 
      ? (successfulRuns.length / completedRuns.length) * 100 
      : 0;

    // Calculate average run time
    const runsWithDuration = history.filter(h => h.start_time && h.end_time);
    const totalDurationMs = runsWithDuration.reduce((acc, run) => {
      const start = new Date(run.start_time).getTime();
      const end = new Date(run.end_time!).getTime();
      return acc + (end - start);
    }, 0);
    const avgRunTimeMs = runsWithDuration.length > 0 
      ? totalDurationMs / runsWithDuration.length 
      : 0;

    const lastRun = history[0];

    return {
      totalRuns: history.length,
      successRate,
      failedRuns: failedRuns.length,
      avgRunTimeMs,
      lastRunStatus: lastRun?.status || null,
      lastRunTime: lastRun?.start_time || null,
    };
  }, [history]);

  const formatAvgRunTime = (ms: number): string => {
    if (ms === 0) return "—";
    if (ms < 1000) return `${Math.round(ms)}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const handleToggle = async (jobId: number) => {
    setActionLoading(jobId);
    try {
      const response = await supabase.functions.invoke("manage-cron-jobs", {
        body: { action: "toggle", jobId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Success",
        description: "Job status updated",
      });
      fetchJobs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to toggle job",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteJobId) return;
    
    setActionLoading(deleteJobId);
    try {
      const response = await supabase.functions.invoke("manage-cron-jobs", {
        body: { action: "delete", jobId: deleteJobId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
      setDeleteJobId(null);
      fetchJobs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunNow = async (jobId: number) => {
    setActionLoading(jobId);
    try {
      const response = await supabase.functions.invoke("manage-cron-jobs", {
        body: { action: "run_now", jobId },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Success",
        description: "Job triggered successfully",
      });
      // Refresh history if on that tab
      if (activeTab === "history") {
        setTimeout(() => fetchHistory(selectedJobFilter === "all" ? undefined : parseInt(selectedJobFilter)), 1000);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to run job",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleTestNotifications = async () => {
    setTestingNotifications(true);
    try {
      const response = await supabase.functions.invoke("notify-cron-failures", {
        body: { time: new Date().toISOString() },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data.message === "No recent failures to notify about") {
        toast({
          title: "No Failures Found",
          description: "There are no recent cron job failures to notify about.",
        });
      } else if (data.message === "No admin users to notify") {
        toast({
          title: "No Admins Found",
          description: "No admin users found to receive notifications.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Notification Sent",
          description: `Alert email sent for ${data.failuresCount || 0} failure(s).`,
        });
      }
    } catch (error: any) {
      console.error("Error testing notifications:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to test notifications",
        variant: "destructive",
      });
    } finally {
      setTestingNotifications(false);
    }
  };

  const handleCheckSuccessRate = async () => {
    setCheckingSuccessRate(true);
    try {
      const response = await supabase.functions.invoke("check-cron-success-rate", {
        body: { time: new Date().toISOString() },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      
      if (data.message === "No cron job runs in the last 24 hours") {
        toast({
          title: "No Data",
          description: "No cron job runs found in the last 24 hours.",
        });
      } else if (data.newAlerts && data.newAlerts.length > 0) {
        toast({
          title: "Alert Triggered",
          description: `Success rate: ${data.overallSuccessRate}% (threshold: ${data.threshold}%). Alert email sent.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success Rate Check",
          description: `Current success rate: ${data.overallSuccessRate}% (threshold: ${data.threshold}%). No alert needed.`,
        });
      }
    } catch (error: any) {
      console.error("Error checking success rate:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to check success rate",
        variant: "destructive",
      });
    } finally {
      setCheckingSuccessRate(false);
    }
  };

  const parseSchedule = (schedule: string): string => {
    const patterns: Record<string, string> = {
      "* * * * *": "Every minute",
      "*/5 * * * *": "Every 5 minutes",
      "*/10 * * * *": "Every 10 minutes",
      "*/15 * * * *": "Every 15 minutes",
      "*/30 * * * *": "Every 30 minutes",
      "0 * * * *": "Every hour",
      "0 */2 * * *": "Every 2 hours",
      "0 */6 * * *": "Every 6 hours",
      "0 0 * * *": "Daily at midnight",
      "0 0 * * 0": "Weekly on Sunday",
    };
    return patterns[schedule] || schedule;
  };

  const extractFunctionName = (command: string): string => {
    const match = command.match(/functions\/v1\/([^'"]+)/);
    return match ? match[1] : "Custom SQL";
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "succeeded":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case "running":
        return (
          <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">
            <Timer className="h-3 w-3 mr-1 animate-spin" />
            Running
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="h-3 w-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const getJobNameById = (jobId: number): string => {
    const job = jobs.find(j => j.jobid === jobId);
    return job?.jobname || `Job #${jobId}`;
  };

  const calculateDuration = (start: string, end: string | null): string => {
    if (!end) return "In progress...";
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const durationMs = endTime - startTime;
    
    if (durationMs < 1000) return `${durationMs}ms`;
    if (durationMs < 60000) return `${(durationMs / 1000).toFixed(1)}s`;
    return `${(durationMs / 60000).toFixed(1)}m`;
  };

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Scheduled Tasks</CardTitle>
                <CardDescription>
                  Manage automated background jobs
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CreateCronJobDialog
                onJobCreated={() => {
                  fetchJobs();
                  fetchHistory(undefined, 500);
                }}
                existingFunctions={jobs.map(j => extractFunctionName(j.command)).filter(f => f !== "Custom SQL")}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCheckSuccessRate}
                    disabled={checkingSuccessRate}
                  >
                    <TrendingDown className={`h-4 w-4 ${checkingSuccessRate ? "animate-pulse" : ""}`} />
                    <span className="ml-2 hidden sm:inline">Check Rate</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Check 24h success rate and trigger alert if below threshold
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestNotifications}
                    disabled={testingNotifications}
                  >
                    <Bell className={`h-4 w-4 ${testingNotifications ? "animate-pulse" : ""}`} />
                    <span className="ml-2 hidden sm:inline">Test Alerts</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Manually check for failures and send notification
                </TooltipContent>
              </Tooltip>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  fetchJobs();
                  if (activeTab === "history" || activeTab === "trends") {
                    const jobId = selectedJobFilter === "all" ? undefined : parseInt(selectedJobFilter);
                    const limit = activeTab === "trends" ? 500 : 50;
                    fetchHistory(jobId, limit);
                  }
                }}
                disabled={loading || historyLoading}
              >
                <RefreshCw className={`h-4 w-4 ${loading || historyLoading ? "animate-spin" : ""}`} />
              </Button>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            {/* 24-Hour Success Rate Widget */}
            <div className="mb-6">
              <CronSuccessRateWidget />
            </div>

            {/* Health Metrics Summary */}
            {!loading && history.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Activity className="h-4 w-4" />
                    <span className="text-xs font-medium">Total Runs</span>
                  </div>
                  <p className="text-2xl font-bold">{healthMetrics.totalRuns}</p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-medium">Success Rate</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className={`text-2xl font-bold ${
                      healthMetrics.successRate >= 90 
                        ? "text-green-600 dark:text-green-400" 
                        : healthMetrics.successRate >= 70 
                          ? "text-amber-600 dark:text-amber-400" 
                          : "text-red-600 dark:text-red-400"
                    }`}>
                      {healthMetrics.successRate.toFixed(1)}%
                    </p>
                    {healthMetrics.successRate >= 90 && (
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <XCircle className="h-4 w-4" />
                    <span className="text-xs font-medium">Failed Runs</span>
                  </div>
                  <p className={`text-2xl font-bold ${
                    healthMetrics.failedRuns > 0 
                      ? "text-red-600 dark:text-red-400" 
                      : ""
                  }`}>
                    {healthMetrics.failedRuns}
                  </p>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs font-medium">Avg Run Time</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {formatAvgRunTime(healthMetrics.avgRunTimeMs)}
                  </p>
                </div>
              </div>
            )}

            {/* Last Run Status Banner */}
            {!loading && healthMetrics.lastRunStatus && healthMetrics.lastRunTime && (
              <div className={`flex items-center justify-between px-4 py-2 rounded-lg mb-4 ${
                healthMetrics.lastRunStatus === "succeeded" 
                  ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
                  : healthMetrics.lastRunStatus === "failed"
                    ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                    : "bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800"
              }`}>
                <div className="flex items-center gap-2">
                  {healthMetrics.lastRunStatus === "succeeded" ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : healthMetrics.lastRunStatus === "failed" ? (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  ) : (
                    <Timer className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                  )}
                  <span className={`text-sm font-medium ${
                    healthMetrics.lastRunStatus === "succeeded" 
                      ? "text-green-700 dark:text-green-300"
                      : healthMetrics.lastRunStatus === "failed"
                        ? "text-red-700 dark:text-red-300"
                        : "text-blue-700 dark:text-blue-300"
                  }`}>
                    Last run: {healthMetrics.lastRunStatus}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(healthMetrics.lastRunTime), { addSuffix: true })}
                </span>
              </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="jobs" className="gap-2">
                  <Terminal className="h-4 w-4" />
                  Jobs
                </TabsTrigger>
                <TabsTrigger value="trends" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Trends
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-2">
                  <History className="h-4 w-4" />
                  Run History
                </TabsTrigger>
              </TabsList>

              <TabsContent value="jobs">
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No scheduled tasks configured</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Schedule</TableHead>
                          <TableHead>Target</TableHead>
                          <TableHead>Threshold</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {jobs.map((job) => (
                          <TableRow key={job.jobid}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Terminal className="h-4 w-4 text-muted-foreground" />
                                {job.jobname}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help text-sm">
                                    {parseSchedule(job.schedule)}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <code className="text-xs">{job.schedule}</code>
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {extractFunctionName(job.command)}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => setThresholdJob(job)}
                                  >
                                    {jobThresholds[job.jobid] ? (
                                      <span className="font-medium">{jobThresholds[job.jobid]}%</span>
                                    ) : (
                                      <span className="text-muted-foreground">80% (default)</span>
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Click to configure success rate threshold
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <Badge variant={job.active ? "default" : "secondary"}>
                                {job.active ? "Active" : "Paused"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleRunNow(job.jobid)}
                                      disabled={actionLoading === job.jobid}
                                    >
                                      <PlayCircle className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Run now</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => setEditingJob(job)}
                                      disabled={actionLoading === job.jobid}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit schedule</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={() => handleToggle(job.jobid)}
                                      disabled={actionLoading === job.jobid}
                                    >
                                      {job.active ? (
                                        <Pause className="h-4 w-4" />
                                      ) : (
                                        <Play className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    {job.active ? "Pause" : "Resume"}
                                  </TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={() => setDeleteJobId(job.jobid)}
                                      disabled={actionLoading === job.jobid}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="trends">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <Select value={selectedJobFilter} onValueChange={setSelectedJobFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by job" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      {jobs.map((job) => (
                        <SelectItem key={job.jobid} value={job.jobid.toString()}>
                          {job.jobname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Date Range:</span>
                    <div className="flex items-center gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-[130px] justify-start text-left font-normal",
                              !trendDateRange.from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {trendDateRange.from ? format(trendDateRange.from, "MMM d, yyyy") : "Start date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={trendDateRange.from}
                            onSelect={(date) => date && setTrendDateRange(prev => ({ ...prev, from: date }))}
                            disabled={(date) => date > trendDateRange.to || date > new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                      <span className="text-muted-foreground">to</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className={cn(
                              "w-[130px] justify-start text-left font-normal",
                              !trendDateRange.to && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {trendDateRange.to ? format(trendDateRange.to, "MMM d, yyyy") : "End date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={trendDateRange.to}
                            onSelect={(date) => date && setTrendDateRange(prev => ({ ...prev, to: date }))}
                            disabled={(date) => date < trendDateRange.from || date > new Date()}
                            initialFocus
                            className={cn("p-3 pointer-events-auto")}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Quick range buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTrendDateRange({ from: subDays(new Date(), 6), to: new Date() })}
                      className="text-xs"
                    >
                      7D
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTrendDateRange({ from: subDays(new Date(), 13), to: new Date() })}
                      className="text-xs"
                    >
                      14D
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTrendDateRange({ from: subDays(new Date(), 29), to: new Date() })}
                      className="text-xs"
                    >
                      30D
                    </Button>
                  </div>
                </div>
                <CronJobTrendsChart history={history} loading={historyLoading} dateRange={trendDateRange} />
              </TabsContent>

              <TabsContent value="history">
                <div className="flex items-center justify-between mb-4">
                  <Select value={selectedJobFilter} onValueChange={setSelectedJobFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filter by job" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Jobs</SelectItem>
                      {jobs.map((job) => (
                        <SelectItem key={job.jobid} value={job.jobid.toString()}>
                          {job.jobname}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {historyLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No run history available</p>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Job</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Started</TableHead>
                          <TableHead>Duration</TableHead>
                          <TableHead>Message</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {history.map((run) => (
                          <TableRow key={run.runid}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Terminal className="h-4 w-4 text-muted-foreground" />
                                {getJobNameById(run.jobid)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(run.status)}
                            </TableCell>
                            <TableCell>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-sm cursor-help">
                                    {formatDistanceToNow(new Date(run.start_time), { addSuffix: true })}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {format(new Date(run.start_time), "PPpp")}
                                </TooltipContent>
                              </Tooltip>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {calculateDuration(run.start_time, run.end_time)}
                              </span>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              {run.return_message ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-muted-foreground truncate block cursor-help">
                                      {run.return_message.substring(0, 50)}
                                      {run.return_message.length > 50 && "..."}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[400px]">
                                    <pre className="text-xs whitespace-pre-wrap">{run.return_message}</pre>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      <AlertDialog open={deleteJobId !== null} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Scheduled Task</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this scheduled task? This action cannot be undone.
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

      <EditCronJobDialog
        job={editingJob}
        open={editingJob !== null}
        onOpenChange={(open) => !open && setEditingJob(null)}
        onJobUpdated={fetchJobs}
      />

      <CronJobThresholdDialog
        job={thresholdJob}
        open={thresholdJob !== null}
        onOpenChange={(open) => !open && setThresholdJob(null)}
        onSaved={fetchJobThresholds}
        currentThreshold={thresholdJob ? jobThresholds[thresholdJob.jobid] : undefined}
        notificationsEnabled={thresholdJob ? jobNotifications[thresholdJob.jobid] ?? true : true}
      />
    </Card>
  );
};

export default CronJobsManager;
