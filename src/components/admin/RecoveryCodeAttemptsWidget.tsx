import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { KeyRound, RefreshCw, ChevronDown, Download, Clock, AlertTriangle, CheckCircle, RotateCcw, Search, X, Calendar, ShieldAlert, Eye, Bell, BellOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfDay, parseISO, differenceInMinutes, differenceInHours } from "date-fns";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecoveryCodeAttempt {
  id: string;
  user_id: string;
  success: boolean;
  attempted_at: string;
}

interface TrendData {
  date: string;
  label: string;
  successful: number;
  failed: number;
}

interface UserAttemptsSummary {
  user_id: string;
  total: number;
  failed: number;
  successful: number;
  latest: string;
  isRateLimited: boolean;
  lockoutReason?: string;
  attempts: RecoveryCodeAttempt[];
}

type DateRangeOption = "7d" | "14d" | "30d" | "90d";

const DATE_RANGE_OPTIONS: { value: DateRangeOption; label: string; days: number }[] = [
  { value: "7d", label: "Last 7 days", days: 7 },
  { value: "14d", label: "Last 14 days", days: 14 },
  { value: "30d", label: "Last 30 days", days: 30 },
  { value: "90d", label: "Last 90 days", days: 90 },
];

const chartConfig: ChartConfig = {
  successful: {
    label: "Successful",
    color: "hsl(var(--primary))",
  },
  failed: {
    label: "Failed",
    color: "hsl(var(--destructive))",
  },
};

const RecoveryCodeAttemptsWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState<RecoveryCodeAttempt[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [userSummary, setUserSummary] = useState<UserAttemptsSummary[]>([]);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRangeOption>("7d");
  const [selectedUserForDrilldown, setSelectedUserForDrilldown] = useState<UserAttemptsSummary | null>(null);
  const [alertsDismissed, setAlertsDismissed] = useState(false);
  const { toast } = useToast();

  const selectedRangeConfig = DATE_RANGE_OPTIONS.find((o) => o.value === dateRange)!;

  const fetchAttempts = async () => {
    setIsLoading(true);
    try {
      // Fetch attempts based on selected date range
      const startDate = subDays(new Date(), selectedRangeConfig.days).toISOString();

      const { data, error } = await supabase
        .from("recovery_code_attempts")
        .select("*")
        .gte("attempted_at", startDate)
        .order("attempted_at", { ascending: false });

      if (error) throw error;

      const attemptsData = (data || []) as RecoveryCodeAttempt[];
      setAttempts(attemptsData);

      // Build trend data for the selected range
      // For longer ranges, group by week or show fewer data points
      const trends: TrendData[] = [];
      const days = selectedRangeConfig.days;
      
      // Determine grouping: daily for ≤14 days, otherwise show key dates
      const dataPoints = days <= 14 ? days : days <= 30 ? 15 : 18;
      const step = Math.ceil(days / dataPoints);
      
      for (let i = days - 1; i >= 0; i -= step) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayStart = startOfDay(date);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + step);

        const periodAttempts = attemptsData.filter((a) => {
          const aDate = parseISO(a.attempted_at);
          return aDate >= dayStart && aDate < dayEnd;
        });

        trends.push({
          date: dateStr,
          label: days <= 14 ? format(date, "EEE") : format(date, "MMM d"),
          successful: periodAttempts.filter((a) => a.success).length,
          failed: periodAttempts.filter((a) => !a.success).length,
        });
      }
      setTrendData(trends);

      // Build user summary - find users with high failure rates and rate-limited users
      const userCounts: Record<string, UserAttemptsSummary> = {};
      const now = new Date();
      
      attemptsData.forEach((a) => {
        if (!userCounts[a.user_id]) {
          userCounts[a.user_id] = {
            user_id: a.user_id,
            total: 0,
            failed: 0,
            successful: 0,
            latest: a.attempted_at,
            isRateLimited: false,
            attempts: [],
          };
        }
        userCounts[a.user_id].total++;
        userCounts[a.user_id].attempts.push(a);
        if (a.success) {
          userCounts[a.user_id].successful++;
        } else {
          userCounts[a.user_id].failed++;
        }
        if (a.attempted_at > userCounts[a.user_id].latest) {
          userCounts[a.user_id].latest = a.attempted_at;
        }
      });

      // Check rate limit status for each user
      Object.values(userCounts).forEach((user) => {
        // Get attempts in last 15 minutes
        const attemptsIn15Min = user.attempts.filter((a) => {
          const attemptTime = parseISO(a.attempted_at);
          return differenceInMinutes(now, attemptTime) <= 15;
        });
        
        // Get failed attempts in last hour
        const failedIn1Hr = user.attempts.filter((a) => {
          const attemptTime = parseISO(a.attempted_at);
          return !a.success && differenceInHours(now, attemptTime) <= 1;
        });

        if (failedIn1Hr.length >= 10) {
          user.isRateLimited = true;
          user.lockoutReason = `${failedIn1Hr.length} failed attempts in last hour (lockout threshold: 10)`;
        } else if (attemptsIn15Min.length >= 5) {
          user.isRateLimited = true;
          user.lockoutReason = `${attemptsIn15Min.length} attempts in last 15 minutes (rate limit: 5)`;
        }
      });

      // Sort by rate-limited first, then by failed attempts
      const summary = Object.values(userCounts).sort((a, b) => {
        if (a.isRateLimited && !b.isRateLimited) return -1;
        if (!a.isRateLimited && b.isRateLimited) return 1;
        return b.failed - a.failed;
      });
      setUserSummary(summary);
    } catch (error) {
      console.error("Error fetching recovery code attempts:", error);
      toast({
        title: "Error",
        description: "Failed to load recovery code attempts",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("recovery-code-attempts-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "recovery_code_attempts",
        },
        () => {
          // Refresh data when new attempt is logged
          fetchAttempts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dateRange]);

  // Refetch when date range changes
  useEffect(() => {
    if (isOpen) {
      fetchAttempts();
    }
  }, [isOpen, dateRange]);

  const handleExportCSV = () => {
    if (attempts.length === 0) {
      toast({
        title: "No Data",
        description: "No attempts to export",
        variant: "default",
      });
      return;
    }

    const headers = ["Timestamp", "User ID", "Success"];
    const rows = attempts.map((a) => [
      format(parseISO(a.attempted_at), "yyyy-MM-dd HH:mm:ss"),
      a.user_id,
      a.success ? "Yes" : "No",
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    
    // Include date range in filename
    const startDate = format(subDays(new Date(), selectedRangeConfig.days), "yyyy-MM-dd");
    const endDate = format(new Date(), "yyyy-MM-dd");
    a.download = `recovery-code-attempts_${startDate}_to_${endDate}.csv`;
    
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${attempts.length} attempts (${selectedRangeConfig.label})`,
    });
  };

  const handleResetUserAttempts = async (userId: string) => {
    setResettingUserId(userId);
    try {
      const { data, error } = await supabase.rpc("reset_recovery_code_attempts", {
        p_user_id: userId,
      });

      if (error) throw error;

      toast({
        title: "Attempts Reset",
        description: `Cleared ${data} recovery code attempt(s) for user`,
      });

      // Refresh data
      await fetchAttempts();
    } catch (error: any) {
      console.error("Error resetting attempts:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset attempts",
        variant: "destructive",
      });
    } finally {
      setResettingUserId(null);
    }
  };

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const todayAttempts = attempts.filter(
      (a) => parseISO(a.attempted_at) >= today
    );

    const totalAttempts = attempts.length;
    const totalFailed = attempts.filter((a) => !a.success).length;
    const totalSuccessful = attempts.filter((a) => a.success).length;
    const todayFailed = todayAttempts.filter((a) => !a.success).length;
    const uniqueUsers = new Set(attempts.map((a) => a.user_id)).size;

    // Users with high failure rates (potential abuse)
    const suspiciousUsers = userSummary.filter(
      (u) => u.failed >= 3 && u.failed > u.successful
    ).length;
    
    // Users currently rate-limited
    const rateLimitedUsers = userSummary.filter((u) => u.isRateLimited).length;

    return {
      totalAttempts,
      totalFailed,
      totalSuccessful,
      todayFailed,
      uniqueUsers,
      suspiciousUsers,
      rateLimitedUsers,
    };
  }, [attempts, userSummary]);

  const hasTrendData = trendData.some((d) => d.successful > 0 || d.failed > 0);

  // Filter data based on search query
  const filteredAttempts = useMemo(() => {
    if (!searchQuery.trim()) return attempts;
    const query = searchQuery.toLowerCase();
    return attempts.filter((a) => a.user_id.toLowerCase().includes(query));
  }, [attempts, searchQuery]);

  const filteredUserSummary = useMemo(() => {
    if (!searchQuery.trim()) return userSummary;
    const query = searchQuery.toLowerCase();
    return userSummary.filter((u) => u.user_id.toLowerCase().includes(query));
  }, [userSummary, searchQuery]);

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <KeyRound className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-lg">Recovery Code Attempts</CardTitle>
                {stats.totalFailed > 0 && (
                  <Badge 
                    variant={stats.suspiciousUsers > 0 ? "destructive" : "secondary"}
                    className="gap-1"
                  >
                    {stats.suspiciousUsers > 0 && (
                      <AlertTriangle className="h-3 w-3" />
                    )}
                    {stats.totalFailed} failed ({dateRange})
                  </Badge>
                )}
              </div>
              <ChevronDown
                className={`h-5 w-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {isLoading ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
                <Skeleton className="h-48" />
              </div>
            ) : (
              <>
                {/* Actions and Search */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by user ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-9"
                    />
                    {searchQuery && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6"
                        onClick={() => setSearchQuery("")}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeOption)}>
                      <SelectTrigger className="w-[140px] h-9">
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATE_RANGE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={fetchAttempts}
                      disabled={isLoading}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      disabled={attempts.length === 0}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </div>

                {/* Rate Limit Alert Banner */}
                {stats.rateLimitedUsers > 0 && !alertsDismissed && (
                  <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle className="flex items-center justify-between">
                      <span>Active Rate Limit Violations</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 -mr-2"
                        onClick={() => setAlertsDismissed(true)}
                      >
                        <BellOff className="h-3 w-3" />
                      </Button>
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <span className="font-semibold">{stats.rateLimitedUsers} user{stats.rateLimitedUsers !== 1 ? "s" : ""}</span>{" "}
                      {stats.rateLimitedUsers === 1 ? "is" : "are"} currently locked out due to repeated failed recovery code attempts. 
                      This may indicate credential stuffing or brute force attempts.
                      <div className="flex gap-2 mt-3">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="bg-background"
                          onClick={() => {
                            const lockedUser = userSummary.find((u) => u.isRateLimited);
                            if (lockedUser) setSelectedUserForDrilldown(lockedUser);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Total Attempts ({dateRange})</div>
                      <div className="text-2xl font-bold">{stats.totalAttempts}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Failed Today</div>
                      <div className={`text-2xl font-bold ${stats.todayFailed > 0 ? "text-destructive" : ""}`}>
                        {stats.todayFailed}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Unique Users</div>
                      <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        Suspicious
                        {stats.suspiciousUsers > 0 && (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        )}
                      </div>
                      <div className={`text-2xl font-bold ${stats.suspiciousUsers > 0 ? "text-amber-600" : ""}`}>
                        {stats.suspiciousUsers}
                      </div>
                    </CardContent>
                  </Card>
                  <Card className={stats.rateLimitedUsers > 0 ? "border-destructive/50 bg-destructive/5" : ""}>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        Rate Limited
                        {stats.rateLimitedUsers > 0 && (
                          <ShieldAlert className="h-3 w-3 text-destructive" />
                        )}
                      </div>
                      <div className={`text-2xl font-bold ${stats.rateLimitedUsers > 0 ? "text-destructive" : ""}`}>
                        {stats.rateLimitedUsers}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Trend Chart */}
                {hasTrendData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Attempts Trend ({selectedRangeConfig.label})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ChartContainer config={chartConfig} className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={trendData}>
                            <XAxis
                              dataKey="label"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12 }}
                            />
                            <YAxis
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 12 }}
                              allowDecimals={false}
                            />
                            <ChartTooltip content={<ChartTooltipContent />} />
                            <Bar
                              dataKey="successful"
                              fill="hsl(var(--primary))"
                              radius={[4, 4, 0, 0]}
                              stackId="stack"
                            />
                            <Bar
                              dataKey="failed"
                              fill="hsl(var(--destructive))"
                              radius={[4, 4, 0, 0]}
                              stackId="stack"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-primary" />
                          <span className="text-muted-foreground">Successful</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded bg-destructive" />
                          <span className="text-muted-foreground">Failed</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Users with High Failure Rates or Rate Limited */}
                {(filteredUserSummary.filter((u) => u.failed >= 2 || u.isRateLimited).length > 0 || searchQuery) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        Users with Failed Attempts or Rate Limits
                        {searchQuery && (
                          <Badge variant="secondary" className="ml-2">
                            {filteredUserSummary.filter((u) => u.failed >= 2 || u.isRateLimited).length} results
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {filteredUserSummary.filter((u) => u.failed >= 2 || u.isRateLimited).length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p>No users found matching "{searchQuery}"</p>
                        </div>
                      ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {filteredUserSummary
                          .filter((u) => u.failed >= 2 || u.isRateLimited)
                          .slice(0, 12)
                          .map((user) => (
                            <div
                              key={user.user_id}
                              className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                                user.isRateLimited
                                  ? "bg-destructive/10 border-destructive/50"
                                  : user.failed >= 3 && user.failed > user.successful
                                  ? "bg-destructive/5 border-destructive/30"
                                  : "bg-muted/30"
                              }`}
                              onClick={() => setSelectedUserForDrilldown(user)}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-mono text-xs text-muted-foreground truncate max-w-[120px]">
                                    {user.user_id.slice(0, 8)}...
                                  </div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                    <Clock className="h-3 w-3" />
                                    {format(parseISO(user.latest), "MMM d, HH:mm")}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Badge variant="outline" className="gap-1">
                                    <CheckCircle className="h-3 w-3 text-primary" />
                                    {user.successful}
                                  </Badge>
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    {user.failed}
                                  </Badge>
                                </div>
                              </div>
                              {user.isRateLimited && (
                                <div className="mt-2 pt-2 border-t border-destructive/30">
                                  <Badge variant="destructive" className="gap-1 text-xs">
                                    <ShieldAlert className="h-3 w-3" />
                                    Locked Out
                                  </Badge>
                                  <p className="text-xs text-destructive mt-1">{user.lockoutReason}</p>
                                </div>
                              )}
                              <div className="flex items-center justify-between mt-2 pt-2 border-t">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedUserForDrilldown(user);
                                  }}
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  Audit Log
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 text-xs"
                                      disabled={resettingUserId === user.user_id}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <RotateCcw className={`h-3 w-3 mr-1 ${resettingUserId === user.user_id ? "animate-spin" : ""}`} />
                                      Reset
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Reset Recovery Code Attempts</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will clear all recovery code attempts for user{" "}
                                        <code className="bg-muted px-1 rounded">{user.user_id.slice(0, 8)}...</code>
                                        , removing any lockout and allowing them to try again.
                                        This action is logged in the audit trail.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleResetUserAttempts(user.user_id)}
                                      >
                                        Reset Attempts
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          ))}
                      </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Recent Attempts Table */}
                {filteredAttempts.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        Recent Attempts {searchQuery ? "" : "(Last 10)"}
                        {searchQuery && (
                          <Badge variant="secondary">
                            {filteredAttempts.length} results
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>User ID</TableHead>
                            <TableHead className="text-right">Result</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredAttempts.slice(0, searchQuery ? 20 : 10).map((attempt) => (
                            <TableRow key={attempt.id}>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(
                                  parseISO(attempt.attempted_at),
                                  "MMM d, HH:mm:ss"
                                )}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {attempt.user_id.slice(0, 8)}...
                              </TableCell>
                              <TableCell className="text-right">
                                {attempt.success ? (
                                  <Badge
                                    variant="outline"
                                    className="gap-1 text-primary border-primary/30"
                                  >
                                    <CheckCircle className="h-3 w-3" />
                                    Success
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Failed
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Empty State */}
                {attempts.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <KeyRound className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Attempts Recorded</p>
                    <p className="text-sm">
                      No recovery code verification attempts in the {selectedRangeConfig.label.toLowerCase()}.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>

      {/* User Drill-down Dialog */}
      <Dialog open={!!selectedUserForDrilldown} onOpenChange={(open) => !open && setSelectedUserForDrilldown(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Recovery Code Attempt Audit Log
            </DialogTitle>
            <DialogDescription>
              Detailed timeline of recovery code attempts for user{" "}
              <code className="bg-muted px-1 rounded font-mono text-xs">
                {selectedUserForDrilldown?.user_id}
              </code>
            </DialogDescription>
          </DialogHeader>

          {selectedUserForDrilldown && (
            <div className="space-y-4">
              {/* User Summary */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-sm font-medium">Total Attempts</div>
                    <div className="text-2xl font-bold">{selectedUserForDrilldown.total}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-primary">Successful</div>
                    <div className="text-2xl font-bold text-primary">{selectedUserForDrilldown.successful}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-destructive">Failed</div>
                    <div className="text-2xl font-bold text-destructive">{selectedUserForDrilldown.failed}</div>
                  </div>
                </div>
                {selectedUserForDrilldown.isRateLimited && (
                  <Badge variant="destructive" className="gap-1">
                    <ShieldAlert className="h-3 w-3" />
                    Currently Locked Out
                  </Badge>
                )}
              </div>

              {/* Lockout Reason */}
              {selectedUserForDrilldown.isRateLimited && selectedUserForDrilldown.lockoutReason && (
                <Alert variant="destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <AlertTitle>Rate Limit Violation</AlertTitle>
                  <AlertDescription>{selectedUserForDrilldown.lockoutReason}</AlertDescription>
                </Alert>
              )}

              {/* Attempt Timeline */}
              <div>
                <h4 className="text-sm font-medium mb-3">Attempt Timeline</h4>
                <ScrollArea className="h-[300px] rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">Timestamp</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead className="text-right">Time Since Previous</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedUserForDrilldown.attempts
                        .sort((a, b) => new Date(b.attempted_at).getTime() - new Date(a.attempted_at).getTime())
                        .map((attempt, index, arr) => {
                          const prevAttempt = arr[index + 1];
                          const timeSincePrev = prevAttempt
                            ? differenceInMinutes(parseISO(attempt.attempted_at), parseISO(prevAttempt.attempted_at))
                            : null;

                          return (
                            <TableRow key={attempt.id}>
                              <TableCell className="font-mono text-xs">
                                {format(parseISO(attempt.attempted_at), "yyyy-MM-dd HH:mm:ss")}
                              </TableCell>
                              <TableCell>
                                {attempt.success ? (
                                  <Badge variant="outline" className="gap-1 text-primary border-primary/30">
                                    <CheckCircle className="h-3 w-3" />
                                    Success
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive" className="gap-1">
                                    <AlertTriangle className="h-3 w-3" />
                                    Failed
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-sm text-muted-foreground">
                                {timeSincePrev !== null ? (
                                  timeSincePrev < 1 ? (
                                    <span className="text-destructive font-medium">&lt; 1 min</span>
                                  ) : timeSincePrev < 5 ? (
                                    <span className="text-amber-600">{timeSincePrev} min</span>
                                  ) : (
                                    `${timeSincePrev} min`
                                  )
                                ) : (
                                  "—"
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-4 border-t">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" disabled={resettingUserId === selectedUserForDrilldown.user_id}>
                      {resettingUserId === selectedUserForDrilldown.user_id ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RotateCcw className="h-4 w-4 mr-2" />
                      )}
                      Reset Attempts
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reset Recovery Code Attempts</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will clear all recovery code attempts for this user, removing any lockout and allowing them to try again.
                        This action is logged in the audit trail.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={async () => {
                          await handleResetUserAttempts(selectedUserForDrilldown.user_id);
                          setSelectedUserForDrilldown(null);
                        }}
                      >
                        Reset Attempts
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button variant="default" onClick={() => setSelectedUserForDrilldown(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default RecoveryCodeAttemptsWidget;
