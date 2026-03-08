import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Lock, RefreshCw, RotateCcw, Search, X, Clock, AlertTriangle, Users, Loader2, CheckSquare, Download, Play, Pause, FlaskConical, ArrowUpDown, ArrowUp, ArrowDown, Keyboard, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, formatDistanceToNow, subHours, subMinutes, addMinutes } from "date-fns";
import KeyboardShortcutsOverlay, { useKeyboardShortcutsOverlay } from "@/components/KeyboardShortcutsOverlay";

interface RecoveryCodeAttempt {
  id: string;
  user_id: string;
  success: boolean;
  attempted_at: string;
}

interface LockedOutUser {
  user_id: string;
  failed_count: number;
  lockout_expires: Date;
  first_failed_at: string;
  last_failed_at: string;
}

const MAX_MESSAGE_LENGTH = 500;

const LockedOutUsersManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lockedUsers, setLockedUsers] = useState<LockedOutUser[]>([]);
  const [resettingUserId, setResettingUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "expired">("all");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [isBulkUnlocking, setIsBulkUnlocking] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
  const [customMessage, setCustomMessage] = useState("");
  const [bulkCustomMessage, setBulkCustomMessage] = useState("");
  const [singleUnlockUserId, setSingleUnlockUserId] = useState<string | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<30 | 60 | 120>(60);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(60);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [sortField, setSortField] = useState<"failed_count" | "lockout_expires" | "last_failed_at">("failed_count");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [lastClickedUserId, setLastClickedUserId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<10 | 25 | 50 | 100>(10);
  const { isOpen: shortcutsOpen, setIsOpen: setShortcutsOpen } = useKeyboardShortcutsOverlay();
  const { toast } = useToast();

  // Define keyboard shortcuts for this section
  const shortcutGroups = [
    {
      title: "Actions",
      icon: <Lock className="w-4 h-4" />,
      shortcuts: [
        { keys: ["Ctrl", "R"], description: "Refresh locked users list" },
        { keys: ["Shift", "?"], description: "Show keyboard shortcuts" },
      ],
    },
    {
      title: "Selection",
      icon: <CheckSquare className="w-4 h-4" />,
      shortcuts: [
        { keys: ["Click"], description: "Select/deselect single user" },
        { keys: ["Shift", "Click"], description: "Select range of users" },
      ],
    },
    {
      title: "Table Sorting",
      icon: <ArrowUpDown className="w-4 h-4" />,
      shortcuts: [
        { keys: ["Click"], description: "Sort by column header (toggle asc/desc)" },
      ],
    },
    {
      title: "Navigation",
      shortcuts: [
        { keys: ["Tab"], description: "Move to next element" },
        { keys: ["Shift", "Tab"], description: "Move to previous element" },
        { keys: ["Esc"], description: "Close dialogs / modals" },
      ],
    },
  ];

  // Generate mock data for demo/testing purposes
  const generateMockData = (): LockedOutUser[] => {
    const now = new Date();
    return [
      {
        user_id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        failed_count: 15,
        lockout_expires: addMinutes(now, 45), // Active - expires in 45 mins
        first_failed_at: subMinutes(now, 50).toISOString(),
        last_failed_at: subMinutes(now, 15).toISOString(),
      },
      {
        user_id: "b2c3d4e5-f6a7-8901-bcde-f23456789012",
        failed_count: 12,
        lockout_expires: addMinutes(now, 20), // Active - expires in 20 mins
        first_failed_at: subMinutes(now, 55).toISOString(),
        last_failed_at: subMinutes(now, 40).toISOString(),
      },
      {
        user_id: "c3d4e5f6-a7b8-9012-cdef-345678901234",
        failed_count: 10,
        lockout_expires: subMinutes(now, 10), // Expired - 10 mins ago
        first_failed_at: subHours(now, 1.5).toISOString(),
        last_failed_at: subMinutes(now, 70).toISOString(),
      },
      {
        user_id: "d4e5f6a7-b8c9-0123-defa-456789012345",
        failed_count: 11,
        lockout_expires: subMinutes(now, 30), // Expired - 30 mins ago
        first_failed_at: subHours(now, 2).toISOString(),
        last_failed_at: subMinutes(now, 90).toISOString(),
      },
      {
        user_id: "e5f6a7b8-c9d0-1234-efab-567890123456",
        failed_count: 18,
        lockout_expires: addMinutes(now, 5), // Active - expires in 5 mins
        first_failed_at: subMinutes(now, 58).toISOString(),
        last_failed_at: subMinutes(now, 55).toISOString(),
      },
    ];
  };

  const toggleDemoMode = () => {
    if (isDemoMode) {
      // Exit demo mode - fetch real data
      setIsDemoMode(false);
      fetchLockedOutUsers();
      toast({
        title: "Demo Mode Disabled",
        description: "Showing real locked user data",
      });
    } else {
      // Enter demo mode - load mock data
      setIsDemoMode(true);
      setLockedUsers(generateMockData());
      toast({
        title: "Demo Mode Enabled",
        description: "Showing mock data for testing UI",
      });
    }
  };

  // Handle column sorting
  const handleSort = (field: "failed_count" | "lockout_expires" | "last_failed_at") => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  // Get sort icon for column header
  const getSortIcon = (field: "failed_count" | "lockout_expires" | "last_failed_at") => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="w-3.5 h-3.5 ml-1" />
      : <ArrowDown className="w-3.5 h-3.5 ml-1" />;
  };

  // Keyboard shortcut: Ctrl+R to refresh
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+R (or Cmd+R on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === "r") {
        const target = event.target as HTMLElement;
        
        // Don't trigger in inputs/textareas
        if (
          target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable
        ) {
          return;
        }

        event.preventDefault();
        
        if (isDemoMode) {
          setLockedUsers(generateMockData());
          toast({ title: "Demo Data Refreshed", description: "Press Ctrl+R to refresh" });
        } else if (!isLoading && !isBulkUnlocking) {
          fetchLockedOutUsers();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDemoMode, isLoading, isBulkUnlocking]);

  const fetchLockedOutUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch attempts from the last hour to find locked out users
      // A user is locked out if they have 10+ failed attempts in 1 hour
      const oneHourAgo = subHours(new Date(), 1).toISOString();

      const { data, error } = await supabase
        .from("recovery_code_attempts")
        .select("*")
        .eq("success", false)
        .gte("attempted_at", oneHourAgo)
        .order("attempted_at", { ascending: false });

      if (error) throw error;

      const attemptsData = (data || []) as RecoveryCodeAttempt[];

      // Group by user and count failed attempts
      const userFailedCounts: Record<string, { 
        count: number; 
        attempts: RecoveryCodeAttempt[];
      }> = {};

      attemptsData.forEach((attempt) => {
        if (!userFailedCounts[attempt.user_id]) {
          userFailedCounts[attempt.user_id] = { count: 0, attempts: [] };
        }
        userFailedCounts[attempt.user_id].count++;
        userFailedCounts[attempt.user_id].attempts.push(attempt);
      });

      // Filter to only users with 10+ failed attempts (locked out)
      const locked: LockedOutUser[] = Object.entries(userFailedCounts)
        .filter(([_, data]) => data.count >= 10)
        .map(([user_id, data]) => {
          const sortedAttempts = data.attempts.sort(
            (a, b) => new Date(a.attempted_at).getTime() - new Date(b.attempted_at).getTime()
          );
          // The 10th failed attempt triggers the lockout
          const tenthAttempt = sortedAttempts[9];
          const lockoutExpires = new Date(parseISO(tenthAttempt.attempted_at));
          lockoutExpires.setHours(lockoutExpires.getHours() + 1);

          return {
            user_id,
            failed_count: data.count,
            lockout_expires: lockoutExpires,
            first_failed_at: sortedAttempts[0].attempted_at,
            last_failed_at: sortedAttempts[sortedAttempts.length - 1].attempted_at,
          };
        })
        .sort((a, b) => b.failed_count - a.failed_count);

      setLockedUsers(locked);
    } catch (error) {
      console.error("Error fetching locked out users:", error);
      toast({
        title: "Error",
        description: "Failed to load locked out users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Set up realtime subscription
  useEffect(() => {
    fetchLockedOutUsers();

    const channel = supabase
      .channel("locked-out-users-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "recovery_code_attempts",
        },
        () => {
          fetchLockedOutUsers();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "recovery_code_attempts",
        },
        () => {
          fetchLockedOutUsers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Auto-refresh at configurable interval when enabled
  useEffect(() => {
    if (!autoRefreshEnabled) {
      setAutoRefreshCountdown(autoRefreshInterval);
      return;
    }

    // Reset countdown when interval changes
    setAutoRefreshCountdown(autoRefreshInterval);

    const countdownInterval = setInterval(() => {
      setAutoRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchLockedOutUsers();
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [autoRefreshEnabled, autoRefreshInterval]);

  // UI-only refresh to update "expires in" times
  useEffect(() => {
    const interval = setInterval(() => {
      setLockedUsers((prev) => [...prev]);
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const sendUnlockNotification = async (userId: string, message?: string) => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      
      if (!accessToken) {
        console.error("No access token for unlock notification");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-account-unlocked`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ 
            userId, 
            customMessage: message?.trim() || undefined 
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Failed to send unlock notification:", errorData);
      }
    } catch (error) {
      console.error("Error sending unlock notification:", error);
    }
  };

  const handleResetUserAttempts = async (userId: string) => {
    setResettingUserId(userId);
    setSingleUnlockUserId(null);
    try {
      const { data, error } = await supabase.rpc("reset_recovery_code_attempts", {
        p_user_id: userId,
      });

      if (error) throw error;

      // Send unlock notification email to the user with custom message
      await sendUnlockNotification(userId, customMessage);

      toast({
        title: "User Unlocked",
        description: `Cleared ${data} recovery code attempt(s). User has been notified via email.`,
      });

      // Reset custom message and refresh data
      setCustomMessage("");
      await fetchLockedOutUsers();
    } catch (error: any) {
      console.error("Error resetting attempts:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to reset attempts",
        variant: "destructive",
      });
    } finally {
      setResettingUserId(null);
    }
  };

  const handleBulkUnlock = async () => {
    if (selectedUserIds.size === 0) return;
    
    setIsBulkUnlocking(true);
    setShowBulkDialog(false);
    
    const userIds = Array.from(selectedUserIds);
    const total = userIds.length;
    let successCount = 0;
    let failCount = 0;

    setBulkProgress({ current: 0, total });

    for (let i = 0; i < userIds.length; i++) {
      const userId = userIds[i];
      try {
        const { error } = await supabase.rpc("reset_recovery_code_attempts", {
          p_user_id: userId,
        });

        if (error) throw error;

        // Send unlock notification email with custom message
        await sendUnlockNotification(userId, bulkCustomMessage);
        successCount++;
      } catch (error) {
        console.error(`Error unlocking user ${userId}:`, error);
        failCount++;
      }
      setBulkProgress({ current: i + 1, total });
    }

    setSelectedUserIds(new Set());
    setBulkCustomMessage("");
    await fetchLockedOutUsers();
    setIsBulkUnlocking(false);
    setBulkProgress({ current: 0, total: 0 });

    if (failCount === 0) {
      toast({
        title: "Bulk Unlock Complete",
        description: `Successfully unlocked ${successCount} user(s). All have been notified via email.`,
      });
    } else {
      toast({
        title: "Bulk Unlock Partially Complete",
        description: `Unlocked ${successCount} user(s), ${failCount} failed.`,
        variant: "destructive",
      });
    }
  };

  const handleUserSelection = (userId: string, event?: React.MouseEvent) => {
    const isShiftClick = event?.shiftKey ?? false;
    
    if (isShiftClick && lastClickedUserId && lastClickedUserId !== userId) {
      // Shift+Click: select range
      const userIds = filteredUsers.map(u => u.user_id);
      const lastIndex = userIds.indexOf(lastClickedUserId);
      const currentIndex = userIds.indexOf(userId);
      
      if (lastIndex !== -1 && currentIndex !== -1) {
        const start = Math.min(lastIndex, currentIndex);
        const end = Math.max(lastIndex, currentIndex);
        const rangeIds = userIds.slice(start, end + 1);
        
        setSelectedUserIds(prev => {
          const next = new Set(prev);
          rangeIds.forEach(id => next.add(id));
          return next;
        });
        
        toast({
          title: "Range Selected",
          description: `Selected ${rangeIds.length} user(s)`,
        });
      }
    } else {
      // Normal click: toggle single selection
      setSelectedUserIds(prev => {
        const next = new Set(prev);
        if (next.has(userId)) {
          next.delete(userId);
        } else {
          next.add(userId);
        }
        return next;
      });
    }
    
    setLastClickedUserId(userId);
  };

  const toggleSelectAll = () => {
    if (selectedUserIds.size === filteredUsers.length) {
      setSelectedUserIds(new Set());
    } else {
      setSelectedUserIds(new Set(filteredUsers.map((u) => u.user_id)));
    }
  };

  const filteredUsers = useMemo(() => {
    let users = lockedUsers;
    
    // Filter by status
    if (statusFilter === "active") {
      users = users.filter((u) => u.lockout_expires > new Date());
    } else if (statusFilter === "expired") {
      users = users.filter((u) => u.lockout_expires <= new Date());
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      users = users.filter((u) => u.user_id.toLowerCase().includes(query));
    }

    // Sort users
    users = [...users].sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case "failed_count":
          comparison = a.failed_count - b.failed_count;
          break;
        case "lockout_expires":
          comparison = a.lockout_expires.getTime() - b.lockout_expires.getTime();
          break;
        case "last_failed_at":
          comparison = new Date(a.last_failed_at).getTime() - new Date(b.last_failed_at).getTime();
          break;
      }
      
      return sortDirection === "asc" ? comparison : -comparison;
    });
    
    return users;
  }, [lockedUsers, searchQuery, statusFilter, sortField, sortDirection]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredUsers, currentPage, itemsPerPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, itemsPerPage]);

  // Clear selections when filtered users change
  useEffect(() => {
    setSelectedUserIds((prev) => {
      const validIds = new Set(filteredUsers.map((u) => u.user_id));
      const next = new Set<string>();
      prev.forEach((id) => {
        if (validIds.has(id)) next.add(id);
      });
      return next;
    });
  }, [filteredUsers]);

  const isLockoutActive = (user: LockedOutUser) => {
    return user.lockout_expires > new Date();
  };

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;

    const now = new Date();
    const headers = [
      "User ID",
      "Failed Attempts",
      "Lockout Status",
      "Lockout Expires",
      "First Failed At",
      "Last Failed At",
      "Time Until Expiry",
    ];

    const rows = filteredUsers.map((user) => {
      const isActive = isLockoutActive(user);
      return [
        user.user_id,
        user.failed_count.toString(),
        isActive ? "Active" : "Expired",
        format(user.lockout_expires, "yyyy-MM-dd HH:mm:ss"),
        format(parseISO(user.first_failed_at), "yyyy-MM-dd HH:mm:ss"),
        format(parseISO(user.last_failed_at), "yyyy-MM-dd HH:mm:ss"),
        isActive ? formatDistanceToNow(user.lockout_expires) : "N/A",
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `locked-out-users_${format(now, "yyyy-MM-dd_HH-mm")}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${filteredUsers.length} locked user(s) to CSV`,
    });
  };

  // Keyboard shortcut for CSV export (Ctrl+E)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input field
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Ctrl+E or Cmd+E for export
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        if (filteredUsers.length > 0 && !isBulkUnlocking) {
          handleExportCSV();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredUsers, isBulkUnlocking]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle className="text-lg">Locked Out Users</CardTitle>
              <CardDescription>
                Users locked out due to 10+ failed recovery code attempts
              </CardDescription>
            </div>
          </div>
          {lockedUsers.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {lockedUsers.length} locked
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex flex-1 gap-2">
            <div className="relative flex-1 max-w-sm">
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
            <div className="flex rounded-md border bg-muted p-1 gap-1">
              <Button
                variant={statusFilter === "all" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setStatusFilter("all")}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "active" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setStatusFilter("active")}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === "expired" ? "secondary" : "ghost"}
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={() => setStatusFilter("expired")}
              >
                Expired
              </Button>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            {isBulkUnlocking && bulkProgress.total > 0 && (
              <div className="flex items-center gap-2 min-w-[180px]">
                <Progress 
                  value={(bulkProgress.current / bulkProgress.total) * 100} 
                  className="h-2 w-24"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {bulkProgress.current}/{bulkProgress.total} unlocked
                </span>
              </div>
            )}
            {selectedUserIds.size > 0 && !isBulkUnlocking && (
              <AlertDialog open={showBulkDialog} onOpenChange={setShowBulkDialog}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="default"
                    size="sm"
                    className="gap-2"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Unlock {selectedUserIds.size} User{selectedUserIds.size > 1 ? "s" : ""}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Bulk Unlock Users</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will reset all recovery code attempts for {selectedUserIds.size} selected user(s), 
                      allowing them to try again immediately. Each user will receive an email notification.
                      This action will be logged to the admin audit log.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="bg-muted p-3 rounded-md text-sm max-h-32 overflow-y-auto">
                    <p className="text-muted-foreground mb-2">Selected users:</p>
                    {Array.from(selectedUserIds).map((id) => (
                      <code key={id} className="block font-mono text-xs truncate">{id}</code>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">
                        Custom message (optional)
                      </label>
                      <span className={`text-xs ${bulkCustomMessage.length > MAX_MESSAGE_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                        {bulkCustomMessage.length}/{MAX_MESSAGE_LENGTH}
                      </span>
                    </div>
                    <Textarea
                      placeholder="Add a personal message to include in the unlock notification email..."
                      value={bulkCustomMessage}
                      onChange={(e) => {
                        if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                          setBulkCustomMessage(e.target.value);
                        }
                      }}
                      rows={3}
                      className="resize-none"
                    />
                    <p className="text-xs text-muted-foreground">
                      This message will be included in the email sent to all selected users.
                    </p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBulkUnlock}>
                      Unlock All Selected
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 px-2 border rounded-md bg-muted/50">
                    <Switch
                      id="auto-refresh"
                      checked={autoRefreshEnabled}
                      onCheckedChange={setAutoRefreshEnabled}
                      disabled={isBulkUnlocking}
                    />
                    <Label 
                      htmlFor="auto-refresh" 
                      className="text-xs text-muted-foreground cursor-pointer flex items-center gap-1.5"
                    >
                      {autoRefreshEnabled ? (
                        <>
                          <Play className="h-3 w-3 text-primary" />
                          <span>{autoRefreshCountdown}s</span>
                        </>
                      ) : (
                        <>
                          <Pause className="h-3 w-3" />
                          <span>Auto</span>
                        </>
                      )}
                    </Label>
                    <div className="flex rounded-md border bg-background p-0.5 gap-0.5">
                      {([30, 60, 120] as const).map((interval) => (
                        <Button
                          key={interval}
                          variant={autoRefreshInterval === interval ? "secondary" : "ghost"}
                          size="sm"
                          className="h-5 px-1.5 text-[10px] min-w-[32px]"
                          onClick={() => setAutoRefreshInterval(interval)}
                          disabled={isBulkUnlocking}
                        >
                          {interval}s
                        </Button>
                      ))}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{autoRefreshEnabled ? `Auto-refreshing in ${autoRefreshCountdown}s` : `Enable auto-refresh (every ${autoRefreshInterval}s)`}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    disabled={filteredUsers.length === 0 || isBulkUnlocking}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export to CSV <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded border">Ctrl+E</kbd></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={isDemoMode ? "secondary" : "outline"}
                    size="sm"
                    onClick={toggleDemoMode}
                    disabled={isBulkUnlocking}
                    className={isDemoMode ? "border-amber-500/50 bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400" : ""}
                  >
                    <FlaskConical className="h-4 w-4 mr-2" />
                    {isDemoMode ? "Exit Demo" : "Demo"}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isDemoMode ? "Exit demo mode and show real data" : "Load mock data for testing"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (isDemoMode) {
                        setLockedUsers(generateMockData());
                        toast({ title: "Demo Data Refreshed" });
                      } else {
                        fetchLockedOutUsers();
                      }
                    }}
                    disabled={isLoading || isBulkUnlocking}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh locked users list (Ctrl+R)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setShortcutsOpen(true)}
                  >
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard shortcuts (Shift+?)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? (
              <>
                <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No locked users match "{searchQuery}"</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </>
            ) : (
              <>
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No users are currently locked out</p>
                <p className="text-sm mt-1">
                  Users get locked out after 10 failed recovery code attempts within 1 hour
                </p>
              </>
            )}
          </div>
        ) : (
          <TooltipProvider>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filteredUsers.length > 0 && selectedUserIds.size === filteredUsers.length}
                        onCheckedChange={toggleSelectAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-center">
                      <button
                        onClick={() => handleSort("failed_count")}
                        className="inline-flex items-center justify-center hover:text-foreground transition-colors"
                        aria-label="Sort by failed attempts"
                      >
                        Failed Attempts
                        {getSortIcon("failed_count")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("lockout_expires")}
                        className="inline-flex items-center hover:text-foreground transition-colors"
                        aria-label="Sort by lockout status"
                      >
                        Lockout Status
                        {getSortIcon("lockout_expires")}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => handleSort("last_failed_at")}
                        className="inline-flex items-center hover:text-foreground transition-colors"
                        aria-label="Sort by last attempt"
                      >
                        Last Attempt
                        {getSortIcon("last_failed_at")}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const isActive = isLockoutActive(user);
                    return (
                      <TableRow key={user.user_id} className={selectedUserIds.has(user.user_id) ? "bg-muted/50" : ""}>
                        <TableCell>
                          <Checkbox
                            checked={selectedUserIds.has(user.user_id)}
                            onClick={(e) => handleUserSelection(user.user_id, e as unknown as React.MouseEvent)}
                            aria-label={`Select user ${user.user_id}. Hold Shift and click another row to select a range.`}
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <code className="text-xs bg-muted px-2 py-1 rounded cursor-help">
                                {user.user_id.substring(0, 8)}...
                              </code>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-mono text-xs">{user.user_id}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="destructive">{user.failed_count}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {isActive ? (
                              <>
                                <Badge variant="destructive" className="gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full bg-destructive-foreground animate-pulse" />
                                  Active
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(user.lockout_expires, { addSuffix: true })}
                                </span>
                              </>
                            ) : (
                              <>
                                <Badge variant="outline" className="gap-1.5 text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400">
                                  <Clock className="w-3 h-3" />
                                  Expired
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  may still have attempts
                                </span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm text-muted-foreground cursor-help">
                                {formatDistanceToNow(parseISO(user.last_failed_at), { addSuffix: true })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{format(parseISO(user.last_failed_at), "PPpp")}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-right">
                          <AlertDialog 
                            open={singleUnlockUserId === user.user_id}
                            onOpenChange={(open) => {
                              if (open) {
                                setSingleUnlockUserId(user.user_id);
                                setCustomMessage("");
                              } else {
                                setSingleUnlockUserId(null);
                              }
                            }}
                          >
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={resettingUserId === user.user_id}
                                className="gap-2"
                              >
                                {resettingUserId === user.user_id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="h-3 w-3" />
                                )}
                                Unlock
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Unlock User Account</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will reset all recovery code attempts for this user, 
                                  allowing them to try again immediately. This action will be 
                                  logged to the admin audit log.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <div className="bg-muted p-3 rounded-md text-sm">
                                <p className="text-muted-foreground">User ID:</p>
                                <code className="font-mono text-xs">{user.user_id}</code>
                                <p className="text-muted-foreground mt-2">Failed attempts to clear:</p>
                                <span className="font-medium text-destructive">{user.failed_count}</span>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <label className="text-sm font-medium">
                                    Custom message (optional)
                                  </label>
                                  <span className={`text-xs ${customMessage.length > MAX_MESSAGE_LENGTH ? "text-destructive" : "text-muted-foreground"}`}>
                                    {customMessage.length}/{MAX_MESSAGE_LENGTH}
                                  </span>
                                </div>
                                <Textarea
                                  placeholder="Add a personal message to include in the unlock notification email..."
                                  value={customMessage}
                                  onChange={(e) => {
                                    if (e.target.value.length <= MAX_MESSAGE_LENGTH) {
                                      setCustomMessage(e.target.value);
                                    }
                                  }}
                                  rows={3}
                                  className="resize-none"
                                />
                                <p className="text-xs text-muted-foreground">
                                  This message will be included in the email notification.
                                </p>
                              </div>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleResetUserAttempts(user.user_id)}
                                >
                                  Unlock User
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </TooltipProvider>
        )}

        {/* Pagination Controls */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{lockedUsers.filter(isLockoutActive).length} actively locked</span>
              <span>{lockedUsers.filter((u) => !isLockoutActive(u)).length} expired</span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Items per page selector */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Show:</span>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => setItemsPerPage(parseInt(value) as 10 | 25 | 50 | 100)}
                >
                  <SelectTrigger className="w-[70px] h-8">
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

              {/* Page info */}
              <span className="text-sm text-muted-foreground">
                {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, filteredUsers.length)} of {filteredUsers.length}
              </span>

              {/* Navigation buttons */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <KeyboardShortcutsOverlay
        open={shortcutsOpen}
        onOpenChange={setShortcutsOpen}
        groups={shortcutGroups}
        title="Locked Users Shortcuts"
      />
    </Card>
  );
};

export default LockedOutUsersManager;
