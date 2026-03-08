import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText, 
  RefreshCw, 
  User, 
  Clock, 
  Database,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import type { Json } from "@/integrations/supabase/types";

interface AuditLogEntry {
  id: string;
  user_id: string;
  table_name: string;
  operation: string;
  record_id: string | null;
  old_values: Json | null;
  new_values: Json | null;
  created_at: string;
}

const SENSITIVE_TABLES = [
  "email_campaigns",
  "profiles",
  "user_roles",
  "email_templates",
  "scheduled_emails",
  "blog_posts",
];

const operationConfig: Record<string, { icon: typeof Plus; color: string; label: string }> = {
  INSERT: { icon: Plus, color: "bg-green-500/10 text-green-600 border-green-200", label: "Created" },
  UPDATE: { icon: Pencil, color: "bg-blue-500/10 text-blue-600 border-blue-200", label: "Updated" },
  DELETE: { icon: Trash2, color: "bg-red-500/10 text-red-600 border-red-200", label: "Deleted" },
};

const AdminAuditLogWidget = () => {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-audit-logs", {
        body: {
          table: selectedTable === "all" ? "all" : selectedTable,
          limit: 50,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setEntries((data?.data as AuditLogEntry[]) || []);
    } catch (err) {
      console.error("Error fetching audit logs:", err);
      setEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTable]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  // Poll for updates (audit log is intentionally not directly readable from the client)
  useEffect(() => {
    const interval = window.setInterval(() => {
      fetchAuditLogs();
    }, 30_000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchAuditLogs]);

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

  const formatTableName = (name: string) => {
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getChangedFields = (entry: AuditLogEntry): string[] => {
    const oldVals = entry.old_values as Record<string, unknown> | null;
    const newVals = entry.new_values as Record<string, unknown> | null;
    
    if (entry.operation === "INSERT" && newVals) {
      return Object.keys(newVals).filter(
        (key) => !["id", "created_at", "updated_at", "user_id"].includes(key)
      );
    }
    if (entry.operation === "DELETE" && oldVals) {
      return Object.keys(oldVals).filter(
        (key) => !["id", "created_at", "updated_at", "user_id"].includes(key)
      );
    }
    if (entry.operation === "UPDATE" && oldVals && newVals) {
      const changedFields: string[] = [];
      for (const key of Object.keys(newVals)) {
        if (JSON.stringify(oldVals[key]) !== JSON.stringify(newVals[key])) {
          changedFields.push(key);
        }
      }
      return changedFields;
    }
    return [];
  };

  const renderValue = (value: unknown): string => {
    if (value === null || value === undefined) return "null";
    if (typeof value === "string") {
      return value.length > 50 ? value.substring(0, 50) + "..." : value;
    }
    if (typeof value === "object") {
      const str = JSON.stringify(value);
      return str.length > 50 ? str.substring(0, 50) + "..." : str;
    }
    return String(value);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Security Audit Log
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger className="w-[180px] h-8 text-sm">
                <SelectValue placeholder="Filter by table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tables</SelectItem>
                {SENSITIVE_TABLES.map((table) => (
                  <SelectItem key={table} value={table}>
                    {formatTableName(table)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              onClick={fetchAuditLogs}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
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
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No audit log entries found</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-2">
              {entries.map((entry) => {
                const config = operationConfig[entry.operation] || operationConfig.UPDATE;
                const Icon = config.icon;
                const isExpanded = expandedIds.has(entry.id);
                const changedFields = getChangedFields(entry);

                return (
                  <div
                    key={entry.id}
                    className="border rounded-lg p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div
                      className="flex items-start gap-3 cursor-pointer"
                      onClick={() => toggleExpand(entry.id)}
                    >
                      <div
                        className={cn(
                          "p-2 rounded-full border",
                          config.color
                        )}
                      >
                        <Icon className="h-3 w-3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs font-normal">
                            {formatTableName(entry.table_name)}
                          </Badge>
                          <span className="text-sm font-medium">{config.label}</span>
                          {changedFields.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              ({changedFields.length} field{changedFields.length !== 1 ? "s" : ""})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {entry.user_id.substring(0, 8)}...
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
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

                    {isExpanded && changedFields.length > 0 && (() => {
                      const oldVals = entry.old_values as Record<string, unknown> | null;
                      const newVals = entry.new_values as Record<string, unknown> | null;
                      return (
                        <div className="mt-3 pt-3 border-t">
                          <div className="text-xs font-medium text-muted-foreground mb-2">
                            Changes:
                          </div>
                          <div className="space-y-1.5">
                            {changedFields.slice(0, 5).map((field) => (
                              <div
                                key={field}
                                className="text-xs bg-muted/50 rounded px-2 py-1.5"
                              >
                                <span className="font-medium">{field}:</span>{" "}
                                {entry.operation === "UPDATE" && oldVals && newVals ? (
                                  <>
                                    <span className="text-red-600 line-through">
                                      {renderValue(oldVals[field])}
                                    </span>
                                    {" → "}
                                    <span className="text-green-600">
                                      {renderValue(newVals[field])}
                                    </span>
                                  </>
                                ) : entry.operation === "INSERT" && newVals ? (
                                  <span className="text-green-600">
                                    {renderValue(newVals[field])}
                                  </span>
                                ) : entry.operation === "DELETE" && oldVals ? (
                                  <span className="text-red-600">
                                    {renderValue(oldVals[field])}
                                  </span>
                                ) : null}
                              </div>
                            ))}
                            {changedFields.length > 5 && (
                              <div className="text-xs text-muted-foreground px-2">
                                +{changedFields.length - 5} more fields
                              </div>
                            )}
                          </div>
                          <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
                            <span className="font-medium">Record ID:</span>{" "}
                            {entry.record_id || "N/A"}
                            <span className="mx-2">•</span>
                            <span className="font-medium">Time:</span>{" "}
                            {format(new Date(entry.created_at), "PPpp")}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminAuditLogWidget;
