import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Shield, 
  Bot, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Gauge, 
  Mail, 
  AtSign, 
  Globe,
  Fingerprint,
  Ban,
  TrendingUp,
  TrendingDown,
  Minus,
  GitCompare
} from "lucide-react";
import { format, subDays, subWeeks, subMonths, parseISO, startOfDay, eachDayOfInterval, startOfWeek, startOfMonth, isSameDay, isSameWeek, isSameMonth } from "date-fns";
import { useOptionalDateRange } from "@/contexts/DateRangeContext";

interface BotEvent {
  id: string;
  event_type: string;
  created_at: string;
}

interface DailyCount {
  date: string;
  label: string;
  count: number;
}

interface LayerStats {
  total: number;
  average: number;
  trend: "up" | "down" | "stable";
  percentChange: number;
}

const PROTECTION_LAYERS = [
  { 
    id: "rate_limit", 
    name: "Rate Limiting", 
    layer: 1,
    icon: Gauge, 
    color: "hsl(var(--destructive))",
    description: "Progressive throttling with exponential backoff"
  },
  { 
    id: "captcha_failure", 
    name: "CAPTCHA", 
    layer: 2,
    icon: ShieldAlert, 
    color: "hsl(var(--chart-3))",
    description: "Cloudflare Turnstile verification failures"
  },
  { 
    id: "honeypot", 
    name: "Honeypot", 
    layer: 3,
    icon: Bot, 
    color: "hsl(var(--chart-1))",
    description: "Hidden field traps for automated bots"
  },
  { 
    id: "timing", 
    name: "Timing Detection", 
    layer: 4,
    icon: Clock, 
    color: "hsl(var(--chart-2))",
    description: "Submissions faster than 2 seconds"
  },
  { 
    id: "suspicious_ua", 
    name: "User-Agent Filter", 
    layer: 5,
    icon: AlertTriangle, 
    color: "hsl(var(--chart-4))",
    description: "Known bot signatures and patterns"
  },
  { 
    id: "challenge_failure", 
    name: "JS Challenge", 
    layer: 6,
    icon: Fingerprint, 
    color: "hsl(var(--chart-5))",
    description: "Client-side hash verification"
  },
  { 
    id: "ip_blocked", 
    name: "IP Blocklist", 
    layer: 7,
    icon: Ban, 
    color: "hsl(var(--destructive))",
    description: "Manually blocked IP addresses"
  },
  { 
    id: "geo_blocked", 
    name: "Geo Restrictions", 
    layer: 8,
    icon: Globe, 
    color: "hsl(220 70% 50%)",
    description: "Country-based access controls"
  },
  { 
    id: "spam_domain", 
    name: "Email Validation", 
    layer: 9,
    icon: Mail, 
    color: "hsl(var(--chart-1))",
    description: "Disposable email domain blocking"
  },
];

export default function SecurityLayerTrends() {
  const [events, setEvents] = useState<BotEvent[]>([]);
  const [previousPeriodEvents, setPreviousPeriodEvents] = useState<BotEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [compareEnabled, setCompareEnabled] = useState(false);
  const [compareMode, setCompareMode] = useState<"week" | "month">("week");
  
  const dateRangeContext = useOptionalDateRange();
  const activeDays = dateRangeContext?.activeDays ?? 30;

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      
      // Fetch current period (based on activeDays from shared context)
      const periodStart = subDays(new Date(), activeDays).toISOString();
      
      const { data, error } = await supabase
        .from("bot_detection_events")
        .select("id, event_type, created_at")
        .gte("created_at", periodStart)
        .order("created_at", { ascending: true });

      if (!error && data) {
        setEvents(data);
      }

      // Fetch previous period for comparison (double the range)
      const doublePeriodStart = subDays(new Date(), activeDays * 2).toISOString();
      
      const { data: prevData, error: prevError } = await supabase
        .from("bot_detection_events")
        .select("id, event_type, created_at")
        .gte("created_at", doublePeriodStart)
        .lt("created_at", periodStart)
        .order("created_at", { ascending: true });

      if (!prevError && prevData) {
        setPreviousPeriodEvents(prevData);
      }

      setIsLoading(false);
    };

    fetchEvents();
  }, [activeDays]);

  const { dailyData, layerStats, combinedData } = useMemo(() => {
    const days = eachDayOfInterval({
      start: subDays(new Date(), activeDays - 1),
      end: new Date(),
    });

    // Initialize daily counts for each layer
    const layerDailyData: Record<string, DailyCount[]> = {};
    PROTECTION_LAYERS.forEach(layer => {
      layerDailyData[layer.id] = days.map(date => ({
        date: format(date, "yyyy-MM-dd"),
        label: format(date, "MMM d"),
        count: 0,
      }));
    });

    // Combined data for overview chart
    const combined: Record<string, { date: string; label: string; total: number; [key: string]: string | number }> = {};
    days.forEach(date => {
      const key = format(date, "yyyy-MM-dd");
      combined[key] = {
        date: key,
        label: format(date, "MMM d"),
        total: 0,
      };
      PROTECTION_LAYERS.forEach(layer => {
        combined[key][layer.id] = 0;
      });
    });

    // Populate counts
    events.forEach(event => {
      const eventDate = format(parseISO(event.created_at), "yyyy-MM-dd");
      const layerData = layerDailyData[event.event_type];
      if (layerData) {
        const dayData = layerData.find(d => d.date === eventDate);
        if (dayData) {
          dayData.count += 1;
        }
      }
      if (combined[eventDate]) {
        combined[eventDate].total += 1;
        if (combined[eventDate][event.event_type] !== undefined) {
          (combined[eventDate][event.event_type] as number) += 1;
        }
      }
    });

    // Calculate stats for each layer
    const stats: Record<string, LayerStats> = {};
    PROTECTION_LAYERS.forEach(layer => {
      const data = layerDailyData[layer.id];
      const total = data.reduce((sum, d) => sum + d.count, 0);
      const average = total / 30;
      
      // Compare last 7 days to previous 7 days
      const last7 = data.slice(-7).reduce((sum, d) => sum + d.count, 0);
      const prev7 = data.slice(-14, -7).reduce((sum, d) => sum + d.count, 0);
      
      let trend: "up" | "down" | "stable" = "stable";
      let percentChange = 0;
      
      if (prev7 > 0) {
        percentChange = ((last7 - prev7) / prev7) * 100;
        if (percentChange > 10) trend = "up";
        else if (percentChange < -10) trend = "down";
      } else if (last7 > 0) {
        trend = "up";
        percentChange = 100;
      }
      
      stats[layer.id] = { total, average, trend, percentChange };
    });

    return {
      dailyData: layerDailyData,
      layerStats: stats,
      combinedData: Object.values(combined),
    };
  }, [events, activeDays]);

  // Build comparison data when enabled
  const comparisonData = useMemo(() => {
    if (!compareEnabled) return null;

    const periodDays = compareMode === "week" ? 7 : 30;
    const currentPeriodStart = subDays(new Date(), periodDays - 1);
    const previousPeriodStart = compareMode === "week" 
      ? subWeeks(currentPeriodStart, 1)
      : subMonths(currentPeriodStart, 1);

    const days = eachDayOfInterval({
      start: currentPeriodStart,
      end: new Date(),
    });

    const data = days.map((date, idx) => {
      const prevDate = compareMode === "week" 
        ? subWeeks(date, 1)
        : subMonths(date, 1);

      const currentCount = events.filter(e => 
        isSameDay(parseISO(e.created_at), date)
      ).length;

      const previousCount = previousPeriodEvents.filter(e => 
        isSameDay(parseISO(e.created_at), prevDate)
      ).length;

      return {
        label: format(date, "MMM d"),
        dayLabel: format(date, "EEE"),
        current: currentCount,
        previous: previousCount,
        change: previousCount > 0 
          ? Math.round(((currentCount - previousCount) / previousCount) * 100)
          : currentCount > 0 ? 100 : 0,
      };
    });

    const currentTotal = data.reduce((sum, d) => sum + d.current, 0);
    const previousTotal = data.reduce((sum, d) => sum + d.previous, 0);
    const overallChange = previousTotal > 0 
      ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
      : currentTotal > 0 ? 100 : 0;

    return {
      data,
      currentTotal,
      previousTotal,
      overallChange,
      periodLabel: compareMode === "week" ? "Week over Week" : "Month over Month",
    };
  }, [compareEnabled, compareMode, events, previousPeriodEvents]);

  const totalEvents = events.length;
  const avgDaily = (totalEvents / activeDays).toFixed(1);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-[200px] w-full" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-[180px]" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Security Event Trends
            </CardTitle>
            <CardDescription>
              {activeDays}-day historical patterns across all protection layers
            </CardDescription>
          </div>
          <div className="flex items-center gap-6">
            {/* Compare Periods Toggle */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-muted-foreground" />
                <Label htmlFor="compare-toggle" className="text-sm font-medium cursor-pointer">
                  Compare
                </Label>
                <Switch
                  id="compare-toggle"
                  checked={compareEnabled}
                  onCheckedChange={setCompareEnabled}
                />
              </div>
              {compareEnabled && (
                <Select value={compareMode} onValueChange={(v) => setCompareMode(v as "week" | "month")}>
                  <SelectTrigger className="w-[140px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Week over Week</SelectItem>
                    <SelectItem value="month">Month over Month</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{totalEvents.toLocaleString()}</div>
              <div className="text-muted-foreground text-xs">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{avgDaily}</div>
              <div className="text-muted-foreground text-xs">Daily Avg</div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Comparison Chart */}
        {compareEnabled && comparisonData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium flex items-center gap-2">
                <GitCompare className="w-4 h-4" />
                {comparisonData.periodLabel} Comparison
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Current: {comparisonData.currentTotal}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground">Previous: {comparisonData.previousTotal}</span>
                </div>
                <Badge 
                  variant={comparisonData.overallChange > 0 ? "destructive" : comparisonData.overallChange < 0 ? "default" : "secondary"}
                  className="gap-1"
                >
                  {comparisonData.overallChange > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : comparisonData.overallChange < 0 ? (
                    <TrendingDown className="w-3 h-3" />
                  ) : (
                    <Minus className="w-3 h-3" />
                  )}
                  {comparisonData.overallChange > 0 ? "+" : ""}{comparisonData.overallChange}%
                </Badge>
              </div>
            </div>
            <ChartContainer
              config={{
                current: { label: "Current Period", color: "hsl(var(--primary))" },
                previous: { label: "Previous Period", color: "hsl(var(--muted-foreground))" },
              }}
              className="h-[200px]"
            >
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={comparisonData.data}>
                  <XAxis 
                    dataKey="label" 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 10 }} 
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <ChartTooltip 
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const current = payload.find(p => p.dataKey === "current")?.value as number;
                      const previous = payload.find(p => p.dataKey === "previous")?.value as number;
                      const change = previous > 0 
                        ? Math.round(((current - previous) / previous) * 100)
                        : current > 0 ? 100 : 0;
                      return (
                        <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
                          <p className="font-medium">{label}</p>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span>Current: {current}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-muted-foreground/50" />
                            <span>Previous: {previous}</span>
                          </div>
                          <div className={`text-xs font-medium ${change > 0 ? "text-destructive" : change < 0 ? "text-green-600" : "text-muted-foreground"}`}>
                            {change > 0 ? "+" : ""}{change}% change
                          </div>
                        </div>
                      );
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="previous"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="current"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        )}

        {/* Combined Overview Chart */}
        <div>
          <h3 className="text-sm font-medium mb-4">Combined Activity</h3>
          <ChartContainer
            config={{
              total: { label: "Total Events", color: "hsl(var(--primary))" },
            }}
            className="h-[200px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={combinedData}>
                <defs>
                  <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                  interval={4}
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--primary))"
                  fill="url(#totalGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Individual Layer Charts */}
        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList>
            <TabsTrigger value="grid">Grid View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            <div className="grid gap-4 md:grid-cols-3">
              {PROTECTION_LAYERS.map(layer => {
                const stats = layerStats[layer.id];
                const data = dailyData[layer.id];
                const Icon = layer.icon;
                
                return (
                  <Card key={layer.id} className="border-border/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="p-1.5 rounded-md" 
                            style={{ backgroundColor: `${layer.color}20` }}
                          >
                            <Icon className="w-4 h-4" style={{ color: layer.color }} />
                          </div>
                          <div>
                            <CardTitle className="text-sm">{layer.name}</CardTitle>
                            <Badge variant="outline" className="text-xs mt-0.5">
                              Layer {layer.layer}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">{stats.total.toLocaleString()}</div>
                          <div className="flex items-center gap-1 text-xs">
                            {stats.trend === "up" && (
                              <>
                                <TrendingUp className="w-3 h-3 text-destructive" />
                                <span className="text-destructive">+{Math.abs(stats.percentChange).toFixed(0)}%</span>
                              </>
                            )}
                            {stats.trend === "down" && (
                              <>
                                <TrendingDown className="w-3 h-3 text-green-500" />
                                <span className="text-green-500">-{Math.abs(stats.percentChange).toFixed(0)}%</span>
                              </>
                            )}
                            {stats.trend === "stable" && (
                              <>
                                <Minus className="w-3 h-3 text-muted-foreground" />
                                <span className="text-muted-foreground">Stable</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <ChartContainer
                        config={{
                          count: { label: "Events", color: layer.color },
                        }}
                        className="h-[80px]"
                      >
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data}>
                            <defs>
                              <linearGradient id={`gradient-${layer.id}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={layer.color} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={layer.color} stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <ChartTooltip 
                              content={<ChartTooltipContent />}
                              cursor={{ stroke: layer.color, strokeOpacity: 0.3 }}
                            />
                            <Area
                              type="monotone"
                              dataKey="count"
                              stroke={layer.color}
                              fill={`url(#gradient-${layer.id})`}
                              strokeWidth={1.5}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                      <p className="text-xs text-muted-foreground mt-2">{layer.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="space-y-4">
              {PROTECTION_LAYERS.map(layer => {
                const stats = layerStats[layer.id];
                const data = dailyData[layer.id];
                const Icon = layer.icon;
                
                return (
                  <Card key={layer.id} className="border-border/50">
                    <CardContent className="py-4">
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 min-w-[200px]">
                          <div 
                            className="p-2 rounded-lg" 
                            style={{ backgroundColor: `${layer.color}20` }}
                          >
                            <Icon className="w-5 h-5" style={{ color: layer.color }} />
                          </div>
                          <div>
                            <div className="font-medium">{layer.name}</div>
                            <Badge variant="outline" className="text-xs">
                              Layer {layer.layer}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <ChartContainer
                            config={{
                              count: { label: "Events", color: layer.color },
                            }}
                            className="h-[50px]"
                          >
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={data}>
                                <Line
                                  type="monotone"
                                  dataKey="count"
                                  stroke={layer.color}
                                  strokeWidth={1.5}
                                  dot={false}
                                />
                              </LineChart>
                            </ResponsiveContainer>
                          </ChartContainer>
                        </div>
                        
                        <div className="text-right min-w-[100px]">
                          <div className="text-xl font-bold">{stats.total.toLocaleString()}</div>
                          <div className="flex items-center justify-end gap-1 text-xs">
                            {stats.trend === "up" && (
                              <>
                                <TrendingUp className="w-3 h-3 text-destructive" />
                                <span className="text-destructive">+{Math.abs(stats.percentChange).toFixed(0)}%</span>
                              </>
                            )}
                            {stats.trend === "down" && (
                              <>
                                <TrendingDown className="w-3 h-3 text-green-500" />
                                <span className="text-green-500">-{Math.abs(stats.percentChange).toFixed(0)}%</span>
                              </>
                            )}
                            {stats.trend === "stable" && (
                              <span className="text-muted-foreground">Stable</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
