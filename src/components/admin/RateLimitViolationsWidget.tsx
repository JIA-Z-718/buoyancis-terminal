import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ShieldAlert, RefreshCw, ChevronDown, Download, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfDay, parseISO } from "date-fns";

interface RateLimitViolation {
  id: string;
  function_name: string;
  ip_address: string;
  request_count: number;
  max_requests: number;
  created_at: string;
}

interface TrendData {
  date: string;
  label: string;
  violations: number;
}

interface FunctionSummary {
  function_name: string;
  count: number;
  latest: string;
}

const chartConfig: ChartConfig = {
  violations: {
    label: "Violations",
    color: "hsl(var(--destructive))",
  },
};

const RateLimitViolationsWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [violations, setViolations] = useState<RateLimitViolation[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [functionSummary, setFunctionSummary] = useState<FunctionSummary[]>([]);
  const [totalViolations, setTotalViolations] = useState(0);
  const { toast } = useToast();

  const fetchViolations = async () => {
    setIsLoading(true);
    try {
      // Fetch last 7 days of violations
      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      
      const { data, error } = await supabase
        .from("rate_limit_violations")
        .select("*")
        .gte("created_at", sevenDaysAgo)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const violationsData = data || [];
      setViolations(violationsData);
      setTotalViolations(violationsData.length);

      // Build trend data for last 7 days
      const trends: TrendData[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, "yyyy-MM-dd");
        const dayStart = startOfDay(date);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const count = violationsData.filter((v) => {
          const vDate = parseISO(v.created_at);
          return vDate >= dayStart && vDate < dayEnd;
        }).length;

        trends.push({
          date: dateStr,
          label: format(date, "EEE"),
          violations: count,
        });
      }
      setTrendData(trends);

      // Build function summary
      const functionCounts: Record<string, { count: number; latest: string }> = {};
      violationsData.forEach((v) => {
        if (!functionCounts[v.function_name]) {
          functionCounts[v.function_name] = { count: 0, latest: v.created_at };
        }
        functionCounts[v.function_name].count++;
        if (v.created_at > functionCounts[v.function_name].latest) {
          functionCounts[v.function_name].latest = v.created_at;
        }
      });

      const summary = Object.entries(functionCounts)
        .map(([function_name, data]) => ({
          function_name,
          count: data.count,
          latest: data.latest,
        }))
        .sort((a, b) => b.count - a.count);

      setFunctionSummary(summary);
    } catch (error) {
      console.error("Error fetching rate limit violations:", error);
      toast({
        title: "Error",
        description: "Failed to load rate limit violations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("rate-limit-violations-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rate_limit_violations",
        },
        () => {
          // Refresh data when new violation is logged
          fetchViolations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchViolations();
    }
  }, [isOpen]);

  const handleExportCSV = () => {
    if (violations.length === 0) {
      toast({
        title: "No Data",
        description: "No violations to export",
        variant: "default",
      });
      return;
    }

    const headers = ["Timestamp", "Function", "IP Address", "Request Count", "Max Allowed"];
    const rows = violations.map((v) => [
      format(parseISO(v.created_at), "yyyy-MM-dd HH:mm:ss"),
      v.function_name,
      v.ip_address,
      v.request_count.toString(),
      v.max_requests.toString(),
    ]);

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rate-limit-violations-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${violations.length} violations`,
    });
  };

  const stats = useMemo(() => {
    const today = startOfDay(new Date());
    const todayCount = violations.filter(
      (v) => parseISO(v.created_at) >= today
    ).length;
    
    const uniqueIps = new Set(violations.map((v) => v.ip_address)).size;
    const peakDay = trendData.reduce(
      (max, day) => (day.violations > max.violations ? day : max),
      { date: "", label: "N/A", violations: 0 }
    );

    return { todayCount, uniqueIps, peakDay };
  }, [violations, trendData]);

  return (
    <Card className="mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldAlert className="h-5 w-5 text-destructive" />
                <CardTitle className="text-lg">Rate Limit Violations</CardTitle>
                {totalViolations > 0 && (
                  <Badge variant="destructive">{totalViolations} (7d)</Badge>
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
                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchViolations}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    disabled={violations.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Total (7 days)</div>
                      <div className="text-2xl font-bold">{totalViolations}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Today</div>
                      <div className="text-2xl font-bold">{stats.todayCount}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Unique IPs</div>
                      <div className="text-2xl font-bold">{stats.uniqueIps}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4">
                      <div className="text-sm text-muted-foreground">Peak Day</div>
                      <div className="text-2xl font-bold">
                        {stats.peakDay.violations > 0
                          ? `${stats.peakDay.label} (${stats.peakDay.violations})`
                          : "None"}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Trend Chart */}
                {trendData.some((d) => d.violations > 0) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Violations Trend (Last 7 Days)
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
                              dataKey="violations"
                              fill="hsl(var(--destructive))"
                              radius={[4, 4, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </CardContent>
                  </Card>
                )}

                {/* Function Summary */}
                {functionSummary.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        By Function
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {functionSummary.map((fn) => (
                          <div
                            key={fn.function_name}
                            className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                          >
                            <div>
                              <div className="font-medium text-sm">{fn.function_name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(parseISO(fn.latest), "MMM d, HH:mm")}
                              </div>
                            </div>
                            <Badge variant="destructive">{fn.count}</Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Recent Violations Table */}
                {violations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">
                        Recent Violations (Last 10)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Function</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead className="text-right">Requests</TableHead>
                            <TableHead className="text-right">Limit</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {violations.slice(0, 10).map((violation) => (
                            <TableRow key={violation.id}>
                              <TableCell className="text-sm text-muted-foreground">
                                {format(parseISO(violation.created_at), "MMM d, HH:mm:ss")}
                              </TableCell>
                              <TableCell className="font-medium">
                                {violation.function_name}
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                {violation.ip_address}
                              </TableCell>
                              <TableCell className="text-right text-destructive font-medium">
                                {violation.request_count}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {violation.max_requests}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Empty State */}
                {violations.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <ShieldAlert className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No Violations Detected</p>
                    <p className="text-sm">
                      Rate limiting is active. No blocked requests in the last 7 days.
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default RateLimitViolationsWidget;
