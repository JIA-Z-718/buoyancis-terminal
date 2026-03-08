import { useMemo, useState } from "react";
import { format, eachDayOfInterval, differenceInDays, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { TrendingUp, CheckCircle, XCircle, BarChart3, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useOptionalDateRange, DATE_RANGE_OPTIONS } from "@/contexts/DateRangeContext";
import { useDateRangePersistence, DATE_RANGE_STORAGE_KEYS } from "@/hooks/useDateRangePersistence";

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

interface DateRange {
  from: Date;
  to: Date;
}

interface CronJobTrendsChartProps {
  history: JobRunHistory[];
  loading: boolean;
  dateRange?: DateRange;
}

const chartConfig: ChartConfig = {
  succeeded: {
    label: "Succeeded",
    color: "hsl(142, 76%, 36%)",
  },
  failed: {
    label: "Failed",
    color: "hsl(0, 84%, 60%)",
  },
};

const CronJobTrendsChart = ({ history, loading, dateRange: externalDateRange }: CronJobTrendsChartProps) => {
  const { toast } = useToast();
  const dateRangeContext = useOptionalDateRange();
  
  // Use shared persistence hook for local fallback
  const localPersistence = useDateRangePersistence({
    storageKey: DATE_RANGE_STORAGE_KEYS.CRON_TRENDS,
    defaultDays: "7",
  });
  
  const selectedDays = dateRangeContext?.selectedDays ?? localPersistence.selectedDays;
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
  
  // Use internal date range based on selectedDays, or external if provided, or shared context
  const dateRange = useMemo(() => {
    if (externalDateRange) return externalDateRange;
    if (dateRangeContext) return dateRangeContext.dateRange;
    const days = parseInt(selectedDays, 10);
    const to = new Date();
    const from = subDays(to, days - 1);
    return { from, to };
  }, [externalDateRange, dateRangeContext, selectedDays]);

  const dayCount = useMemo(() => {
    return differenceInDays(dateRange.to, dateRange.from) + 1;
  }, [dateRange]);

  const trendData = useMemo(() => {
    // Create array of days in the range
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    // Choose label format based on range length
    const labelFormat = dayCount > 14 ? "MM/dd" : dayCount > 7 ? "EEE dd" : "EEE";
    
    // Initialize data for each day
    const dailyData = days.map(day => ({
      date: format(day, "yyyy-MM-dd"),
      label: format(day, labelFormat),
      succeeded: 0,
      failed: 0,
      total: 0,
    }));

    // Aggregate history by day
    history.forEach(run => {
      const runDate = format(new Date(run.start_time), "yyyy-MM-dd");
      const dayData = dailyData.find(d => d.date === runDate);
      
      if (dayData) {
        if (run.status === "succeeded") {
          dayData.succeeded++;
        } else if (run.status === "failed") {
          dayData.failed++;
        }
        dayData.total++;
      }
    });

    return dailyData;
  }, [history, dateRange, dayCount]);

  const stats = useMemo(() => {
    const totalSuccess = trendData.reduce((acc, d) => acc + d.succeeded, 0);
    const totalFailed = trendData.reduce((acc, d) => acc + d.failed, 0);
    const total = totalSuccess + totalFailed;
    const successRate = total > 0 ? (totalSuccess / total) * 100 : 0;
    const avgPerDay = total / dayCount;

    return { totalSuccess, totalFailed, total, successRate, avgPerDay };
  }, [trendData, dayCount]);

  const rangeLabel = useMemo(() => {
    if (dayCount === 7) return "7-Day";
    if (dayCount === 14) return "14-Day";
    if (dayCount === 30) return "30-Day";
    return `${dayCount}-Day`;
  }, [dayCount]);

  const handleExportCSV = () => {
    if (trendData.length === 0) {
      toast({
        title: "No Data",
        description: "No trends data available to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Date", "Succeeded", "Failed", "Total", "Success Rate (%)"];
    const rows = trendData.map(day => {
      const successRate = day.total > 0 ? ((day.succeeded / day.total) * 100).toFixed(1) : "0.0";
      return [day.date, day.succeeded, day.failed, day.total, successRate];
    });

    // Add summary row
    rows.push([]);
    rows.push(["Summary"]);
    rows.push(["Total Runs", stats.total]);
    rows.push(["Total Succeeded", stats.totalSuccess]);
    rows.push(["Total Failed", stats.totalFailed]);
    rows.push(["Overall Success Rate", `${stats.successRate.toFixed(1)}%`]);
    rows.push(["Average Per Day", stats.avgPerDay.toFixed(1)]);
    rows.push(["Date Range", `${format(dateRange.from, "yyyy-MM-dd")} to ${format(dateRange.to, "yyyy-MM-dd")}`]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `cron-trends-${format(dateRange.from, "yyyy-MM-dd")}-to-${format(dateRange.to, "yyyy-MM-dd")}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Complete",
      description: `Trends data exported for ${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d, yyyy")}`,
    });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No run data available for trends</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">{rangeLabel} Total</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-xs font-medium">Succeeded</span>
          </div>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.totalSuccess}
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <XCircle className="h-4 w-4 text-red-600" />
            <span className="text-xs font-medium">Failed</span>
          </div>
          <p className={`text-2xl font-bold ${stats.totalFailed > 0 ? "text-red-600 dark:text-red-400" : ""}`}>
            {stats.totalFailed}
          </p>
        </div>
        
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs font-medium">Avg/Day</span>
          </div>
          <p className="text-2xl font-bold">
            {stats.avgPerDay.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-muted/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Success/Failure Trends ({format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d, yyyy")})
          </h4>
          <div className="flex items-center gap-2">
            {!externalDateRange && !isUsingSharedRange && (
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
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-1" />
              Export CSV
            </Button>
          </div>
        </div>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
            <XAxis 
              dataKey="label" 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              interval={dayCount > 14 ? Math.floor(dayCount / 7) - 1 : 0}
            />
            <YAxis 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              allowDecimals={false}
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
              cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
            />
            <Bar 
              dataKey="succeeded" 
              stackId="a" 
              fill="var(--color-succeeded)" 
              radius={[0, 0, 0, 0]}
            />
            <Bar 
              dataKey="failed" 
              stackId="a" 
              fill="var(--color-failed)" 
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ChartContainer>
      </div>

      {/* Success Rate Banner */}
      <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${
        stats.successRate >= 95 
          ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
          : stats.successRate >= 80
            ? "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800"
            : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
      }`}>
        <div className="flex items-center gap-2">
          {stats.successRate >= 95 ? (
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          ) : stats.successRate >= 80 ? (
            <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          )}
          <span className={`text-sm font-medium ${
            stats.successRate >= 95 
              ? "text-green-700 dark:text-green-300"
              : stats.successRate >= 80
                ? "text-amber-700 dark:text-amber-300"
                : "text-red-700 dark:text-red-300"
          }`}>
            {rangeLabel} Success Rate: {stats.successRate.toFixed(1)}%
          </span>
        </div>
        <span className={`text-xs ${
          stats.successRate >= 95 
            ? "text-green-600 dark:text-green-400"
            : stats.successRate >= 80
              ? "text-amber-600 dark:text-amber-400"
              : "text-red-600 dark:text-red-400"
        }`}>
          {stats.totalSuccess} / {stats.total} runs successful
        </span>
      </div>
    </div>
  );
};

export default CronJobTrendsChart;
