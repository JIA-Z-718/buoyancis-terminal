import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { 
  KeyRound, 
  RefreshCw, 
  Search, 
  X, 
  Clock, 
  AlertTriangle, 
  ShieldAlert,
  Eye,
  ChevronDown,
  ChevronUp,
  User,
  Activity,
  Smartphone,
  Key,
  UserCog,
  ExternalLink,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, subMinutes, addMinutes, formatDistanceToNow, subDays } from "date-fns";
import { cn } from "@/lib/utils";

interface RecoveryCodeAttempt {
  id: string;
  user_id: string;
  success: boolean;
  attempted_at: string;
}

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

interface AuditLogEntry {
  id: string;
  user_id: string;
  table_name: string;
  operation: string;
  record_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
}

interface CorrelatedEvent {
  type: "recovery" | "security" | "audit";
  timestamp: string;
  data: RecoveryCodeAttempt | SecurityEvent | AuditLogEntry;
}

type TimeWindowOption = "15" | "30" | "60" | "120";

const TIME_WINDOW_OPTIONS: { value: TimeWindowOption; label: string }[] = [
  { value: "15", label: "±15 minutes" },
  { value: "30", label: "±30 minutes" },
  { value: "60", label: "±1 hour" },
  { value: "120", label: "±2 hours" },
];

const categoryConfig: Record<string, { icon: typeof ShieldAlert; color: string }> = {
  mfa: { icon: Smartphone, color: "text-blue-600" },
  recovery: { icon: Key, color: "text-amber-600" },
  anomaly: { icon: AlertTriangle, color: "text-red-600" },
  access_control: { icon: UserCog, color: "text-purple-600" },
};

const RecoveryCodeInvestigator = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState<RecoveryCodeAttempt[]>([]);
  const [selectedAttempt, setSelectedAttempt] = useState<RecoveryCodeAttempt | null>(null);
  const [correlatedEvents, setCorrelatedEvents] = useState<CorrelatedEvent[]>([]);
  const [isLoadingCorrelation, setIsLoadingCorrelation] = useState(false);
  const [timeWindow, setTimeWindow] = useState<TimeWindowOption>("30");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch recent failed recovery attempts
  const fetchFailedAttempts = async () => {
    setIsLoading(true);
    try {
      const startDate = subDays(new Date(), 30).toISOString();
      
      const { data, error } = await supabase
        .from("recovery_code_attempts")
        .select("*")
        .eq("success", false)
        .gte("attempted_at", startDate)
        .order("attempted_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setFailedAttempts((data || []) as RecoveryCodeAttempt[]);
    } catch (error) {
      console.error("Error fetching failed attempts:", error);
      toast({
        title: "Error",
        description: "Failed to load recovery code failures",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFailedAttempts();
  }, []);

  // Fetch correlated events when an attempt is selected
  const fetchCorrelatedEvents = async (attempt: RecoveryCodeAttempt) => {
    setIsLoadingCorrelation(true);
    setCorrelatedEvents([]);

    const windowMinutes = parseInt(timeWindow);
    const attemptTime = parseISO(attempt.attempted_at);
    const startTime = subMinutes(attemptTime, windowMinutes).toISOString();
    const endTime = addMinutes(attemptTime, windowMinutes).toISOString();

    try {
      // Fetch security events for this user in the time window
      const securityEventsPromise = supabase.functions.invoke("admin-security-events", {
        body: {
          action: "list",
          category: "all",
          limit: 50,
          user_id: attempt.user_id,
          start_time: startTime,
          end_time: endTime,
        },
      });

      // Fetch audit logs for this user in the time window
      const auditLogsPromise = supabase.functions.invoke("admin-audit-logs", {
        body: {
          table: "all",
          limit: 50,
          user_id: attempt.user_id,
          start_time: startTime,
          end_time: endTime,
        },
      });

      // Fetch other recovery attempts by this user in the window
      const recoveryAttemptsPromise = supabase
        .from("recovery_code_attempts")
        .select("*")
        .eq("user_id", attempt.user_id)
        .gte("attempted_at", startTime)
        .lte("attempted_at", endTime)
        .neq("id", attempt.id)
        .order("attempted_at", { ascending: false });

      const [securityResult, auditResult, recoveryResult] = await Promise.all([
        securityEventsPromise,
        auditLogsPromise,
        recoveryAttemptsPromise,
      ]);

      const events: CorrelatedEvent[] = [];

      // Add the selected attempt as the focal point
      events.push({
        type: "recovery",
        timestamp: attempt.attempted_at,
        data: attempt,
      });

      // Add other recovery attempts
      if (recoveryResult.data) {
        recoveryResult.data.forEach((r: RecoveryCodeAttempt) => {
          events.push({
            type: "recovery",
            timestamp: r.attempted_at,
            data: r,
          });
        });
      }

      // Add security events
      if (securityResult.data?.data) {
        securityResult.data.data.forEach((e: SecurityEvent) => {
          events.push({
            type: "security",
            timestamp: e.created_at,
            data: e,
          });
        });
      }

      // Add audit logs
      if (auditResult.data?.data) {
        auditResult.data.data.forEach((a: AuditLogEntry) => {
          events.push({
            type: "audit",
            timestamp: a.created_at,
            data: a,
          });
        });
      }

      // Sort by timestamp
      events.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setCorrelatedEvents(events);
    } catch (error) {
      console.error("Error fetching correlated events:", error);
      toast({
        title: "Error",
        description: "Failed to load correlated events",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCorrelation(false);
    }
  };

  const handleSelectAttempt = (attempt: RecoveryCodeAttempt) => {
    setSelectedAttempt(attempt);
    fetchCorrelatedEvents(attempt);
  };

  const handleTimeWindowChange = (value: TimeWindowOption) => {
    setTimeWindow(value);
    if (selectedAttempt) {
      fetchCorrelatedEvents(selectedAttempt);
    }
  };

  // Filter attempts by search query
  const filteredAttempts = useMemo(() => {
    if (!searchQuery.trim()) return failedAttempts;
    const query = searchQuery.toLowerCase();
    return failedAttempts.filter((a) => a.user_id.toLowerCase().includes(query));
  }, [failedAttempts, searchQuery]);

  // Group attempts by user for summary
  const userSummary = useMemo(() => {
    const summary: Record<string, { count: number; latest: string }> = {};
    failedAttempts.forEach((a) => {
      if (!summary[a.user_id]) {
        summary[a.user_id] = { count: 0, latest: a.attempted_at };
      }
      summary[a.user_id].count++;
      if (a.attempted_at > summary[a.user_id].latest) {
        summary[a.user_id].latest = a.attempted_at;
      }
    });
    return summary;
  }, [failedAttempts]);

  const renderEventIcon = (event: CorrelatedEvent) => {
    if (event.type === "recovery") {
      const attempt = event.data as RecoveryCodeAttempt;
      return attempt.success ? (
        <Key className="h-4 w-4 text-green-600" />
      ) : (
        <Key className="h-4 w-4 text-red-600" />
      );
    }
    if (event.type === "security") {
      const secEvent = event.data as SecurityEvent;
      const config = categoryConfig[secEvent.category] || categoryConfig.anomaly;
      const Icon = config.icon;
      return <Icon className={cn("h-4 w-4", config.color)} />;
    }
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const renderEventBadge = (event: CorrelatedEvent) => {
    if (event.type === "recovery") {
      const attempt = event.data as RecoveryCodeAttempt;
      return (
        <Badge variant={attempt.success ? "default" : "destructive"} className="text-xs">
          {attempt.success ? "Success" : "Failed"}
        </Badge>
      );
    }
    if (event.type === "security") {
      const secEvent = event.data as SecurityEvent;
      const variant = secEvent.severity === "critical" ? "destructive" : 
                      secEvent.severity === "warn" ? "secondary" : "outline";
      return (
        <Badge variant={variant} className="text-xs">
          {secEvent.severity}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-xs">
        Audit
      </Badge>
    );
  };

  const renderEventDetails = (event: CorrelatedEvent) => {
    if (event.type === "recovery") {
      const attempt = event.data as RecoveryCodeAttempt;
      return (
        <div className="text-sm">
          <span className="font-medium">Recovery Code Attempt</span>
          <p className="text-muted-foreground text-xs mt-1">
            User attempted to verify a recovery code
          </p>
        </div>
      );
    }
    if (event.type === "security") {
      const secEvent = event.data as SecurityEvent;
      return (
        <div className="text-sm">
          <span className="font-medium">
            {secEvent.event_type.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
          </span>
          <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
            {secEvent.description}
          </p>
        </div>
      );
    }
    const auditEntry = event.data as AuditLogEntry;
    return (
      <div className="text-sm">
        <span className="font-medium">
          {auditEntry.operation} on {auditEntry.table_name}
        </span>
        {auditEntry.record_id && (
          <p className="text-muted-foreground text-xs mt-1">
            Record: {auditEntry.record_id.substring(0, 8)}...
          </p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-600" />
              Recovery Code Investigation
            </CardTitle>
            <CardDescription className="mt-1">
              Correlate failed recovery attempts with security events and audit logs
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchFailedAttempts}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative max-w-sm">
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

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredAttempts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <KeyRound className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No failed recovery attempts in the last 30 days</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left: Failed Attempts List */}
            <div className="border rounded-lg">
              <div className="p-3 border-b bg-muted/50">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Failed Attempts ({filteredAttempts.length})
                </h3>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="divide-y">
                  {filteredAttempts.map((attempt) => (
                    <div
                      key={attempt.id}
                      className={cn(
                        "p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                        selectedAttempt?.id === attempt.id && "bg-muted"
                      )}
                      onClick={() => handleSelectAttempt(attempt)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <Key className="h-4 w-4 text-red-600 shrink-0" />
                          <span className="font-mono text-xs truncate">
                            {attempt.user_id.substring(0, 8)}...
                          </span>
                          <Badge variant="secondary" className="text-xs shrink-0">
                            {userSummary[attempt.user_id]?.count || 1} total
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(parseISO(attempt.attempted_at), { addSuffix: true })}
                          </span>
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format(parseISO(attempt.attempted_at), "PPpp")}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Right: Correlated Events Timeline */}
            <div className="border rounded-lg">
              <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Correlated Events
                </h3>
                <Select value={timeWindow} onValueChange={(v) => handleTimeWindowChange(v as TimeWindowOption)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_WINDOW_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <ScrollArea className="h-[400px]">
                {!selectedAttempt ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center p-4">
                      <Eye className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Select a failed attempt to view correlated events</p>
                    </div>
                  </div>
                ) : isLoadingCorrelation ? (
                  <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : correlatedEvents.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center p-4">
                      <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No correlated events found</p>
                      <p className="text-xs mt-1">Try expanding the time window</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y">
                    {correlatedEvents.map((event, idx) => {
                      const isSelected = event.type === "recovery" && 
                        (event.data as RecoveryCodeAttempt).id === selectedAttempt.id;
                      const isExpanded = expandedEventId === `${event.type}-${idx}`;
                      
                      return (
                        <div
                          key={`${event.type}-${idx}`}
                          className={cn(
                            "p-3 transition-colors",
                            isSelected && "bg-amber-50 dark:bg-amber-950/20 border-l-2 border-amber-500"
                          )}
                        >
                          <div 
                            className="flex items-start gap-3 cursor-pointer"
                            onClick={() => setExpandedEventId(isExpanded ? null : `${event.type}-${idx}`)}
                          >
                            <div className="mt-0.5">
                              {renderEventIcon(event)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                {renderEventBadge(event)}
                                <span className="text-xs text-muted-foreground">
                                  {format(parseISO(event.timestamp), "HH:mm:ss")}
                                </span>
                                {isSelected && (
                                  <Badge variant="outline" className="text-xs bg-amber-100 dark:bg-amber-900/30">
                                    Selected
                                  </Badge>
                                )}
                              </div>
                              {renderEventDetails(event)}
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
                            <div className="mt-3 ml-7 p-3 bg-muted/50 rounded-lg text-xs">
                              <pre className="whitespace-pre-wrap overflow-x-auto">
                                {JSON.stringify(event.data, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecoveryCodeInvestigator;
