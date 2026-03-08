import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw, Trash2, Download, FileText, CheckCircle2, XCircle, Clock, TrendingUp, PieChart } from "lucide-react";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CleanupTrendsChart from "./CleanupTrendsChart";
import CleanupTableBreakdown from "./CleanupTableBreakdown";

interface CleanupLogEntry {
  id: string;
  notification_type: string;
  subject: string | null;
  status: string;
  created_at: string;
  error_message: string | null;
}

interface CleanupHistoryLogProps {
  className?: string;
}

export default function CleanupHistoryLog({ className }: CleanupHistoryLogProps) {
  const [logs, setLogs] = useState<CleanupLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("notification_history")
        .select("id, notification_type, subject, status, created_at, error_message")
        .in("notification_type", ["data_retention_cleanup", "export_cleanup"])
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error("Error fetching cleanup history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const parseRecordCount = (subject: string | null): number | null => {
    if (!subject) return null;
    const match = subject.match(/(\d+)\s*record/i) || subject.match(/(\d+)\s*file/i);
    return match ? parseInt(match[1], 10) : null;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
      case "sent":
        return (
          <Badge variant="default" className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Success
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="w-3 h-3 mr-1" />
            {status}
          </Badge>
        );
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "data_retention_cleanup":
        return <Trash2 className="w-4 h-4 text-orange-500" />;
      case "export_cleanup":
        return <FileText className="w-4 h-4 text-blue-500" />;
      default:
        return <Trash2 className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case "data_retention_cleanup":
        return "Data Retention";
      case "export_cleanup":
        return "Export Cleanup";
      default:
        return type;
    }
  };

  const exportLogs = () => {
    const headers = ["Date", "Type", "Description", "Records", "Status"];
    const rows = logs.map(log => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      getTypeName(log.notification_type),
      log.subject || "",
      parseRecordCount(log.subject)?.toString() || "",
      log.status
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `cleanup-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  // Calculate summary stats
  const totalRecordsDeleted = logs
    .filter(log => log.notification_type === "data_retention_cleanup")
    .reduce((sum, log) => sum + (parseRecordCount(log.subject) || 0), 0);

  const totalFilesDeleted = logs
    .filter(log => log.notification_type === "export_cleanup")
    .reduce((sum, log) => sum + (parseRecordCount(log.subject) || 0), 0);

  const successfulRuns = logs.filter(log => log.status === "success" || log.status === "sent").length;

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          View history of automatic and manual cleanup operations.
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportLogs}
            disabled={logs.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold">{logs.length}</div>
          <div className="text-sm text-muted-foreground">Total Cleanup Runs</div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-orange-600">{totalRecordsDeleted.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Records Deleted</div>
        </div>
        <div className="p-4 bg-muted/50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{totalFilesDeleted.toLocaleString()}</div>
          <div className="text-sm text-muted-foreground">Files Cleaned Up</div>
        </div>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No cleanup runs recorded yet.</p>
          <p className="text-sm">Cleanup history will appear here after automatic or manual cleanup runs.</p>
        </div>
      ) : (
        <Tabs defaultValue="breakdown" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="breakdown" className="flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              By Table
            </TabsTrigger>
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="log" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              History Log
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="breakdown" className="mt-0">
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium mb-4">Records Deleted by Table</h4>
              <CleanupTableBreakdown logs={logs} />
            </div>
          </TabsContent>
          
          <TabsContent value="chart" className="mt-0">
            <div className="border rounded-lg p-4">
              <h4 className="text-sm font-medium mb-4">Records Deleted Over Time (Last 14 Days)</h4>
              <CleanupTrendsChart logs={logs} daysToShow={14} />
            </div>
          </TabsContent>
          
          <TabsContent value="log" className="mt-0">
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Records</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const recordCount = parseRecordCount(log.subject);
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm">
                          <div className="flex flex-col">
                            <span>{format(new Date(log.created_at), "PPP")}</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(log.created_at), "p")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getTypeIcon(log.notification_type)}
                            <span className="text-sm">{getTypeName(log.notification_type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{log.subject}</span>
                          {log.error_message && (
                            <p className="text-xs text-destructive mt-1">{log.error_message}</p>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {recordCount !== null ? (
                            <Badge variant="outline" className="font-mono">
                              {recordCount.toLocaleString()}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
