import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, LineChart, Line, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Bell, TrendingUp, RefreshCw } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useOptionalDateRange, DATE_RANGE_OPTIONS } from "@/contexts/DateRangeContext";
import { useDateRangePersistence, DATE_RANGE_STORAGE_KEYS } from "@/hooks/useDateRangePersistence";

interface AlertTrendData {
  date: string;
  label: string;
  warning: number;
  critical: number;
  total: number;
}

interface AlertTypeSummary {
  type: string;
  label: string;
  count: number;
  severity: "warning" | "critical";
}

const ALERT_TYPE_LABELS: Record<string, { label: string; severity: "warning" | "critical" }> = {
  bounce_rate_warning: { label: "Bounce Warning", severity: "warning" },
  bounce_rate_critical: { label: "Bounce Critical", severity: "critical" },
  complaint_rate_warning: { label: "Complaint Warning", severity: "warning" },
  complaint_rate_critical: { label: "Complaint Critical", severity: "critical" },
  unsubscribe_rate_warning: { label: "Unsubscribe Warning", severity: "warning" },
};

const AlertFrequencyTrends = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [trendData, setTrendData] = useState<AlertTrendData[]>([]);
  const [typeSummary, setTypeSummary] = useState<AlertTypeSummary[]>([]);
  const [totalAlerts, setTotalAlerts] = useState(0);
  
  const dateRangeContext = useOptionalDateRange();
  
  // Use shared persistence hook for local fallback
  const localPersistence = useDateRangePersistence({
    storageKey: DATE_RANGE_STORAGE_KEYS.ALERT_TRENDS,
    defaultDays: "30",
  });
  
  const selectedDays = dateRangeContext?.selectedDays ?? localPersistence.selectedDays;
  const activeDays = parseInt(selectedDays, 10);
  const isUsingSharedRange = !!dateRangeContext;

  const handleDaysChange = (value: string) => {
    if (value) {
      if (dateRangeContext) {
        dateRangeContext.setSelectedDays(value);
      } else {
        localPersistence.setSelectedDays(value);
      }
    }
  };

  const fetchAlertTrends = async () => {
    setIsLoading(true);
    try {
      // Fetch all alerts from the selected range (both resolved and unresolved)
      const rangeStart = subDays(new Date(), activeDays).toISOString();
      
      const { data: alerts, error } = await supabase
        .from("deliverability_alerts")
        .select("id, alert_type, created_at, resolved_at")
        .gte("created_at", rangeStart)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Generate days structure for the selected range
      const daysData: AlertTrendData[] = Array.from({ length: activeDays }, (_, i) => {
        const date = subDays(new Date(), activeDays - 1 - i);
        return {
          date: format(date, "yyyy-MM-dd"),
          label: format(date, activeDays > 14 ? "MM/dd" : "MMM d"),
          warning: 0,
          critical: 0,
          total: 0,
        };
      });

      // Type counts for summary
      const typeCounts: Record<string, number> = {};

      // Aggregate alerts by day and type
      (alerts || []).forEach((alert) => {
        const alertDate = format(parseISO(alert.created_at), "yyyy-MM-dd");
        const dayData = daysData.find((d) => d.date === alertDate);
        
        if (dayData) {
          const typeInfo = ALERT_TYPE_LABELS[alert.alert_type];
          if (typeInfo?.severity === "critical") {
            dayData.critical += 1;
          } else {
            dayData.warning += 1;
          }
          dayData.total += 1;
        }

        // Count by type
        typeCounts[alert.alert_type] = (typeCounts[alert.alert_type] || 0) + 1;
      });

      setTrendData(daysData);
      setTotalAlerts(alerts?.length || 0);

      // Build type summary sorted by count
      const summary: AlertTypeSummary[] = Object.entries(typeCounts)
        .map(([type, count]) => ({
          type,
          label: ALERT_TYPE_LABELS[type]?.label || type,
          count,
          severity: ALERT_TYPE_LABELS[type]?.severity || "warning",
        }))
        .sort((a, b) => b.count - a.count);

      setTypeSummary(summary);
    } catch (error) {
      console.error("Error fetching alert trends:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertTrends();
  }, [activeDays]);

  const chartConfig = {
    warning: {
      label: "Warning",
      color: "hsl(38 92% 50%)",
    },
    critical: {
      label: "Critical",
      color: "hsl(0 84% 60%)",
    },
  };

  // Calculate averages
  const avgAlertsPerDay = useMemo(() => {
    const daysWithAlerts = trendData.filter((d) => d.total > 0).length;
    return daysWithAlerts > 0 ? (totalAlerts / activeDays).toFixed(1) : "0";
  }, [trendData, totalAlerts, activeDays]);

  const peakDay = useMemo(() => {
    if (trendData.length === 0) return null;
    const max = trendData.reduce((prev, curr) => (curr.total > prev.total ? curr : prev));
    return max.total > 0 ? max : null;
  }, [trendData]);

  if (isLoading) {
    return (
      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="h-[160px] w-full" />
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6 pt-6 border-t">
      <div className="flex items-center justify-between mb-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="p-0 h-auto hover:bg-transparent gap-2">
            <Bell className="h-4 w-4" />
            <span className="text-sm font-medium">Alert Frequency Trends (Last {activeDays} Days)</span>
            {totalAlerts > 0 && (
              <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-destructive/10 text-destructive rounded-full">
                {totalAlerts} alerts
              </span>
            )}
          </Button>
        </CollapsibleTrigger>
        <div className="flex items-center gap-2">
          {!isUsingSharedRange && (
            <ToggleGroup
              type="single"
              value={selectedDays}
              onValueChange={handleDaysChange}
              size="sm"
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value} aria-label={`Show ${option.label}`}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
          <Button variant="ghost" size="icon" onClick={fetchAlertTrends} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <CollapsibleContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Total Alerts</p>
            <p className="text-lg font-bold">{totalAlerts}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Avg/Day</p>
            <p className="text-lg font-bold">{avgAlertsPerDay}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Peak Day</p>
            <p className="text-lg font-bold">
              {peakDay ? `${peakDay.total} on ${peakDay.label}` : "None"}
            </p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Critical %</p>
            <p className="text-lg font-bold text-destructive">
              {totalAlerts > 0
                ? `${((trendData.reduce((sum, d) => sum + d.critical, 0) / totalAlerts) * 100).toFixed(0)}%`
                : "0%"}
            </p>
          </div>
        </div>

        {/* Stacked Bar Chart */}
        {totalAlerts > 0 ? (
          <ChartContainer config={chartConfig} className="h-[160px] w-full">
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 11 }}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar
                dataKey="warning"
                stackId="alerts"
                fill="hsl(38 92% 50%)"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="critical"
                stackId="alerts"
                fill="hsl(0 84% 60%)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="h-[120px] flex items-center justify-center text-muted-foreground bg-muted/30 rounded-lg">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No alerts in the last {activeDays} days</p>
            </div>
          </div>
        )}

        {/* Alert Type Breakdown */}
        {typeSummary.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              By Alert Type
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {typeSummary.map((item) => (
                <div
                  key={item.type}
                  className={cn(
                    "p-2 rounded-lg border text-sm",
                    item.severity === "critical"
                      ? "border-destructive/30 bg-destructive/5"
                      : "border-amber-500/30 bg-amber-50 dark:bg-amber-950/20"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "text-xs",
                        item.severity === "critical"
                          ? "text-destructive"
                          : "text-amber-700 dark:text-amber-300"
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="font-bold">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AlertFrequencyTrends;
