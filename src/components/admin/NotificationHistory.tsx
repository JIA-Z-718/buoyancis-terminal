import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNewItemHighlight } from "@/hooks/useNewItemHighlight";
import { useHighlightSettings } from "@/hooks/useHighlightSettings";
import { playCompletionSound } from "@/lib/alertSound";
import { showCompletionNotification, getNotificationPermission, requestNotificationPermission, isNotificationSupported } from "@/lib/browserNotifications";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { ChevronDown, ChevronUp, History, Loader2, RefreshCw, Trash2, UserPlus, AlertTriangle, Bell, CheckCircle, XCircle, Filter, X, Download, ChevronLeft, ChevronRight, Search, RotateCcw, Mail, Clock, User, BellRing, BellOff } from "lucide-react";
import { format, subDays, startOfDay, isAfter } from "date-fns";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface NotificationRecord {
  id: string;
  notification_type: string;
  recipients: string[];
  subject: string | null;
  status: string;
  error_message: string | null;
  triggered_by: string | null;
  created_at: string;
}

interface RetryAttempt {
  attemptNumber: number;
  success: boolean;
  errorMessage?: string;
  delayMs?: number;
}

interface RetryLogEntry {
  notificationId: string;
  notificationType: string;
  recipients: string[];
  finalStatus: 'success' | 'failed' | 'skipped';
  attempts: RetryAttempt[];
  totalAttempts: number;
  timestamp: string;
}

type TypeFilter = "all" | "signup" | "error" | "alert";
type StatusFilter = "all" | "sent" | "failed";
type DateFilter = "all" | "today" | "7days" | "30days";

const NotificationHistory = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [confirmResendNotification, setConfirmResendNotification] = useState<NotificationRecord | null>(null);
  const [showBulkResendDialog, setShowBulkResendDialog] = useState(false);
  const [bulkResending, setBulkResending] = useState(false);
  const [bulkResendProgress, setBulkResendProgress] = useState({ current: 0, total: 0, currentType: "" });
  const [selectedFailedIds, setSelectedFailedIds] = useState<Set<string>>(new Set());
  const cancelBulkResendRef = useRef(false);
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default'>('default');
  const [retryLog, setRetryLog] = useState<RetryLogEntry[]>([]);
  const [showRetryLog, setShowRetryLog] = useState(false);
  
  const { toast } = useToast();
  const { settings: highlightSettings } = useHighlightSettings();
  const { isHighlighted } = useNewItemHighlight(notifications, {
    highlightDuration: highlightSettings.notifications,
  });

  // Check notification permission on mount
  useEffect(() => {
    if (isNotificationSupported()) {
      setNotificationPermission(getNotificationPermission());
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from("notification_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error: any) {
      console.error("Error fetching notification history:", error);
      toast({
        title: "Error",
        description: "Failed to load notification history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);


  // Real-time subscription for notification updates
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel('notification-history-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_history',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as NotificationRecord;
            setNotifications((prev) => [newNotification, ...prev].slice(0, 100));
            toast({
              title: "New notification",
              description: `${newNotification.notification_type} notification ${newNotification.status}`,
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as NotificationRecord;
            setNotifications((prev) =>
              prev.map((n) => (n.id === updated.id ? updated : n))
            );
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as { id: string };
            setNotifications((prev) => prev.filter((n) => n.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, toast]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const handleClearHistory = async () => {
    if (!confirm("Are you sure you want to clear all notification history?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("notification_history")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (error) throw error;

      setNotifications([]);
      toast({
        title: "History cleared",
        description: "All notification history has been deleted.",
      });
    } catch (error: any) {
      console.error("Error clearing history:", error);
      toast({
        title: "Error",
        description: "Failed to clear notification history",
        variant: "destructive",
      });
    }
  };

  const handleExportCSV = () => {
    if (filteredNotifications.length === 0) {
      toast({
        title: "Nothing to export",
        description: "No notifications match your current filters.",
        variant: "destructive",
      });
      return;
    }

    // CSV header
    const headers = ["Type", "Recipients", "Subject", "Status", "Error Message", "Sent At"];
    
    // CSV rows
    const rows = filteredNotifications.map((n) => [
      n.notification_type,
      n.recipients.join("; "),
      n.subject || "",
      n.status,
      n.error_message || "",
      format(new Date(n.created_at), "yyyy-MM-dd HH:mm:ss"),
    ]);

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    // Build CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map(escapeCSV).join(",")),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `notification-history-${format(new Date(), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${filteredNotifications.length} notifications to CSV.`,
    });
  };

  // Retry with exponential backoff helper - now returns detailed attempt log
  const retryWithBackoff = async (
    fn: () => Promise<{ error: any }>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<{ error: any; attempts: number; attemptLog: RetryAttempt[] }> => {
    let lastError: any = null;
    const attemptLog: RetryAttempt[] = [];
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const result = await fn();
      
      if (!result.error) {
        attemptLog.push({
          attemptNumber: attempt + 1,
          success: true,
        });
        return { error: null, attempts: attempt + 1, attemptLog };
      }
      
      lastError = result.error;
      const errorMessage = typeof lastError === 'string' 
        ? lastError 
        : lastError?.message || lastError?.msg || JSON.stringify(lastError);
      
      // Calculate delay for logging (won't wait after last attempt)
      const delay = attempt < maxRetries - 1 ? baseDelay * Math.pow(2, attempt) : undefined;
      
      attemptLog.push({
        attemptNumber: attempt + 1,
        success: false,
        errorMessage,
        delayMs: delay,
      });
      
      // Don't wait after the last attempt
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return { error: lastError, attempts: maxRetries, attemptLog };
  };

  const handleResend = async (notification: NotificationRecord) => {
    setResendingId(notification.id);
    try {
      let functionName: string;
      
      switch (notification.notification_type) {
        case "signup":
          functionName = "send-test-signup-notification";
          break;
        case "error":
          functionName = "send-test-error-notification";
          break;
        case "alert":
          functionName = "send-test-alert-email";
          break;
        default:
          throw new Error(`Unknown notification type: ${notification.notification_type}`);
      }

      const { error, attempts } = await retryWithBackoff(
        () => supabase.functions.invoke(functionName),
        3,
        1000
      );
      
      if (error) throw error;

      toast({
        title: "Notification resent",
        description: `Successfully resent ${notification.notification_type} notification${attempts > 1 ? ` (after ${attempts} attempts)` : ""}.`,
      });
    } catch (error: any) {
      console.error("Error resending notification:", error);
      toast({
        title: "Resend failed",
        description: `Failed after 3 attempts: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  // Get all failed notifications for bulk resend
  const failedNotifications = useMemo(() => {
    return notifications.filter(n => n.status === "failed");
  }, [notifications]);

  // Get notifications to resend (selected or all failed)
  const notificationsToResend = useMemo(() => {
    if (selectedFailedIds.size > 0) {
      return failedNotifications.filter(n => selectedFailedIds.has(n.id));
    }
    return failedNotifications;
  }, [failedNotifications, selectedFailedIds]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl+A or Cmd+A - Select all failed notifications
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && failedNotifications.length > 0) {
        e.preventDefault();
        if (selectedFailedIds.size === failedNotifications.length) {
          setSelectedFailedIds(new Set());
        } else {
          setSelectedFailedIds(new Set(failedNotifications.map(n => n.id)));
        }
      }

      // Ctrl+Enter or Cmd+Enter - Open resend dialog for selected/all failed
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && notificationsToResend.length > 0 && !bulkResending) {
        e.preventDefault();
        setShowBulkResendDialog(true);
      }

      // Escape - Clear selection or close dialog
      if (e.key === 'Escape') {
        if (showBulkResendDialog && !bulkResending) {
          setShowBulkResendDialog(false);
        } else if (selectedFailedIds.size > 0) {
          setSelectedFailedIds(new Set());
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, failedNotifications, selectedFailedIds, notificationsToResend, bulkResending, showBulkResendDialog]);

  const toggleFailedSelection = (id: string) => {
    setSelectedFailedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllFailedSelection = () => {
    if (selectedFailedIds.size === failedNotifications.length) {
      setSelectedFailedIds(new Set());
    } else {
      setSelectedFailedIds(new Set(failedNotifications.map(n => n.id)));
    }
  };

  const handleBulkResend = async () => {
    setBulkResending(true);
    cancelBulkResendRef.current = false;
    setBulkResendProgress({ current: 0, total: notificationsToResend.length, currentType: "" });
    setRetryLog([]); // Clear previous log
    let successCount = 0;
    let failCount = 0;
    let wasCancelled = false;
    const newRetryLog: RetryLogEntry[] = [];

    for (let i = 0; i < notificationsToResend.length; i++) {
      // Check for cancellation
      if (cancelBulkResendRef.current) {
        wasCancelled = true;
        break;
      }

      const notification = notificationsToResend[i];
      setBulkResendProgress({ 
        current: i + 1, 
        total: notificationsToResend.length, 
        currentType: notification.notification_type 
      });
      
      try {
        let functionName: string;
        
        switch (notification.notification_type) {
          case "signup":
            functionName = "send-test-signup-notification";
            break;
          case "error":
            functionName = "send-test-error-notification";
            break;
          case "alert":
            functionName = "send-test-alert-email";
            break;
          default:
            failCount++;
            newRetryLog.push({
              notificationId: notification.id,
              notificationType: notification.notification_type,
              recipients: notification.recipients,
              finalStatus: 'skipped',
              attempts: [],
              totalAttempts: 0,
              timestamp: new Date().toISOString(),
            });
            continue;
        }

        // Use retry with exponential backoff
        const { error, attempts, attemptLog } = await retryWithBackoff(
          () => supabase.functions.invoke(functionName),
          3,
          500 // Shorter base delay for bulk operations
        );
        
        const logEntry: RetryLogEntry = {
          notificationId: notification.id,
          notificationType: notification.notification_type,
          recipients: notification.recipients,
          finalStatus: error ? 'failed' : 'success',
          attempts: attemptLog,
          totalAttempts: attempts,
          timestamp: new Date().toISOString(),
        };
        newRetryLog.push(logEntry);
        
        if (error) {
          failCount++;
        } else {
          successCount++;
        }
      } catch (err: any) {
        failCount++;
        newRetryLog.push({
          notificationId: notification.id,
          notificationType: notification.notification_type,
          recipients: notification.recipients,
          finalStatus: 'failed',
          attempts: [{
            attemptNumber: 1,
            success: false,
            errorMessage: err?.message || 'Unknown error',
          }],
          totalAttempts: 1,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Update retry log state
    setRetryLog(newRetryLog);
    // Show log if there were any failures
    if (failCount > 0) {
      setShowRetryLog(true);
    }

    setBulkResending(false);
    setBulkResendProgress({ current: 0, total: 0, currentType: "" });
    setShowBulkResendDialog(false);
    setSelectedFailedIds(new Set());

    if (wasCancelled) {
      const title = "Bulk resend cancelled";
      const description = `Stopped after resending ${successCount} notification${successCount !== 1 ? "s" : ""}${failCount > 0 ? ` (${failCount} failed)` : ""}.`;
      playCompletionSound('partial');
      showCompletionNotification({ title, body: description, type: 'partial' });
      toast({ title, description });
    } else if (failCount > 0 && successCount === 0) {
      const title = "Bulk resend failed";
      const description = `All ${failCount} notification${failCount !== 1 ? "s" : ""} failed to resend.`;
      playCompletionSound('failure');
      showCompletionNotification({ title, body: description, type: 'failure' });
      toast({ title, description, variant: "destructive" });
    } else if (failCount > 0) {
      const title = "Bulk resend complete";
      const description = `Successfully resent ${successCount} notification${successCount !== 1 ? "s" : ""}, ${failCount} failed.`;
      playCompletionSound('partial');
      showCompletionNotification({ title, body: description, type: 'partial' });
      toast({ title, description });
    } else {
      const title = "Bulk resend complete";
      const description = `Successfully resent ${successCount} notification${successCount !== 1 ? "s" : ""}.`;
      playCompletionSound('success');
      showCompletionNotification({ title, body: description, type: 'success' });
      toast({ title, description });
    }
  };

  const handleCancelBulkResend = () => {
    cancelBulkResendRef.current = true;
  };


  const clearFilters = () => {
    setTypeFilter("all");
    setStatusFilter("all");
    setDateFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, statusFilter, dateFilter, searchQuery]);

  const hasActiveFilters = typeFilter !== "all" || statusFilter !== "all" || dateFilter !== "all" || searchQuery.trim() !== "";

  const filteredNotifications = useMemo(() => {
    const searchLower = searchQuery.trim().toLowerCase();
    
    return notifications.filter((notification) => {
      // Search filter - check recipients and subject
      if (searchLower) {
        const matchesRecipient = notification.recipients.some(r => 
          r.toLowerCase().includes(searchLower)
        );
        const matchesSubject = notification.subject?.toLowerCase().includes(searchLower);
        if (!matchesRecipient && !matchesSubject) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== "all" && notification.notification_type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== "all" && notification.status !== statusFilter) {
        return false;
      }

      // Date filter
      if (dateFilter !== "all") {
        const notificationDate = new Date(notification.created_at);
        const now = new Date();
        
        switch (dateFilter) {
          case "today":
            if (!isAfter(notificationDate, startOfDay(now))) {
              return false;
            }
            break;
          case "7days":
            if (!isAfter(notificationDate, subDays(now, 7))) {
              return false;
            }
            break;
          case "30days":
            if (!isAfter(notificationDate, subDays(now, 30))) {
              return false;
            }
            break;
        }
      }

      return true;
    });
  }, [notifications, typeFilter, statusFilter, dateFilter, searchQuery]);

  // Pagination calculations (must be after filteredNotifications)
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "signup":
        return <UserPlus className="h-4 w-4 text-primary" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case "alert":
        return <Bell className="h-4 w-4 text-warning" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      signup: "default",
      error: "destructive",
      alert: "secondary",
    };
    return (
      <Badge variant={variants[type] || "outline"} className="gap-1.5">
        {getTypeIcon(type)}
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  const getStatusIcon = (status: string) => {
    if (status === "sent") {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return <XCircle className="h-4 w-4 text-destructive" />;
  };

  const formatRecipients = (recipients: string[]) => {
    if (recipients.length === 1) {
      return recipients[0];
    }
    return `${recipients[0]} +${recipients.length - 1} more`;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-lg">Notification History</CardTitle>
                  <CardDescription>
                    View all sent admin notifications
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <Badge variant="secondary">{notifications.length}</Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Filter className="h-4 w-4" />
                    <span className="font-medium">Filters:</span>
                  </div>
                  
                  <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="signup">
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-3.5 w-3.5" />
                          Signup
                        </div>
                      </SelectItem>
                      <SelectItem value="error">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Error
                        </div>
                      </SelectItem>
                      <SelectItem value="alert">
                        <div className="flex items-center gap-2">
                          <Bell className="h-3.5 w-3.5" />
                          Alert
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
                    <SelectTrigger className="w-[120px] h-8">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="sent">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                          Sent
                        </div>
                      </SelectItem>
                      <SelectItem value="failed">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                          Failed
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {failedNotifications.length > 0 && (
                    <Button
                      variant={statusFilter === "failed" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(statusFilter === "failed" ? "all" : "failed")}
                      className="h-8 gap-1.5"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Failed Only ({failedNotifications.length})
                    </Button>
                  )}

                  <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="7days">Last 7 Days</SelectItem>
                      <SelectItem value="30days">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by email or subject..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 pl-8 text-sm"
                    />
                  </div>

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear
                    </Button>
                  )}

                  <div className="flex-1" />

                  {/* Browser Notification Permission Button */}
                  {isNotificationSupported() && (
                    <Button
                      variant={notificationPermission === 'granted' ? "outline" : "secondary"}
                      size="sm"
                      onClick={async () => {
                        if (notificationPermission === 'granted') {
                          toast({
                            title: "Notifications enabled",
                            description: "Browser notifications are already enabled for bulk resend alerts.",
                          });
                        } else {
                          const permission = await requestNotificationPermission();
                          setNotificationPermission(permission);
                          if (permission === 'granted') {
                            toast({
                              title: "Notifications enabled",
                              description: "You'll receive browser notifications when bulk resend completes in the background.",
                            });
                          } else if (permission === 'denied') {
                            toast({
                              title: "Notifications blocked",
                              description: "Please enable notifications in your browser settings.",
                              variant: "destructive",
                            });
                          }
                        }
                      }}
                      className="h-8 gap-1.5"
                      title={notificationPermission === 'granted' ? "Browser notifications enabled" : "Enable browser notifications"}
                    >
                      {notificationPermission === 'granted' ? (
                        <BellRing className="h-3.5 w-3.5 text-green-500" />
                      ) : notificationPermission === 'denied' ? (
                        <BellOff className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <Bell className="h-3.5 w-3.5" />
                      )}
                      {notificationPermission === 'granted' ? "Notifications On" : "Enable Notifications"}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="h-8 gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>

                  {filteredNotifications.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      className="h-8 gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Export
                    </Button>
                  )}
                  
                  {failedNotifications.length > 0 && (
                    <>
                      {selectedFailedIds.size > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFailedIds(new Set())}
                          className="h-8 gap-1.5 text-muted-foreground"
                        >
                          <X className="h-3.5 w-3.5" />
                          Clear selection ({selectedFailedIds.size})
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkResendDialog(true)}
                        disabled={bulkResending}
                        className="h-8 gap-1.5"
                        title="Resend failed notifications (Ctrl+Enter)"
                      >
                        {bulkResending ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        {selectedFailedIds.size > 0 
                          ? `Resend Selected (${selectedFailedIds.size})`
                          : `Resend All Failed (${failedNotifications.length})`
                        }
                        <kbd className="ml-1 hidden sm:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                          ⌘↵
                        </kbd>
                      </Button>
                    </>
                  )}
                  
                  {notifications.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearHistory}
                      className="h-8 gap-1.5 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Clear All
                    </Button>
                  )}
                </div>

                {/* Retry Log Section */}
                {retryLog.length > 0 && (
                  <Collapsible open={showRetryLog} onOpenChange={setShowRetryLog}>
                    <div className="rounded-lg border bg-muted/30">
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-between p-3 h-auto hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">Retry Log</span>
                            <Badge variant="secondary" className="ml-2">
                              {retryLog.length} {retryLog.length === 1 ? 'entry' : 'entries'}
                            </Badge>
                            {retryLog.filter(e => e.finalStatus === 'failed').length > 0 && (
                              <Badge variant="destructive">
                                {retryLog.filter(e => e.finalStatus === 'failed').length} failed
                              </Badge>
                            )}
                          </div>
                          {showRetryLog ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3 pt-0 space-y-2 max-h-[400px] overflow-y-auto">
                          {retryLog.map((entry, index) => (
                            <div
                              key={`${entry.notificationId}-${index}`}
                              className={`rounded-md border p-3 text-sm ${
                                entry.finalStatus === 'success' 
                                  ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' 
                                  : entry.finalStatus === 'failed'
                                  ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800'
                                  : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2">
                                  {entry.finalStatus === 'success' ? (
                                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                  ) : entry.finalStatus === 'failed' ? (
                                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                  ) : (
                                    <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {entry.notificationType}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {entry.totalAttempts} attempt{entry.totalAttempts !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(entry.timestamp), "HH:mm:ss")}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground mb-2">
                                To: {entry.recipients.slice(0, 2).join(", ")}
                                {entry.recipients.length > 2 && ` +${entry.recipients.length - 2} more`}
                              </div>
                              {entry.attempts.length > 0 && (
                                <div className="space-y-1 mt-2 pt-2 border-t border-dashed">
                                  {entry.attempts.map((attempt, aIdx) => (
                                    <div
                                      key={aIdx}
                                      className={`flex items-start gap-2 text-xs ${
                                        attempt.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                                      }`}
                                    >
                                      <span className="font-mono w-16 shrink-0">
                                        Attempt {attempt.attemptNumber}:
                                      </span>
                                      {attempt.success ? (
                                        <span className="text-green-600 dark:text-green-400">✓ Success</span>
                                      ) : (
                                        <div className="flex-1">
                                          <span className="text-red-600 dark:text-red-400">✗ Failed</span>
                                          {attempt.errorMessage && (
                                            <p className="text-muted-foreground mt-0.5 break-all">
                                              {attempt.errorMessage}
                                            </p>
                                          )}
                                          {attempt.delayMs && (
                                            <p className="text-muted-foreground/70 mt-0.5">
                                              Waited {attempt.delayMs}ms before retry
                                            </p>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                              {entry.finalStatus === 'skipped' && (
                                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                                  Skipped: Unsupported notification type
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="p-3 pt-0 flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setRetryLog([]);
                              setShowRetryLog(false);
                            }}
                            className="text-muted-foreground"
                          >
                            <X className="h-3.5 w-3.5 mr-1" />
                            Clear Log
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}

                {/* Results summary */}
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <p>
                    Showing {filteredNotifications.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredNotifications.length)} of {filteredNotifications.length} notifications
                    {hasActiveFilters && " (filtered)"}
                  </p>
                  <div className="flex items-center gap-2">
                    <span>Per page:</span>
                    <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                      <SelectTrigger className="w-[70px] h-7">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    {hasActiveFilters ? (
                      <>
                        <p>No notifications match your filters</p>
                        <Button variant="link" onClick={clearFilters} className="mt-2">
                          Clear filters
                        </Button>
                      </>
                    ) : (
                      <>
                        <p>No notifications sent yet</p>
                        <p className="text-sm">
                          Notifications will appear here once you start sending them.
                        </p>
                      </>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            {failedNotifications.length > 0 && (
                              <TableHead className="w-[70px]">
                                <div className="flex items-center gap-1.5" title="Select all failed (Ctrl+A)">
                                  <Checkbox
                                    checked={selectedFailedIds.size === failedNotifications.length && failedNotifications.length > 0}
                                    onCheckedChange={toggleAllFailedSelection}
                                    aria-label="Select all failed"
                                  />
                                  <kbd className="hidden sm:inline-flex h-4 items-center rounded border bg-muted px-1 font-mono text-[9px] font-medium text-muted-foreground">
                                    ⌘A
                                  </kbd>
                                </div>
                              </TableHead>
                            )}
                            <TableHead className="w-[100px]">Type</TableHead>
                            <TableHead>Recipients</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead className="w-[80px]">Status</TableHead>
                            <TableHead className="w-[160px]">Sent At</TableHead>
                            <TableHead className="w-[80px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedNotifications.map((notification) => (
                            <TableRow 
                              key={notification.id} 
                              className={cn(
                                selectedFailedIds.has(notification.id) && "bg-muted/50",
                                isHighlighted(notification.id) && "animate-highlight-new"
                              )}
                            >
                              {failedNotifications.length > 0 && (
                                <TableCell>
                                  {notification.status === "failed" ? (
                                    <Checkbox
                                      checked={selectedFailedIds.has(notification.id)}
                                      onCheckedChange={() => toggleFailedSelection(notification.id)}
                                      aria-label="Select notification"
                                    />
                                  ) : (
                                    <span className="w-4" />
                                  )}
                                </TableCell>
                              )}
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {getTypeBadge(notification.notification_type)}
                                  {isHighlighted(notification.id) && (
                                    <Badge variant="default" className="animate-fade-in text-[10px] px-1.5 py-0 h-4">
                                      New
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="font-mono text-sm">
                                <span title={notification.recipients.join(", ")}>
                                  {formatRecipients(notification.recipients)}
                                </span>
                              </TableCell>
                              <TableCell className="max-w-[200px] truncate">
                                {notification.subject || "-"}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5" title={notification.error_message || undefined}>
                                  {getStatusIcon(notification.status)}
                                  <span className="text-sm capitalize">{notification.status}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(notification.created_at), "MMM d, h:mm a")}
                              </TableCell>
                              <TableCell>
                                {notification.status === "failed" && (
                                  <HoverCard>
                                    <HoverCardTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setConfirmResendNotification(notification)}
                                        disabled={resendingId === notification.id}
                                        className="h-7 px-2 text-muted-foreground hover:text-foreground"
                                        title="Resend this notification"
                                      >
                                        {resendingId === notification.id ? (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                          <RotateCcw className="h-3.5 w-3.5" />
                                        )}
                                      </Button>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="w-80" side="left" align="start">
                                      <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                          <h4 className="text-sm font-semibold">Notification Details</h4>
                                          {getTypeBadge(notification.notification_type)}
                                        </div>
                                        <Separator />
                                        <div className="space-y-2 text-sm">
                                          <div className="flex items-start gap-2">
                                            <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <div>
                                              <p className="font-medium text-muted-foreground">Recipients</p>
                                              <p className="font-mono text-xs break-all">
                                                {notification.recipients.join(", ")}
                                              </p>
                                            </div>
                                          </div>
                                          {notification.subject && (
                                            <div className="flex items-start gap-2">
                                              <Bell className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                              <div>
                                                <p className="font-medium text-muted-foreground">Subject</p>
                                                <p>{notification.subject}</p>
                                              </div>
                                            </div>
                                          )}
                                          <div className="flex items-start gap-2">
                                            <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                            <div>
                                              <p className="font-medium text-muted-foreground">Sent At</p>
                                              <p>{format(new Date(notification.created_at), "PPpp")}</p>
                                            </div>
                                          </div>
                                          {notification.error_message && (
                                            <div className="flex items-start gap-2">
                                              <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                                              <div>
                                                <p className="font-medium text-destructive">Error</p>
                                                <p className="text-xs text-muted-foreground break-all">
                                                  {notification.error_message}
                                                </p>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                        <Separator />
                                        <p className="text-xs text-muted-foreground">
                                          Click to resend this notification
                                        </p>
                                      </div>
                                    </HoverCardContent>
                                  </HoverCard>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination controls */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <p className="text-sm text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(1)}
                            disabled={currentPage === 1}
                            className="h-8 px-2"
                          >
                            First
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          
                          {/* Page number buttons */}
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum: number;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => goToPage(pageNum)}
                                  className="h-8 w-8 p-0"
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="h-8 w-8 p-0"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => goToPage(totalPages)}
                            disabled={currentPage === totalPages}
                            className="h-8 px-2"
                          >
                            Last
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>

      {/* Resend confirmation dialog */}
      <AlertDialog 
        open={!!confirmResendNotification} 
        onOpenChange={(open) => !open && setConfirmResendNotification(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend notification?</AlertDialogTitle>
            <AlertDialogDescription>
              This will resend the {confirmResendNotification?.notification_type} notification to{" "}
              <span className="font-medium">
                {confirmResendNotification?.recipients.join(", ")}
              </span>
              . A new notification entry will be created.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmResendNotification) {
                  handleResend(confirmResendNotification);
                  setConfirmResendNotification(null);
                }
              }}
            >
              Resend
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk resend confirmation dialog */}
      <AlertDialog 
        open={showBulkResendDialog} 
        onOpenChange={(open) => !bulkResending && setShowBulkResendDialog(open)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkResending 
                ? "Resending notifications..." 
                : selectedFailedIds.size > 0 
                  ? `Resend ${selectedFailedIds.size} selected notification${selectedFailedIds.size !== 1 ? "s" : ""}?`
                  : "Resend all failed notifications?"
              }
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {bulkResending ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>
                          Processing {bulkResendProgress.current} of {bulkResendProgress.total}
                        </span>
                        <span className="text-muted-foreground">
                          {Math.round((bulkResendProgress.current / bulkResendProgress.total) * 100)}%
                        </span>
                      </div>
                      <Progress 
                        value={(bulkResendProgress.current / bulkResendProgress.total) * 100} 
                        className="h-2"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Currently resending: <span className="font-medium capitalize">{bulkResendProgress.currentType}</span> notification
                    </p>
                  </>
                ) : (
                  <p>
                    This will attempt to resend <span className="font-medium">{notificationsToResend.length}</span> {selectedFailedIds.size > 0 ? "selected" : "failed"} notification{notificationsToResend.length !== 1 ? "s" : ""}. 
                    New notification entries will be created for each attempt.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {bulkResending ? (
              <Button variant="destructive" onClick={handleCancelBulkResend}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            ) : (
              <>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleBulkResend}>
                  Resend {selectedFailedIds.size > 0 ? "Selected" : "All"} ({notificationsToResend.length})
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Collapsible>
  );
};

export default NotificationHistory;
