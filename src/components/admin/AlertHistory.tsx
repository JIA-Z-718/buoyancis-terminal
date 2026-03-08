import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { History, ChevronDown, ChevronRight, CheckCircle, Download } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ResolvedAlert {
  id: string;
  alert_type: string;
  metric_value: number;
  threshold_value: number;
  created_at: string;
  resolved_at: string;
  resolution_notes: string | null;
}

const ALERT_LABELS: Record<string, { label: string; severity: "warning" | "critical" }> = {
  bounce_rate_warning: { label: "Bounce Rate Warning", severity: "warning" },
  bounce_rate_critical: { label: "Critical Bounce Rate", severity: "critical" },
  complaint_rate_warning: { label: "Complaint Rate Warning", severity: "warning" },
  complaint_rate_critical: { label: "Critical Complaint Rate", severity: "critical" },
  unsubscribe_rate_warning: { label: "High Unsubscribe Rate", severity: "warning" },
};

const AlertHistory = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alerts, setAlerts] = useState<ResolvedAlert[]>([]);
  const { toast } = useToast();

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("deliverability_alerts")
        .select("*")
        .not("resolved_at", "is", null)
        .order("resolved_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error("Error fetching alert history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && alerts.length === 0) {
      fetchHistory();
    }
  }, [isOpen]);

  const getAlertInfo = (alertType: string) => {
    return ALERT_LABELS[alertType] || { label: alertType, severity: "warning" as const };
  };

  const getDuration = (createdAt: string, resolvedAt: string) => {
    const created = new Date(createdAt);
    const resolved = new Date(resolvedAt);
    const diffMs = resolved.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h`;
    }
    if (diffHours > 0) {
      return `${diffHours}h`;
    }
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    return `${diffMinutes}m`;
  };

  const exportToCSV = () => {
    if (alerts.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no resolved alerts to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Alert Type", "Severity", "Metric Value (%)", "Threshold (%)", "Created At", "Resolved At", "Duration", "Resolution Notes"];
    
    const rows = alerts.map((alert) => {
      const info = getAlertInfo(alert.alert_type);
      return [
        info.label,
        info.severity,
        Number(alert.metric_value).toFixed(2),
        Number(alert.threshold_value).toFixed(2),
        format(new Date(alert.created_at), "yyyy-MM-dd HH:mm:ss"),
        format(new Date(alert.resolved_at), "yyyy-MM-dd HH:mm:ss"),
        getDuration(alert.created_at, alert.resolved_at),
        alert.resolution_notes || "",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `alert-history-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${alerts.length} alert(s) to CSV.`,
    });
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <div className="flex items-center justify-between">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="justify-start px-0 hover:bg-transparent">
            <span className="flex items-center gap-2 text-sm font-medium">
              {isOpen ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <History className="h-4 w-4" />
              Resolved Alerts History
              {alerts.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {alerts.length}
                </Badge>
              )}
            </span>
          </Button>
        </CollapsibleTrigger>
        {isOpen && alerts.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportToCSV} className="gap-1.5">
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        )}
      </div>
      <CollapsibleContent className="pt-3">
        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No resolved alerts yet
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert) => {
              const info = getAlertInfo(alert.alert_type);
              return (
                <div
                  key={alert.id}
                  className="flex items-start justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{info.label}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            info.severity === "critical"
                              ? "border-destructive/50 text-destructive"
                              : "border-amber-500/50 text-amber-600"
                          )}
                        >
                          {info.severity}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Peak: {Number(alert.metric_value).toFixed(2)}% (threshold: {Number(alert.threshold_value).toFixed(2)}%)
                      </p>
                      {alert.resolution_notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">
                          "{alert.resolution_notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground shrink-0">
                    <div>Resolved {formatDistanceToNow(new Date(alert.resolved_at), { addSuffix: true })}</div>
                    <div className="mt-0.5">Duration: {getDuration(alert.created_at, alert.resolved_at)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

export default AlertHistory;
