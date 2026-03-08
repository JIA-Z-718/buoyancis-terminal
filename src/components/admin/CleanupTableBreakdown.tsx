import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Database, Table2 } from "lucide-react";

interface CleanupLogEntry {
  id: string;
  notification_type: string;
  subject: string | null;
  status: string;
  created_at: string;
}

interface CleanupTableBreakdownProps {
  logs: CleanupLogEntry[];
}

interface TableData {
  table: string;
  displayName: string;
  records: number;
  color: string;
}

const TABLE_COLORS: Record<string, string> = {
  bot_detection_events: "hsl(24, 95%, 53%)",
  rate_limit_violations: "hsl(217, 91%, 60%)",
  signup_error_logs: "hsl(142, 71%, 45%)",
  cron_failure_notifications: "hsl(280, 67%, 55%)",
};

const TABLE_DISPLAY_NAMES: Record<string, string> = {
  bot_detection_events: "Bot Detection",
  rate_limit_violations: "Rate Limits",
  signup_error_logs: "Signup Errors",
  cron_failure_notifications: "Cron Failures",
};

export default function CleanupTableBreakdown({ logs }: CleanupTableBreakdownProps) {
  const tableData = useMemo(() => {
    const aggregated: Record<string, number> = {};
    
    logs
      .filter(log => log.notification_type === "data_retention_cleanup" && log.subject)
      .forEach(log => {
        // Parse table breakdown from subject: "... [table1:count1|table2:count2]"
        const match = log.subject?.match(/\[([^\]]+)\]/);
        if (match) {
          const breakdown = match[1];
          breakdown.split("|").forEach(part => {
            const [table, countStr] = part.split(":");
            const count = parseInt(countStr, 10);
            if (table && !isNaN(count)) {
              aggregated[table] = (aggregated[table] || 0) + count;
            }
          });
        } else {
          // Fallback: try to extract from older format or single table cleanup
          const singleTableMatch = log.subject?.match(/\(([^)]+)\):\s*(\d+)/);
          if (singleTableMatch) {
            const table = singleTableMatch[1];
            const count = parseInt(singleTableMatch[2], 10);
            if (!isNaN(count)) {
              aggregated[table] = (aggregated[table] || 0) + count;
            }
          }
        }
      });
    
    return Object.entries(aggregated)
      .map(([table, records]): TableData => ({
        table,
        displayName: TABLE_DISPLAY_NAMES[table] || table.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        records,
        color: TABLE_COLORS[table] || "hsl(var(--muted-foreground))"
      }))
      .sort((a, b) => b.records - a.records);
  }, [logs]);

  const totalRecords = tableData.reduce((sum, t) => sum + t.records, 0);

  if (tableData.length === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-muted-foreground">
        <Database className="w-12 h-12 mb-3 opacity-50" />
        <p>No per-table breakdown data available</p>
        <p className="text-sm">Table breakdown will appear after cleanup runs</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {tableData.map((item) => (
          <Badge 
            key={item.table} 
            variant="outline" 
            className="flex items-center gap-2 py-1.5"
            style={{ borderColor: item.color }}
          >
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: item.color }}
            />
            <span>{item.displayName}</span>
            <span className="font-mono font-semibold">{item.records.toLocaleString()}</span>
          </Badge>
        ))}
      </div>
      
      {/* Bar chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={tableData} 
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
            <XAxis 
              type="number" 
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <YAxis 
              type="category" 
              dataKey="displayName" 
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={100}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                borderColor: "hsl(var(--border))",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
              formatter={(value: number) => [value.toLocaleString(), "Records Deleted"]}
              labelFormatter={(label) => label}
            />
            <Bar dataKey="records" radius={[0, 4, 4, 0]}>
              {tableData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Percentage breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tableData.map((item) => {
          const percentage = totalRecords > 0 ? ((item.records / totalRecords) * 100).toFixed(1) : 0;
          return (
            <div 
              key={item.table}
              className="p-3 bg-muted/50 rounded-lg border"
              style={{ borderLeftColor: item.color, borderLeftWidth: 3 }}
            >
              <div className="flex items-center gap-2 mb-1">
                <Table2 className="w-3.5 h-3.5" style={{ color: item.color }} />
                <span className="text-xs font-medium truncate">{item.displayName}</span>
              </div>
              <div className="text-lg font-bold">{percentage}%</div>
              <div className="text-xs text-muted-foreground">
                {item.records.toLocaleString()} records
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
