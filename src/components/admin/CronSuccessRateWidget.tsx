import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SuccessRateData {
  overallSuccessRate: string;
  threshold: number;
  totalRuns: number;
  succeededRuns: number;
  failedRuns: number;
  problematicJobs: Array<{
    jobName: string;
    succeeded: number;
    failed: number;
    total: number;
  }>;
}

const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes

const CronSuccessRateWidget = () => {
  const [data, setData] = useState<SuccessRateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchSuccessRate = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const response = await supabase.functions.invoke("check-cron-success-rate", {
        body: { time: new Date().toISOString() },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      if (response.data.message === "No cron job runs in the last 24 hours") {
        setData(null);
      } else {
        setData(response.data);
      }
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error("Error fetching success rate:", err);
      setError(err.message || "Failed to fetch success rate");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuccessRate();
    
    // Auto-refresh every 5 minutes
    const intervalId = setInterval(() => {
      fetchSuccessRate(false); // Don't show loading spinner on auto-refresh
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  // Format last updated time
  const getLastUpdatedText = () => {
    if (!lastUpdated) return null;
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 min ago";
    return `${diffMins} mins ago`;
  };

  useEffect(() => {
    fetchSuccessRate();
  }, []);

  const getStatusConfig = (rate: number, threshold: number) => {
    if (rate >= 95) {
      return {
        status: "excellent",
        label: "Excellent",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-500/10 border-green-500/20",
        ringColor: "ring-green-500",
        icon: CheckCircle,
        progressColor: "bg-green-500",
      };
    } else if (rate >= threshold) {
      return {
        status: "healthy",
        label: "Healthy",
        color: "text-emerald-600 dark:text-emerald-400",
        bgColor: "bg-emerald-500/10 border-emerald-500/20",
        ringColor: "ring-emerald-500",
        icon: TrendingUp,
        progressColor: "bg-emerald-500",
      };
    } else if (rate >= 50) {
      return {
        status: "warning",
        label: "Warning",
        color: "text-amber-600 dark:text-amber-400",
        bgColor: "bg-amber-500/10 border-amber-500/20",
        ringColor: "ring-amber-500",
        icon: AlertTriangle,
        progressColor: "bg-amber-500",
      };
    } else {
      return {
        status: "critical",
        label: "Critical",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-500/10 border-red-500/20",
        ringColor: "ring-red-500",
        icon: XCircle,
        progressColor: "bg-red-500",
      };
    }
  };

  if (loading) {
    return (
      <Card className="border-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-24" />
            </div>
            <Skeleton className="h-20 w-20 rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-2 border-destructive/20 bg-destructive/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-destructive">Error loading success rate</p>
              <p className="text-xs text-muted-foreground mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchSuccessRate()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-muted">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">24-Hour Success Rate</p>
                <p className="text-lg font-semibold">No data available</p>
                <p className="text-xs text-muted-foreground">No cron jobs have run in the last 24 hours</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => fetchSuccessRate()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const rate = parseFloat(data.overallSuccessRate);
  const statusConfig = getStatusConfig(rate, data.threshold);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className={cn("border-2 transition-all", statusConfig.bgColor)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-6">
          {/* Left side - Stats */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">24-Hour Success Rate</span>
              <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
                {statusConfig.label}
              </Badge>
            </div>
            
            <div className="flex items-baseline gap-2 mb-4">
              <span className={cn("text-4xl font-bold tracking-tight", statusConfig.color)}>
                {rate.toFixed(1)}%
              </span>
              <span className="text-sm text-muted-foreground">
                threshold: {data.threshold}%
              </span>
              {lastUpdated && (
                <span className="text-xs text-muted-foreground ml-auto">
                  Updated {getLastUpdatedText()}
                </span>
              )}
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-3">
              <div 
                className={cn("h-full transition-all duration-500", statusConfig.progressColor)}
                style={{ width: `${Math.min(rate, 100)}%` }}
              />
            </div>

            {/* Run stats */}
            <div className="flex items-center gap-4 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="flex items-center gap-1.5 cursor-default">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="font-medium">{data.succeededRuns}</span>
                    <span className="text-muted-foreground">succeeded</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Successful runs in 24h</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="flex items-center gap-1.5 cursor-default">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span className="font-medium">{data.failedRuns}</span>
                    <span className="text-muted-foreground">failed</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Failed runs in 24h</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <button type="button" className="flex items-center gap-1.5 cursor-default">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{data.totalRuns}</span>
                    <span className="text-muted-foreground">total</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>Total runs in 24h</TooltipContent>
              </Tooltip>
            </div>

            {/* Problematic jobs alert */}
            {data.problematicJobs && data.problematicJobs.length > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                  <AlertTriangle className="h-4 w-4" />
                  Jobs Below Threshold
                </div>
                <div className="space-y-1">
                  {data.problematicJobs.slice(0, 3).map((job, idx) => {
                    const jobRate = job.total > 0 ? (job.succeeded / job.total) * 100 : 0;
                    return (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground truncate max-w-[200px]">{job.jobName}</span>
                        <span className="text-destructive font-medium">{jobRate.toFixed(0)}%</span>
                      </div>
                    );
                  })}
                  {data.problematicJobs.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      +{data.problematicJobs.length - 3} more jobs
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right side - Circular indicator */}
          <div className="relative flex-shrink-0">
            <div className={cn(
              "w-24 h-24 rounded-full flex items-center justify-center",
              "ring-4 ring-offset-2 ring-offset-background transition-all",
              statusConfig.ringColor
            )}>
              <div className="text-center">
                <StatusIcon className={cn("h-8 w-8 mx-auto mb-1", statusConfig.color)} />
                <span className={cn("text-xs font-medium", statusConfig.color)}>
                  {statusConfig.label}
                </span>
              </div>
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-background shadow-md"
                  onClick={() => fetchSuccessRate()}
                >
                  <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Refresh success rate</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CronSuccessRateWidget;
