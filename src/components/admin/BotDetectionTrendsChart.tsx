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
} from "recharts";
import { RefreshCw, TrendingUp, TrendingDown, Minus, Bot } from "lucide-react";
import { format, subHours, startOfHour, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface BotEvent {
  id: string;
  event_type: string;
  created_at: string;
}

interface HourlyData {
  hour: string;
  label: string;
  events: number;
  fullTime: string;
}

const chartConfig: ChartConfig = {
  events: {
    label: "Events",
    color: "hsl(var(--primary))",
  },
};

const BotDetectionTrendsChart = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [eventsByType, setEventsByType] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const fetchTrendData = async () => {
    setIsLoading(true);
    try {
      const twentyFourHoursAgo = subHours(new Date(), 24).toISOString();

      const { data, error } = await supabase
        .from("bot_detection_events")
        .select("id, event_type, created_at")
        .gte("created_at", twentyFourHoursAgo)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const events = data || [];
      setTotalEvents(events.length);

      // Count by type
      const typeCounts: Record<string, number> = {};
      events.forEach((e) => {
        typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
      });
      setEventsByType(typeCounts);

      // Build hourly data for last 24 hours
      const hourlyMap: Record<string, number> = {};
      const now = new Date();

      // Initialize all 24 hours with 0
      for (let i = 23; i >= 0; i--) {
        const hourStart = startOfHour(subHours(now, i));
        const key = format(hourStart, "yyyy-MM-dd HH:00");
        hourlyMap[key] = 0;
      }

      // Count events per hour
      events.forEach((e) => {
        const eventHour = startOfHour(parseISO(e.created_at));
        const key = format(eventHour, "yyyy-MM-dd HH:00");
        if (hourlyMap.hasOwnProperty(key)) {
          hourlyMap[key]++;
        }
      });

      // Convert to array
      const chartData: HourlyData[] = Object.entries(hourlyMap).map(
        ([key, count]) => {
          const date = parseISO(key.replace(" ", "T") + ":00");
          return {
            hour: key,
            label: format(date, "HH:mm"),
            events: count,
            fullTime: format(date, "MMM d, HH:mm"),
          };
        }
      );

      setHourlyData(chartData);
    } catch (error) {
      console.error("Error fetching bot detection trends:", error);
      toast({
        title: "Error",
        description: "Failed to load bot detection trends",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrendData();
  }, []);

  // Calculate trend (compare last 12 hours vs previous 12 hours)
  const trend = useMemo(() => {
    if (hourlyData.length < 24) return { direction: "flat" as const, percentage: 0 };

    const recentHours = hourlyData.slice(-12);
    const previousHours = hourlyData.slice(0, 12);

    const recentTotal = recentHours.reduce((sum, h) => sum + h.events, 0);
    const previousTotal = previousHours.reduce((sum, h) => sum + h.events, 0);

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
  }, [hourlyData]);

  const peakHour = useMemo(() => {
    if (hourlyData.length === 0) return null;
    return hourlyData.reduce((max, h) => (h.events > max.events ? h : max), hourlyData[0]);
  }, [hourlyData]);

  const topEventTypes = useMemo(() => {
    return Object.entries(eventsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [eventsByType]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-48" />
          <div className="grid grid-cols-3 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-medium">
            Bot Detection Trends (24h)
          </CardTitle>
          {trend.direction === "up" && (
            <Badge variant="destructive" className="gap-1">
              <TrendingUp className="h-3 w-3" />
              +{trend.percentage}%
            </Badge>
          )}
          {trend.direction === "down" && (
            <Badge variant="outline" className="gap-1 text-green-600 border-green-200">
              <TrendingDown className="h-3 w-3" />
              -{trend.percentage}%
            </Badge>
          )}
          {trend.direction === "flat" && (
            <Badge variant="secondary" className="gap-1">
              <Minus className="h-3 w-3" />
              Stable
            </Badge>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchTrendData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Chart */}
        <ChartContainer config={chartConfig} className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="eventGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                tickFormatter={(value, index) => {
                  // Show every 4th label for readability
                  return index % 4 === 0 ? value : "";
                }}
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
                    formatter={(value, name) => [`${value} events`, ""]}
                    labelFormatter={(label, payload) => {
                      if (payload && payload[0]) {
                        return payload[0].payload.fullTime;
                      }
                      return label;
                    }}
                  />
                }
              />
              <Area
                type="monotone"
                dataKey="events"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#eventGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">Total Events</div>
            <div className="text-2xl font-bold">{totalEvents}</div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">Peak Hour</div>
            <div className="text-lg font-semibold">
              {peakHour ? (
                <>
                  {peakHour.label}
                  <span className="text-xs text-muted-foreground ml-1">
                    ({peakHour.events})
                  </span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground">Avg/Hour</div>
            <div className="text-2xl font-bold">
              {hourlyData.length > 0
                ? (totalEvents / 24).toFixed(1)
                : "0"}
            </div>
          </div>
        </div>

        {/* Top Event Types */}
        {topEventTypes.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">
              Top Event Types
            </div>
            <div className="flex flex-wrap gap-2">
              {topEventTypes.map(([type, count]) => (
                <Badge key={type} variant="outline" className="gap-1">
                  {type.replace(/_/g, " ")}
                  <span className="text-muted-foreground">({count})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {totalEvents === 0 && (
          <div className="text-center py-6 text-muted-foreground">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No bot detection events in the last 24 hours</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BotDetectionTrendsChart;
