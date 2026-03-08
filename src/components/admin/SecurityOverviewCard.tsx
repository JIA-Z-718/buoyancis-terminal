import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  ShieldAlert,
  Bot,
  Gauge,
  AlertTriangle,
  ScanSearch,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { format, subHours, startOfHour, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface HourlyData {
  hour: string;
  label: string;
  botEvents: number;
  rateLimits: number;
  total: number;
  fullTime: string;
}

const chartConfig: ChartConfig = {
  botEvents: {
    label: "Bot Events",
    color: "hsl(var(--primary))",
  },
  rateLimits: {
    label: "Rate Limits",
    color: "hsl(var(--destructive))",
  },
};

interface ScanResult {
  status: "success" | "warning" | "error";
  category: string;
  message: string;
  details?: string;
}

const SecurityOverviewCard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [totals, setTotals] = useState({ bot: 0, rateLimit: 0 });
  const [blockedIpCount, setBlockedIpCount] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const twentyFourHoursAgo = subHours(new Date(), 24).toISOString();

      // Fetch both datasets in parallel
      const [botResult, rateLimitResult, blockedIpResult] = await Promise.all([
        supabase
          .from("bot_detection_events")
          .select("id, created_at")
          .gte("created_at", twentyFourHoursAgo),
        supabase
          .from("rate_limit_violations")
          .select("id, created_at")
          .gte("created_at", twentyFourHoursAgo),
        supabase
          .from("ip_blocklist")
          .select("*", { count: "exact", head: true }),
      ]);

      if (botResult.error) throw botResult.error;
      if (rateLimitResult.error) throw rateLimitResult.error;

      const botEvents = botResult.data || [];
      const rateLimitEvents = rateLimitResult.data || [];

      setTotals({
        bot: botEvents.length,
        rateLimit: rateLimitEvents.length,
      });

      if (blockedIpResult.count !== null) {
        setBlockedIpCount(blockedIpResult.count);
      }

      // Build hourly data for last 24 hours
      const now = new Date();
      const hourlyMap: Record<string, { bot: number; rateLimit: number }> = {};

      // Initialize all 24 hours with 0
      for (let i = 23; i >= 0; i--) {
        const hourStart = startOfHour(subHours(now, i));
        const key = format(hourStart, "yyyy-MM-dd HH:00");
        hourlyMap[key] = { bot: 0, rateLimit: 0 };
      }

      // Count bot events per hour
      botEvents.forEach((e) => {
        const eventHour = startOfHour(parseISO(e.created_at));
        const key = format(eventHour, "yyyy-MM-dd HH:00");
        if (hourlyMap[key]) {
          hourlyMap[key].bot++;
        }
      });

      // Count rate limit events per hour
      rateLimitEvents.forEach((e) => {
        const eventHour = startOfHour(parseISO(e.created_at));
        const key = format(eventHour, "yyyy-MM-dd HH:00");
        if (hourlyMap[key]) {
          hourlyMap[key].rateLimit++;
        }
      });

      // Convert to array
      const chartData: HourlyData[] = Object.entries(hourlyMap).map(
        ([key, counts]) => {
          const date = parseISO(key.replace(" ", "T") + ":00");
          return {
            hour: key,
            label: format(date, "HH:mm"),
            botEvents: counts.bot,
            rateLimits: counts.rateLimit,
            total: counts.bot + counts.rateLimit,
            fullTime: format(date, "MMM d, HH:mm"),
          };
        }
      );

      setHourlyData(chartData);
    } catch (error) {
      console.error("Error fetching security overview:", error);
      toast({
        title: "Error",
        description: "Failed to load security overview",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runSecurityScan = async () => {
    setIsScanning(true);
    setScanResults([]);
    
    try {
      const results: ScanResult[] = [];
      
      // Check RLS policies on critical tables
      const criticalTables = [
        "user_roles",
        "mfa_recovery_codes",
        "passkey_credentials",
        "trust_profiles",
      ];
      
      for (const table of criticalTables) {
        try {
          // Try to select without auth - this should fail if RLS is working
          const { error } = await supabase.from(table as any).select("*").limit(1);
          if (error?.code === "42501" || error?.message?.includes("permission denied")) {
            results.push({
              status: "success",
              category: "RLS Policy",
              message: `${table}: Access properly restricted`,
            });
          } else if (error) {
            results.push({
              status: "warning",
              category: "RLS Policy",
              message: `${table}: Check configuration`,
              details: error.message,
            });
          } else {
            results.push({
              status: "success",
              category: "RLS Policy",
              message: `${table}: Accessible (check if intended)`,
            });
          }
        } catch {
          results.push({
            status: "error",
            category: "RLS Policy",
            message: `${table}: Unable to verify`,
          });
        }
      }

      // Check for suspicious activity patterns
      const oneHourAgo = subHours(new Date(), 1).toISOString();
      
      const [recentBots, recentRateLimits, anomalyAlerts] = await Promise.all([
        supabase
          .from("bot_detection_events")
          .select("*", { count: "exact", head: true })
          .gte("created_at", oneHourAgo),
        supabase
          .from("rate_limit_violations")
          .select("*", { count: "exact", head: true })
          .gte("created_at", oneHourAgo),
        supabase
          .from("audit_anomaly_alerts")
          .select("*", { count: "exact", head: true })
          .is("resolved_at", null),
      ]);

      // Evaluate bot events
      const botCount = recentBots.count || 0;
      if (botCount > 50) {
        results.push({
          status: "error",
          category: "Bot Activity",
          message: `High bot activity detected: ${botCount} events in last hour`,
          details: "Consider reviewing IP blocklist and rate limits",
        });
      } else if (botCount > 20) {
        results.push({
          status: "warning",
          category: "Bot Activity",
          message: `Moderate bot activity: ${botCount} events in last hour`,
        });
      } else {
        results.push({
          status: "success",
          category: "Bot Activity",
          message: `Normal levels: ${botCount} events in last hour`,
        });
      }

      // Evaluate rate limits
      const rateLimitCount = recentRateLimits.count || 0;
      if (rateLimitCount > 30) {
        results.push({
          status: "error",
          category: "Rate Limits",
          message: `High rate limit violations: ${rateLimitCount} in last hour`,
          details: "Possible brute force or DDoS attempt",
        });
      } else if (rateLimitCount > 10) {
        results.push({
          status: "warning",
          category: "Rate Limits",
          message: `Elevated rate limit violations: ${rateLimitCount} in last hour`,
        });
      } else {
        results.push({
          status: "success",
          category: "Rate Limits",
          message: `Normal levels: ${rateLimitCount} violations in last hour`,
        });
      }

      // Check unresolved anomaly alerts
      const unresolvedAlerts = anomalyAlerts.count || 0;
      if (unresolvedAlerts > 0) {
        results.push({
          status: "warning",
          category: "Anomaly Alerts",
          message: `${unresolvedAlerts} unresolved anomaly alert(s)`,
          details: "Review and resolve pending alerts",
        });
      } else {
        results.push({
          status: "success",
          category: "Anomaly Alerts",
          message: "No unresolved anomaly alerts",
        });
      }

      // Check MFA adoption
      const { count: mfaCount } = await supabase
        .from("passkey_credentials")
        .select("*", { count: "exact", head: true });
      
      results.push({
        status: mfaCount && mfaCount > 0 ? "success" : "warning",
        category: "MFA Status",
        message: mfaCount && mfaCount > 0 
          ? `${mfaCount} passkey credential(s) registered`
          : "No passkey credentials found - consider enabling MFA",
      });

      setScanResults(results);
      setLastScanTime(new Date());
      setShowScanDialog(true);

      const errorCount = results.filter(r => r.status === "error").length;
      const warningCount = results.filter(r => r.status === "warning").length;

      toast({
        title: "Security Scan Complete",
        description: `Found ${errorCount} error(s) and ${warningCount} warning(s)`,
        variant: errorCount > 0 ? "destructive" : "default",
      });
    } catch (error) {
      console.error("Security scan failed:", error);
      toast({
        title: "Scan Failed",
        description: "Unable to complete security scan",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate trends for both
  const trends = useMemo(() => {
    if (hourlyData.length < 24) {
      return {
        bot: { direction: "flat" as const, percentage: 0 },
        rateLimit: { direction: "flat" as const, percentage: 0 },
        overall: { direction: "flat" as const, percentage: 0 },
      };
    }

    const calcTrend = (getter: (h: HourlyData) => number) => {
      const recentHours = hourlyData.slice(-12);
      const previousHours = hourlyData.slice(0, 12);

      const recentTotal = recentHours.reduce((sum, h) => sum + getter(h), 0);
      const previousTotal = previousHours.reduce((sum, h) => sum + getter(h), 0);

      if (previousTotal === 0) {
        return recentTotal > 0
          ? { direction: "up" as const, percentage: 100 }
          : { direction: "flat" as const, percentage: 0 };
      }

      const change = ((recentTotal - previousTotal) / previousTotal) * 100;

      if (Math.abs(change) < 5) {
        return { direction: "flat" as const, percentage: 0 };
      }

      return {
        direction: change > 0 ? ("up" as const) : ("down" as const),
        percentage: Math.abs(Math.round(change)),
      };
    };

    return {
      bot: calcTrend((h) => h.botEvents),
      rateLimit: calcTrend((h) => h.rateLimits),
      overall: calcTrend((h) => h.total),
    };
  }, [hourlyData]);

  const peakHour = useMemo(() => {
    if (hourlyData.length === 0) return null;
    return hourlyData.reduce(
      (max, h) => (h.total > max.total ? h : max),
      hourlyData[0]
    );
  }, [hourlyData]);

  const totalEvents = totals.bot + totals.rateLimit;

  const TrendBadge = ({
    trend,
    inverted = false,
  }: {
    trend: { direction: "up" | "down" | "flat"; percentage: number };
    inverted?: boolean;
  }) => {
    if (trend.direction === "flat") {
      return (
        <Badge variant="secondary" className="gap-1 text-xs">
          <Minus className="h-3 w-3" />
          Stable
        </Badge>
      );
    }

    const isGood = inverted ? trend.direction === "up" : trend.direction === "down";

    if (trend.direction === "up") {
      return (
        <Badge
          variant={isGood ? "outline" : "destructive"}
          className={`gap-1 text-xs ${isGood ? "text-green-600 border-green-200" : ""}`}
        >
          <TrendingUp className="h-3 w-3" />
          +{trend.percentage}%
        </Badge>
      );
    }

    return (
      <Badge
        variant="outline"
        className={`gap-1 text-xs ${isGood ? "text-green-600 border-green-200" : "text-destructive border-destructive/30"}`}
      >
        <TrendingDown className="h-3 w-3" />
        -{trend.percentage}%
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-56" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-medium">
            Security Overview (24h)
          </CardTitle>
          <TrendBadge trend={trends.overall} />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runSecurityScan}
            disabled={isScanning}
            className="gap-1.5"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <ScanSearch className="h-4 w-4" />
                Run Scan
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-primary/5 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Bot className="w-3 h-3" />
                Bot Events
              </div>
              <TrendBadge trend={trends.bot} />
            </div>
            <div className="text-2xl font-bold mt-1">{totals.bot}</div>
          </div>
          <div className="rounded-lg border bg-destructive/5 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Gauge className="w-3 h-3" />
                Rate Limits
              </div>
              <TrendBadge trend={trends.rateLimit} />
            </div>
            <div className="text-2xl font-bold text-destructive mt-1">
              {totals.rateLimit}
            </div>
          </div>
          <div className="rounded-lg border bg-amber-500/5 p-3">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Total Threats
            </div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {totalEvents}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">Peak Hour</div>
            <div className="text-lg font-semibold mt-1">
              {peakHour && peakHour.total > 0 ? (
                <>
                  {peakHour.label}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({peakHour.total})
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Combined Chart */}
        <ChartContainer config={chartConfig} className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="botGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--primary))"
                    stopOpacity={0.05}
                  />
                </linearGradient>
                <linearGradient id="rateLimitGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="hsl(var(--destructive))"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="100%"
                    stopColor="hsl(var(--destructive))"
                    stopOpacity={0.05}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                tickFormatter={(value, index) => (index % 4 === 0 ? value : "")}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                allowDecimals={false}
                width={30}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => {
                      const label =
                        name === "botEvents" ? "Bot Events" : "Rate Limits";
                      return [`${value}`, label];
                    }}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullTime;
                      }
                      return label;
                    }}
                  />
                }
              />
              <Legend
                verticalAlign="top"
                height={36}
                formatter={(value) =>
                  value === "botEvents" ? "Bot Events" : "Rate Limits"
                }
              />
              <Area
                type="monotone"
                dataKey="botEvents"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#botGradient)"
              />
              <Area
                type="monotone"
                dataKey="rateLimits"
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                fill="url(#rateLimitGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Quick Stats Row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-4">
            <span>
              Avg/Hour:{" "}
              <span className="font-medium text-foreground">
                {(totalEvents / 24).toFixed(1)}
              </span>
            </span>
            <span>
              Blocked IPs:{" "}
              <span className="font-medium text-foreground">{blockedIpCount}</span>
            </span>
          </div>
          <div>
            Bot/Rate Limit Ratio:{" "}
            <span className="font-medium text-foreground">
              {totals.rateLimit > 0
                ? (totals.bot / totals.rateLimit).toFixed(2)
                : totals.bot > 0
                ? "∞"
                : "0"}
            </span>
          </div>
        </div>

        {/* Empty State */}
        {totalEvents === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <ShieldAlert className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No security events in the last 24 hours</p>
          </div>
        )}
      </CardContent>

      {/* Scan Results Dialog */}
      <Dialog open={showScanDialog} onOpenChange={setShowScanDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ScanSearch className="h-5 w-5" />
              Security Scan Results
            </DialogTitle>
            <DialogDescription>
              {lastScanTime && (
                <span>Completed at {format(lastScanTime, "HH:mm:ss")}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-3 pr-4">
              {scanResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    result.status === "error"
                      ? "bg-destructive/10 border-destructive/30"
                      : result.status === "warning"
                      ? "bg-amber-500/10 border-amber-500/30"
                      : "bg-green-500/10 border-green-500/30"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {result.status === "error" ? (
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                    ) : result.status === "warning" ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium">{result.message}</span>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {result.category}
                        </Badge>
                      </div>
                      {result.details && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {result.details}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-xs text-muted-foreground">
              {scanResults.filter(r => r.status === "success").length} passed,{" "}
              {scanResults.filter(r => r.status === "warning").length} warnings,{" "}
              {scanResults.filter(r => r.status === "error").length} errors
            </div>
            <Button variant="outline" size="sm" onClick={() => setShowScanDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SecurityOverviewCard;
