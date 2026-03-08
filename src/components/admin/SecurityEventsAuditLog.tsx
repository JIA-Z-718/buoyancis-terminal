import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  ShieldCheck, 
  ShieldAlert,
  ShieldX,
  RefreshCw, 
  User, 
  Clock,
  Key,
  UserCog,
  AlertTriangle,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Activity
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SecurityEvent {
  id: string;
  event_type: string;
  category: string;
  severity: "info" | "warn" | "critical";
  description: string;
  user_id: string | null;
  user_email?: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface SecurityStats {
  total_events_24h: number;
  mfa_events: number;
  recovery_attempts: number;
  anomaly_alerts: number;
  role_changes: number;
  failed_mfa: number;
  failed_recovery: number;
}

const categoryConfig: Record<string, { icon: typeof ShieldCheck; label: string; color: string }> = {
  mfa: { icon: Smartphone, label: "MFA", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  recovery: { icon: Key, label: "Recovery", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
  anomaly: { icon: AlertTriangle, label: "Anomaly", color: "bg-red-500/10 text-red-600 border-red-200" },
  access_control: { icon: UserCog, label: "Access", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
};

const severityConfig: Record<string, { icon: typeof ShieldCheck; color: string }> = {
  info: { icon: ShieldCheck, color: "text-green-600" },
  warn: { icon: ShieldAlert, color: "text-amber-600" },
  critical: { icon: ShieldX, color: "text-red-600" },
};

const SecurityEventsAuditLog = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Fetch security events
  const {
    data: events,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["security-events", selectedCategory],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-security-events", {
        body: { action: "list", category: selectedCategory, limit: 100 },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.data as SecurityEvent[];
    },
  });

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ["security-events-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("admin-security-events", {
        body: { action: "stats" },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data.data as SecurityStats;
    },
    refetchInterval: 60000, // Refresh stats every minute
  });

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const formatEventType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Events (24h)</p>
                <p className="text-lg font-semibold">{stats.total_events_24h}</p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-xs text-muted-foreground">MFA Events</p>
                <p className="text-lg font-semibold">
                  {stats.mfa_events}
                  {stats.failed_mfa > 0 && (
                    <span className="text-xs text-red-600 ml-1">({stats.failed_mfa} failed)</span>
                  )}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-amber-600" />
              <div>
                <p className="text-xs text-muted-foreground">Recovery Attempts</p>
                <p className="text-lg font-semibold">
                  {stats.recovery_attempts}
                  {stats.failed_recovery > 0 && (
                    <span className="text-xs text-red-600 ml-1">({stats.failed_recovery} failed)</span>
                  )}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-xs text-muted-foreground">Anomaly Alerts</p>
                <p className="text-lg font-semibold">{stats.anomaly_alerts}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Events Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Security Events Audit Log
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                MFA changes, lockouts, recovery attempts, and role changes
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[140px] h-8 text-sm">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="mfa">MFA Events</SelectItem>
                  <SelectItem value="recovery">Recovery</SelectItem>
                  <SelectItem value="anomaly">Anomalies</SelectItem>
                  <SelectItem value="access_control">Access Control</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="h-8 w-8"
              >
                <RefreshCw className={cn("h-4 w-4", (isLoading || isRefetching) && "animate-spin")} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : !events || events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ShieldCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No security events found</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {events.map((event) => {
                  const catConfig = categoryConfig[event.category] || categoryConfig.mfa;
                  const sevConfig = severityConfig[event.severity] || severityConfig.info;
                  const CatIcon = catConfig.icon;
                  const SevIcon = sevConfig.icon;
                  const isExpanded = expandedIds.has(event.id);

                  return (
                    <div
                      key={event.id}
                      className={cn(
                        "border rounded-lg p-3 hover:bg-muted/50 transition-colors",
                        event.severity === "critical" && "border-red-200 bg-red-50/50 dark:bg-red-950/10",
                        event.severity === "warn" && "border-amber-200 bg-amber-50/50 dark:bg-amber-950/10"
                      )}
                    >
                      <div
                        className="flex items-start gap-3 cursor-pointer"
                        onClick={() => toggleExpand(event.id)}
                      >
                        <div
                          className={cn(
                            "p-2 rounded-full border",
                            catConfig.color
                          )}
                        >
                          <CatIcon className="h-3 w-3" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="text-xs font-normal">
                              {catConfig.label}
                            </Badge>
                            <SevIcon className={cn("h-3 w-3", sevConfig.color)} />
                            <span className="text-sm font-medium">{formatEventType(event.event_type)}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {event.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            {event.user_id && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {event.user_email || `${event.user_id.substring(0, 8)}...`}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDistanceToNow(new Date(event.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium text-muted-foreground">User ID:</span>
                              <p className="font-mono">{event.user_id || "N/A"}</p>
                            </div>
                            <div>
                              <span className="font-medium text-muted-foreground">IP Address:</span>
                              <p className="font-mono">{event.ip_address || "N/A"}</p>
                            </div>
                            <div className="col-span-2">
                              <span className="font-medium text-muted-foreground">Time:</span>
                              <p>{format(new Date(event.created_at), "PPpp")}</p>
                            </div>
                            {event.user_agent && (
                              <div className="col-span-2">
                                <span className="font-medium text-muted-foreground">User Agent:</span>
                                <p className="line-clamp-2 text-muted-foreground">{event.user_agent}</p>
                              </div>
                            )}
                            {event.details && Object.keys(event.details).length > 0 && (
                              <div className="col-span-2">
                                <span className="font-medium text-muted-foreground">Details:</span>
                                <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-x-auto">
                                  {JSON.stringify(event.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityEventsAuditLog;
