import { useState, useEffect } from "react";
import { RefreshCw, Check, ChevronDown, XCircle, CheckCircle2, Clock, AlertTriangle, Trash2, Download, FileJson, FileSpreadsheet } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export interface SyncHistoryEntry {
  id: string;
  timestamp: Date;
  success: boolean;
  message?: string;
}

interface SyncIndicatorProps {
  lastSyncedAt: Date;
  /** Duration in ms to show the "just synced" state (default: 3000) */
  recentThresholdMs?: number;
  /** Show text label alongside the indicator */
  showLabel?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Optional sync history for dropdown */
  syncHistory?: SyncHistoryEntry[];
  /** Callback when retry button is clicked */
  onRetry?: () => void;
  /** Callback when clear history is confirmed */
  onClearHistory?: () => void;
  /** Whether a sync error occurred */
  hasError?: boolean;
  /** Error message to display */
  errorMessage?: string;
}

/**
 * Animated sync indicator that pulses briefly when data was recently synced.
 * Shows a checkmark with pulse animation for recent syncs, then transitions
 * to a subtle dot indicator. Optionally shows sync history in a dropdown.
 * Shows toast notification with retry button on sync failure.
 */
export default function SyncIndicator({
  lastSyncedAt,
  recentThresholdMs = 3000,
  showLabel = false,
  className = "",
  size = "sm",
  syncHistory = [],
  onRetry,
  onClearHistory,
  hasError = false,
  errorMessage,
}: SyncIndicatorProps) {
  const { toast } = useToast();
  const [isRecentlysynced, setIsRecentlySynced] = useState(false);
  const [showPulse, setShowPulse] = useState(false);

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const dotSizeClasses = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  useEffect(() => {
    const timeSinceSync = Date.now() - lastSyncedAt.getTime();
    const wasRecentlySynced = timeSinceSync < recentThresholdMs;

    if (wasRecentlySynced) {
      setIsRecentlySynced(true);
      setShowPulse(true);

      // Remove pulse after animation completes
      const pulseTimer = setTimeout(() => {
        setShowPulse(false);
      }, 1500);

      // Remove "recently synced" state after threshold
      const recentTimer = setTimeout(() => {
        setIsRecentlySynced(false);
      }, recentThresholdMs - timeSinceSync);

      return () => {
        clearTimeout(pulseTimer);
        clearTimeout(recentTimer);
      };
    } else {
      setIsRecentlySynced(false);
      setShowPulse(false);
    }
  }, [lastSyncedAt, recentThresholdMs]);

  // Show toast notification when sync fails
  useEffect(() => {
    if (hasError && onRetry) {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: (
          <div className="flex flex-col gap-2">
            <p>{errorMessage || "Failed to sync data. Please try again."}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onRetry();
              }}
              className="w-fit bg-background hover:bg-muted"
            >
              <RefreshCw className="h-3 w-3 mr-1.5" />
              Retry
            </Button>
          </div>
        ),
      });
    }
  }, [hasError, errorMessage, onRetry, toast]);

  const indicator = (
    <div className="relative">
      {hasError ? (
        /* Error indicator */
        <AlertTriangle
          className={cn(
            "text-destructive animate-pulse",
            sizeClasses[size]
          )}
        />
      ) : isRecentlysynced ? (
        <>
          {/* Pulse ring animation */}
          {showPulse && (
            <span
              className={cn(
                "absolute inset-0 rounded-full bg-green-500/30 animate-ping",
                sizeClasses[size]
              )}
            />
          )}
          {/* Checkmark icon */}
          <Check
            className={cn(
              "relative text-green-600 dark:text-green-400 transition-all duration-300",
              sizeClasses[size],
              showPulse && "scale-110"
            )}
          />
        </>
      ) : (
        /* Idle dot indicator */
        <span
          className={cn(
            "block rounded-full bg-muted-foreground/40 transition-colors",
            dotSizeClasses[size]
          )}
        />
      )}
    </div>
  );

  const displayedHistory = syncHistory.slice(0, 5);
  const hasHistory = displayedHistory.length > 0;

  const exportAsJSON = () => {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalEntries: syncHistory.length,
      entries: syncHistory.map((entry) => ({
        ...entry,
        timestamp: entry.timestamp.toISOString(),
        formattedTimestamp: format(entry.timestamp, "PPpp"),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sync-history-${format(new Date(), "yyyy-MM-dd-HHmmss")}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${syncHistory.length} sync entries as JSON`,
    });
  };

  const exportAsCSV = () => {
    const headers = ["ID", "Timestamp", "Success", "Message"];
    const rows = syncHistory.map((entry) => [
      entry.id,
      format(entry.timestamp, "yyyy-MM-dd HH:mm:ss"),
      entry.success ? "Yes" : "No",
      entry.message || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sync-history-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${syncHistory.length} sync entries as CSV`,
    });
  };

  const getStatusLabel = () => {
    if (hasError) return "Error";
    if (isRecentlysynced) return "Synced";
    return "Idle";
  };

  const getStatusColor = () => {
    if (hasError) return "text-destructive font-medium";
    if (isRecentlysynced) return "text-green-600 dark:text-green-400 font-medium";
    return "text-muted-foreground";
  };

  if (!hasHistory) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        {indicator}
        {showLabel && (
          <span className={cn("text-xs transition-colors duration-300", getStatusColor())}>
            {getStatusLabel()}
          </span>
        )}
        {hasError && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-6 px-2 text-xs text-destructive hover:text-destructive"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 hover:bg-muted/50 rounded px-1.5 py-1 -mx-1.5 -my-1 transition-colors",
            className
          )}
        >
          {indicator}
          {showLabel && (
            <span className={cn("text-xs transition-colors duration-300", getStatusColor())}>
              {getStatusLabel()}
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <div className="px-3 py-2 border-b border-border flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Sync History</p>
            <p className="text-xs text-muted-foreground">Last 5 sync attempts</p>
          </div>
          {syncHistory.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-7 px-2">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={exportAsJSON}>
                  <FileJson className="h-4 w-4 mr-2" />
                  Export JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportAsCSV}>
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <ScrollArea className="max-h-64">
          <div className="p-1">
            {displayedHistory.map((entry) => (
              <div
                key={entry.id}
                className={cn(
                  "flex items-start gap-3 p-2 rounded-md",
                  entry.success
                    ? "hover:bg-green-50/50 dark:hover:bg-green-950/20"
                    : "hover:bg-red-50/50 dark:hover:bg-red-950/20"
                )}
              >
                <div className="mt-0.5">
                  {entry.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        entry.success
                          ? "text-green-700 dark:text-green-300"
                          : "text-destructive"
                      )}
                    >
                      {entry.success ? "Success" : "Failed"}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span title={format(entry.timestamp, "PPpp")}>
                        {formatDistanceToNow(entry.timestamp, { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  {entry.message && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {entry.message}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
        {onClearHistory && displayedHistory.length > 0 && (
          <div className="p-2 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Clear History
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear Sync History?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {displayedHistory.length} sync history entries. 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={onClearHistory}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Clear History
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface SyncStatusProps {
  status: "idle" | "syncing" | "success" | "error";
  className?: string;
  size?: "sm" | "md" | "lg";
}

/**
 * Multi-state sync status indicator with animations for each state.
 */
export function SyncStatus({ status, className = "", size = "sm" }: SyncStatusProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const dotSizeClasses = {
    sm: "w-2 h-2",
    md: "w-2.5 h-2.5",
    lg: "w-3 h-3",
  };

  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      {status === "syncing" && (
        <RefreshCw
          className={cn(
            "text-primary animate-spin",
            sizeClasses[size]
          )}
        />
      )}

      {status === "success" && (
        <>
          <span
            className={cn(
              "absolute rounded-full bg-green-500/30 animate-ping",
              sizeClasses[size]
            )}
          />
          <Check
            className={cn(
              "relative text-green-600 dark:text-green-400",
              sizeClasses[size]
            )}
          />
        </>
      )}

      {status === "error" && (
        <span
          className={cn(
            "block rounded-full bg-destructive animate-pulse",
            dotSizeClasses[size]
          )}
        />
      )}

      {status === "idle" && (
        <span
          className={cn(
            "block rounded-full bg-muted-foreground/40",
            dotSizeClasses[size]
          )}
        />
      )}
    </div>
  );
}
