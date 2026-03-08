import { useMemo, useState } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format, subDays, startOfDay, eachDayOfInterval } from "date-fns";
import { Layers } from "lucide-react";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useOptionalDateRange, DATE_RANGE_OPTIONS } from "@/contexts/DateRangeContext";
import { useDateRangePersistence, DATE_RANGE_STORAGE_KEYS } from "@/hooks/useDateRangePersistence";

interface CleanupLogEntry {
  id: string;
  notification_type: string;
  subject: string | null;
  status: string;
  created_at: string;
}

interface CleanupTrendsChartProps {
  logs: CleanupLogEntry[];
  daysToShow?: number;
}

// DATE_RANGE_OPTIONS is now imported from context

const TABLE_COLORS: Record<string, string> = {
  bot_detection_events: "hsl(24, 95%, 53%)",
  rate_limit_violations: "hsl(217, 91%, 60%)",
  signup_error_logs: "hsl(142, 71%, 45%)",
  cron_failure_notifications: "hsl(280, 67%, 55%)",
  files: "hsl(340, 82%, 52%)",
};

const TABLE_LABELS: Record<string, string> = {
  bot_detection_events: "Bot Detection",
  rate_limit_violations: "Rate Limits",
  signup_error_logs: "Signup Errors",
  cron_failure_notifications: "Cron Failures",
  files: "Export Files",
};

interface DailyData {
  date: string;
  bot_detection_events: number;
  rate_limit_violations: number;
  signup_error_logs: number;
  cron_failure_notifications: number;
  files: number;
  [key: string]: string | number;
}

export default function CleanupTrendsChart({ logs, daysToShow = 14 }: CleanupTrendsChartProps) {
  const [isStacked, setIsStacked] = useState(true);
  const dateRangeContext = useOptionalDateRange();
  
  // Use shared persistence hook for local fallback
  const localPersistence = useDateRangePersistence({
    storageKey: DATE_RANGE_STORAGE_KEYS.CLEANUP_TRENDS,
    defaultDays: daysToShow.toString(),
  });
  
  const selectedDays = dateRangeContext?.selectedDays ?? localPersistence.selectedDays;
  const setSelectedDays = dateRangeContext?.setSelectedDays ?? localPersistence.setSelectedDays;
  const activeDays = parseInt(selectedDays, 10);
  const isUsingSharedRange = !!dateRangeContext;
  
  const { chartData, activeTables } = useMemo(() => {
    const endDate = startOfDay(new Date());
    const startDate = subDays(endDate, activeDays - 1);
    
    // Create array of all days in the range
    const allDays = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Initialize data for each day
    const dailyData: Record<string, DailyData> = {};
    
    allDays.forEach(day => {
      const key = format(day, "yyyy-MM-dd");
      dailyData[key] = {
        date: format(day, "MMM d"),
        bot_detection_events: 0,
        rate_limit_violations: 0,
        signup_error_logs: 0,
        cron_failure_notifications: 0,
        files: 0,
      };
    });
    
    // Parse table breakdown from subject: "... [table1:count1|table2:count2]"
    const parseTableBreakdown = (subject: string | null): Record<string, number> => {
      if (!subject) return {};
      const result: Record<string, number> = {};
      
      const match = subject.match(/\[([^\]]+)\]/);
      if (match) {
        match[1].split("|").forEach(part => {
          const [table, countStr] = part.split(":");
          const count = parseInt(countStr, 10);
          if (table && !isNaN(count)) {
            result[table] = count;
          }
        });
      }
      return result;
    };
    
    // Parse file count from export cleanup
    const parseFileCount = (subject: string | null): number => {
      if (!subject) return 0;
      const match = subject.match(/(\d+)\s*file/i);
      return match ? parseInt(match[1], 10) : 0;
    };
    
    // Track which tables have data
    const tablesWithData = new Set<string>();
    
    // Aggregate logs by day and table
    logs.forEach(log => {
      const logDate = format(new Date(log.created_at), "yyyy-MM-dd");
      
      if (dailyData[logDate]) {
        if (log.notification_type === "data_retention_cleanup") {
          const breakdown = parseTableBreakdown(log.subject);
          Object.entries(breakdown).forEach(([table, count]) => {
            if (dailyData[logDate][table] !== undefined) {
              (dailyData[logDate][table] as number) += count;
              if (count > 0) tablesWithData.add(table);
            }
          });
        } else if (log.notification_type === "export_cleanup") {
          const fileCount = parseFileCount(log.subject);
          dailyData[logDate].files += fileCount;
          if (fileCount > 0) tablesWithData.add("files");
        }
      }
    });
    
    return {
      chartData: Object.values(dailyData),
      activeTables: Array.from(tablesWithData)
    };
  }, [logs, activeDays]);

  const hasData = activeTables.length > 0;

  if (!hasData) {
    return (
      <div className="space-y-2">
        {!isUsingSharedRange && (
          <div className="flex justify-end">
            <ToggleGroup
              type="single"
              value={selectedDays}
              onValueChange={(value) => value && setSelectedDays(value)}
              size="sm"
            >
              {DATE_RANGE_OPTIONS.map((option) => (
                <ToggleGroupItem key={option.value} value={option.value} aria-label={`Show ${option.label}`}>
                  {option.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        )}
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          <p>No per-table cleanup data available for the last {activeDays} days</p>
        </div>
      </div>
    );
  }

  const stackId = isStacked ? "1" : undefined;

  return (
    <div className="space-y-2">
      <div className="flex justify-end gap-2">
        {!isUsingSharedRange && (
          <ToggleGroup
            type="single"
            value={selectedDays}
            onValueChange={(value) => value && setSelectedDays(value)}
            size="sm"
          >
            {DATE_RANGE_OPTIONS.map((option) => (
              <ToggleGroupItem key={option.value} value={option.value} aria-label={`Show ${option.label}`}>
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        )}
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger asChild>
              <Toggle
                pressed={isStacked}
                onPressedChange={setIsStacked}
                size="sm"
                aria-label="Toggle stacked view"
              >
                <Layers className="w-4 h-4 mr-1" />
                {isStacked ? "Stacked" : "Overlaid"}
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isStacked ? "Switch to overlaid view" : "Switch to stacked view"}</p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {Object.entries(TABLE_COLORS).map(([key, color]) => (
              <linearGradient key={key} id={`color-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                <stop offset="95%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 11 }} 
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
          />
          <YAxis 
            tick={{ fontSize: 11 }} 
            tickLine={false}
            axisLine={false}
            className="text-muted-foreground"
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--popover))",
              borderColor: "hsl(var(--border))",
              borderRadius: "8px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}
            labelStyle={{ fontWeight: 600, marginBottom: 4 }}
            formatter={(value: number, name: string) => {
              const label = TABLE_LABELS[name] || name;
              return [value.toLocaleString(), label];
            }}
          />
          <Legend 
            verticalAlign="top" 
            height={36}
            formatter={(value: string) => TABLE_LABELS[value] || value}
          />
          {activeTables.includes("bot_detection_events") && (
            <Area
              type="monotone"
              dataKey="bot_detection_events"
              stackId={stackId}
              stroke={TABLE_COLORS.bot_detection_events}
              strokeWidth={2}
              fillOpacity={isStacked ? 1 : 0.6}
              fill="url(#color-bot_detection_events)"
            />
          )}
          {activeTables.includes("rate_limit_violations") && (
            <Area
              type="monotone"
              dataKey="rate_limit_violations"
              stackId={stackId}
              stroke={TABLE_COLORS.rate_limit_violations}
              strokeWidth={2}
              fillOpacity={isStacked ? 1 : 0.6}
              fill="url(#color-rate_limit_violations)"
            />
          )}
          {activeTables.includes("signup_error_logs") && (
            <Area
              type="monotone"
              dataKey="signup_error_logs"
              stackId={stackId}
              stroke={TABLE_COLORS.signup_error_logs}
              strokeWidth={2}
              fillOpacity={isStacked ? 1 : 0.6}
              fill="url(#color-signup_error_logs)"
            />
          )}
          {activeTables.includes("cron_failure_notifications") && (
            <Area
              type="monotone"
              dataKey="cron_failure_notifications"
              stackId={stackId}
              stroke={TABLE_COLORS.cron_failure_notifications}
              strokeWidth={2}
              fillOpacity={isStacked ? 1 : 0.6}
              fill="url(#color-cron_failure_notifications)"
            />
          )}
          {activeTables.includes("files") && (
            <Area
              type="monotone"
              dataKey="files"
              stackId={stackId}
              stroke={TABLE_COLORS.files}
              strokeWidth={2}
              fillOpacity={isStacked ? 1 : 0.6}
              fill="url(#color-files)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}
