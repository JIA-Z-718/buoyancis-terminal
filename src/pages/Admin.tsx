import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdminKeyboardShortcuts } from "@/hooks/useAdminKeyboardShortcuts";
import { useNewItemHighlight } from "@/hooks/useNewItemHighlight";
import { useHighlightSettings } from "@/hooks/useHighlightSettings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DateRangeProvider } from "@/contexts/DateRangeContext";
import GlobalDateRangeSelector from "@/components/admin/GlobalDateRangeSelector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Trash2, RefreshCw, LogOut, Download, Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, CalendarIcon, X, TrendingUp, Users, Calendar as CalendarIcon2, Clock, Bell, Shield, FileText, Keyboard, Settings, CloudUpload, Mail } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { format, startOfDay, endOfDay, subDays, parseISO, startOfWeek, startOfMonth, isAfter, formatDistanceToNow } from "date-fns";
import WelcomeEmailPreview from "@/components/admin/WelcomeEmailPreview";
import BulkEmailDialog from "@/components/admin/BulkEmailDialog";
import CampaignAnalytics from "@/components/admin/CampaignAnalytics";
import ScheduledEmailsManager from "@/components/admin/ScheduledEmailsManager";
import EmailTemplatesManager from "@/components/admin/EmailTemplatesManager";
import UnsubscribesManager from "@/components/admin/UnsubscribesManager";
import BouncesManager from "@/components/admin/BouncesManager";
import ComplaintsManager from "@/components/admin/ComplaintsManager";
import DeliverabilityDashboard from "@/components/admin/DeliverabilityDashboard";
import CronJobsManager from "@/components/admin/CronJobsManager";
import SignupErrorLogs from "@/components/admin/SignupErrorLogs";
import AdminNotificationSettings from "@/components/admin/AdminNotificationSettings";
import NotificationHistory from "@/components/admin/NotificationHistory";
import EmailSenderSettings from "@/components/admin/EmailSenderSettings";
import RateLimitViolationsWidget from "@/components/admin/RateLimitViolationsWidget";
import BotDetectionWidget from "@/components/admin/BotDetectionWidget";
import AbuseMonitoringFeed from "@/components/admin/AbuseMonitoringFeed";
import BotDetectionTrendsChart from "@/components/admin/BotDetectionTrendsChart";
import RateLimitTrendsChart from "@/components/admin/RateLimitTrendsChart";
import SecurityOverviewCard from "@/components/admin/SecurityOverviewCard";
import SecuritySummaryScheduler from "@/components/admin/SecuritySummaryScheduler";
import AdminAuditLogWidget from "@/components/admin/AdminAuditLogWidget";
import SecurityEventsAuditLog from "@/components/admin/SecurityEventsAuditLog";
import { UserAgentAnalysisView } from "@/components/admin/UserAgentAnalysisView";
import IpBlocklistManager from "@/components/admin/IpBlocklistManager";
import GeoRestrictionsManager from "@/components/admin/GeoRestrictionsManager";
import UserRoleManager from "@/components/admin/UserRoleManager";
import CustomerSupportView from "@/components/admin/CustomerSupportView";
import FeedbackManager from "@/components/admin/FeedbackManager";
import AccessibilityChecklist from "@/components/admin/AccessibilityChecklist";
import DataRetentionSettings from "@/components/admin/DataRetentionSettings";
import BlogPostsManager from "@/components/admin/BlogPostsManager";
import DailyEntropyManager from "@/components/admin/DailyEntropyManager";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminSectionHintBar from "@/components/admin/AdminSectionHintBar";
import KeyboardShortcutsModal from "@/components/admin/KeyboardShortcutsModal";
import KeyboardShortcutSettings from "@/components/admin/KeyboardShortcutSettings";
import HighlightDurationSettings from "@/components/admin/HighlightDurationSettings";
import MFAEnrollment from "@/components/admin/MFAEnrollment";
import MFAEnforcementSettings from "@/components/admin/MFAEnforcementSettings";
import RecoveryCodesDisplay from "@/components/admin/RecoveryCodesDisplay";
import RecoveryCodeAttemptsWidget from "@/components/admin/RecoveryCodeAttemptsWidget";
import RecoveryCodeInvestigator from "@/components/admin/RecoveryCodeInvestigator";
import LockedOutUsersManager from "@/components/admin/LockedOutUsersManager";
import MFAEnforcementGuard from "@/components/admin/MFAEnforcementGuard";
import MFAAdoptionDashboard from "@/components/admin/MFAAdoptionDashboard";
import EventCheckinsManager from "@/components/admin/EventCheckinsManager";
import { KeyboardPreferencesProvider, useKeyboardPreferences } from "@/hooks/useKeyboardPreferences";
import SyncIndicator from "@/components/SyncIndicator";
import TrustDecayDashboard from "@/components/admin/TrustDecayDashboard";
import SecuritySettingsChecklist from "@/components/admin/SecuritySettingsChecklist";
import ExportEarlyAccessDialog from "@/components/admin/ExportEarlyAccessDialog";

import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Signup {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  created_at: string;
}

type SortField = "name" | "email" | "created_at";
type SortDirection = "asc" | "desc";

// Sub-component to use keyboard preferences hook
function SyncAllSettingsButton() {
  const { forceSyncNow, isSyncing, lastSyncedAt, syncStatus } = useKeyboardPreferences();
  
  const handleSync = async () => {
    const success = await forceSyncNow();
    if (success) {
      toast.success("All settings synced to cloud");
    } else {
      toast.error("Failed to sync settings");
    }
  };
  
  return (
    <div className="flex items-center gap-2">
      {lastSyncedAt && (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
              <SyncIndicator 
                lastSyncedAt={lastSyncedAt} 
                recentThresholdMs={5000}
                size="sm"
              />
              <span className="hidden sm:inline">
                {formatDistanceToNow(lastSyncedAt, { addSuffix: true })}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Last synced: {format(lastSyncedAt, "PPpp")}</p>
          </TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CloudUpload className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Sync all settings to cloud</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

const Admin = () => {
  const { user, isAdmin, isAdminVerified, isLoading: authLoading, signOut } = useAuth();
  const [signups, setSignups] = useState<Signup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [failedNotificationCount, setFailedNotificationCount] = useState(0);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [activeSection, setActiveSection] = useState("metrics");
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showKeyboardHint, setShowKeyboardHint] = useState(() => {
    return !localStorage.getItem("admin-keyboard-hint-seen");
  });
  const pageSize = 10;
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Track new signups for highlight animation with configurable duration
  const { settings: highlightSettings } = useHighlightSettings();
  const { isHighlighted: isSignupHighlighted } = useNewItemHighlight(signups, {
    highlightDuration: highlightSettings.signups,
  });

  const fetchSignups = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-early-access", {
        body: { action: "list" },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setSignups(data.data || []);
    } catch (error: any) {
      toast({
        title: "Error loading signups",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // Wait for both auth loading AND admin verification to complete
    if (authLoading || !isAdminVerified) {
      return;
    }
    
    if (!user) {
      navigate("/auth/login");
    } else if (!isAdmin) {
      toast({
        title: "Access denied",
        description: "You don't have admin privileges.",
        variant: "destructive",
      });
      navigate("/");
    } else {
      fetchSignups();
    }
  }, [user, isAdmin, isAdminVerified, authLoading, navigate]);

  // Subscribe to real-time updates for signups
  useEffect(() => {
    if (!isAdmin) return;

    const channel = supabase
      .channel('signups-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'early_access_signups',
        },
        (payload) => {
          // Add new signup to the top of the list
          setSignups((prev) => [payload.new as Signup, ...prev]);
          toast({
            title: "New signup!",
            description: `${payload.new.email} just signed up for early access.`,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'early_access_signups',
        },
        (payload) => {
          // Remove deleted signup from the list
          setSignups((prev) => prev.filter((s) => s.id !== payload.old.id));
          // Also remove from selected if it was selected
          setSelectedIds((prev) => {
            const next = new Set(prev);
            next.delete(payload.old.id);
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  // Fetch failed notification count and subscribe to real-time updates
  useEffect(() => {
    if (!isAdmin) return;

    const fetchFailedCount = async () => {
      const { count } = await supabase
        .from("notification_history")
        .select("*", { count: "exact", head: true })
        .eq("status", "failed");
      setFailedNotificationCount(count || 0);
    };

    fetchFailedCount();

    const channel = supabase
      .channel('failed-notifications-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_history',
        },
        () => {
          // Refetch count on any change
          fetchFailedCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const { data, error } = await supabase.functions.invoke("admin-early-access", {
        body: { action: "delete", id },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      setSignups(signups.filter((s) => s.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      toast({
        title: "Signup deleted",
        description: "The entry has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting signup",
        description: error.message,
        variant: "destructive",
      });
    }
    setDeletingId(null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    
    setIsBulkDeleting(true);
    const idsToDelete = Array.from(selectedIds);
    
    try {
      // Delete one by one through edge function (bulk not supported)
      for (const id of idsToDelete) {
        const { data, error } = await supabase.functions.invoke("admin-early-access", {
          body: { action: "delete", id },
        });
        if (error) throw error;
        if (data.error) throw new Error(data.error);
      }
      
      setSignups(signups.filter((s) => !selectedIds.has(s.id)));
      setSelectedIds(new Set());
      toast({
        title: "Signups deleted",
        description: `${idsToDelete.length} entries have been removed.`,
      });
    } catch (error: any) {
      toast({
        title: "Error deleting signups",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsBulkDeleting(false);
  };

  const toggleSelectAll = () => {
    const currentPageIds = paginatedSignups.map((s) => s.id);
    const allSelected = currentPageIds.every((id) => selectedIds.has(id));
    
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        currentPageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSignOut = useCallback(async () => {
    await signOut();
    navigate("/");
  }, [signOut, navigate]);

  const handleRefresh = useCallback(() => {
    fetchSignups();
  }, []);

  const handleExportCSV = useCallback(() => {
    if (signups.length === 0) return;
    
    const headers = ["First Name", "Last Name", "Email", "Signed Up"];
    const rows = signups.map((s) => [
      s.first_name || "",
      s.last_name || "",
      s.email,
      format(new Date(s.created_at), "yyyy-MM-dd HH:mm:ss"),
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `early-access-signups-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [signups]);

  // Initialize keyboard shortcuts
  useAdminKeyboardShortcuts({
    onRefresh: handleRefresh,
    onExport: handleExportCSV,
    onSignOut: handleSignOut,
    onShowShortcuts: () => setShowShortcutsModal(true),
    onSectionChange: setActiveSection,
    activeSection,
    enabled: isAdmin && !authLoading,
  });

  // Generate chart data - signups per day for the last 30 days
  const chartData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), 29 - i);
      return {
        date: format(date, "yyyy-MM-dd"),
        label: format(date, "MMM d"),
        count: 0,
      };
    });

    signups.forEach((signup) => {
      const signupDate = format(parseISO(signup.created_at), "yyyy-MM-dd");
      const dayData = last30Days.find((d) => d.date === signupDate);
      if (dayData) {
        dayData.count += 1;
      }
    });

    return last30Days;
  }, [signups]);

  const chartConfig = {
    count: {
      label: "Signups",
      color: "hsl(var(--primary))",
    },
  };

  // Calculate metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);

    const signupsToday = signups.filter((s) => 
      isAfter(parseISO(s.created_at), todayStart)
    ).length;

    const signupsThisWeek = signups.filter((s) => 
      isAfter(parseISO(s.created_at), weekStart)
    ).length;

    const signupsThisMonth = signups.filter((s) => 
      isAfter(parseISO(s.created_at), monthStart)
    ).length;

    // Calculate growth rate (this week vs last week)
    const lastWeekStart = subDays(weekStart, 7);
    const signupsLastWeek = signups.filter((s) => {
      const date = parseISO(s.created_at);
      return isAfter(date, lastWeekStart) && !isAfter(date, weekStart);
    }).length;

    const growthRate = signupsLastWeek > 0 
      ? Math.round(((signupsThisWeek - signupsLastWeek) / signupsLastWeek) * 100)
      : signupsThisWeek > 0 ? 100 : 0;

    return {
      total: signups.length,
      today: signupsToday,
      thisWeek: signupsThisWeek,
      thisMonth: signupsThisMonth,
      growthRate,
    };
  }, [signups]);

  const filteredSignups = signups.filter((signup) => {
    const query = searchQuery.toLowerCase();
    const matchesEmail = signup.email.toLowerCase().includes(query);
    const matchesFirstName = signup.first_name?.toLowerCase().includes(query) || false;
    const matchesLastName = signup.last_name?.toLowerCase().includes(query) || false;
    const matchesSearch = matchesEmail || matchesFirstName || matchesLastName;
    const signupDate = new Date(signup.created_at);
    const matchesDateFrom = !dateFrom || signupDate >= startOfDay(dateFrom);
    const matchesDateTo = !dateTo || signupDate <= endOfDay(dateTo);
    return matchesSearch && matchesDateFrom && matchesDateTo;
  });

  // Sort filtered signups
  const sortedSignups = [...filteredSignups].sort((a, b) => {
    const modifier = sortDirection === "asc" ? 1 : -1;
    if (sortField === "name") {
      const nameA = [a.first_name, a.last_name].filter(Boolean).join(" ").toLowerCase();
      const nameB = [b.first_name, b.last_name].filter(Boolean).join(" ").toLowerCase();
      return nameA.localeCompare(nameB) * modifier;
    }
    if (sortField === "email") {
      return a.email.localeCompare(b.email) * modifier;
    }
    return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * modifier;
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortDirection, dateFrom, dateTo]);

  const totalPages = Math.ceil(sortedSignups.length / pageSize);
  const paginatedSignups = sortedSignups.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection(field === "email" || field === "name" ? "asc" : "desc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" 
      ? <ArrowUp className="w-4 h-4 ml-1" /> 
      : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  if (authLoading || !isAdminVerified) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-narrow py-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-8 w-48" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
          <div className="glass-card overflow-hidden p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-8" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <MFAEnforcementGuard onSignOut={handleSignOut}>
    <DateRangeProvider>
    <KeyboardPreferencesProvider>
    <div className="min-h-screen bg-background flex w-full">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 py-8 px-6 lg:px-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <h1 className="text-2xl font-serif text-foreground">
              Early Access Signups
            </h1>
          </div>
          <TooltipProvider>
            <div className="flex items-center gap-2">
              <BulkEmailDialog 
                emails={signups.map(s => s.email)} 
                disabled={isLoading || signups.length === 0}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCSV}
                    disabled={isLoading || signups.length === 0}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Quick Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Download CSV directly <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">E</kbd></p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowExportDialog(true)}
                    disabled={isLoading || signups.length === 0}
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    Secure Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Export with email delivery & audit trail</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh signups <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">R</kbd></p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Button variant="outline" size="sm" className="relative">
                      <Bell className="w-4 h-4" />
                      {failedNotificationCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-2 -right-2 h-5 min-w-[20px] px-1.5 text-xs flex items-center justify-center"
                        >
                          {failedNotificationCount > 99 ? "99+" : failedNotificationCount}
                        </Badge>
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Failed notifications{failedNotificationCount > 0 ? ` (${failedNotificationCount})` : ""}</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/tools/security">
                    <Button variant="outline" size="sm">
                      <Shield className="w-4 h-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Security documentation</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link to="/tools/compliance-report">
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4" />
                    </Button>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compliance report</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sign out <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">Esc</kbd></p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      setShowShortcutsModal(true);
                      if (showKeyboardHint) {
                        setShowKeyboardHint(false);
                        localStorage.setItem("admin-keyboard-hint-seen", "true");
                      }
                    }}
                    className={cn(
                      "relative",
                      showKeyboardHint && "animate-pulse ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    <Keyboard className="w-4 h-4" />
                    {showKeyboardHint && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard shortcuts <kbd className="ml-1 px-1.5 py-0.5 text-xs bg-muted rounded">?</kbd></p>
                </TooltipContent>
              </Tooltip>
              <SyncAllSettingsButton />
              <KeyboardShortcutSettings 
                trigger={
                  <Button variant="ghost" size="sm" className="text-muted-foreground">
                    <Settings className="w-4 h-4" />
                  </Button>
                }
              />
            </div>
          </TooltipProvider>
        </div>

        {/* Global Date Range Selector */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-lg bg-muted/30 border">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="font-medium">Chart Period:</span>
            <span className="text-xs">(applies to all trend charts)</span>
          </div>
          <GlobalDateRangeSelector />
        </div>

        <div id="section-signups" className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !dateFrom && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateFrom ? format(dateFrom, "MMM d, yyyy") : "From"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateFrom}
                  onSelect={setDateFrom}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[140px] justify-start text-left font-normal",
                    !dateTo && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateTo ? format(dateTo, "MMM d, yyyy") : "To"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateTo}
                  onSelect={setDateTo}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>

            {(dateFrom || dateTo) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setDateFrom(undefined);
                  setDateTo(undefined);
                }}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Metrics Cards */}
        <div id="section-metrics">
          {!isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Signups</p>
                      <p className="text-2xl font-bold">{metrics.total}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today</p>
                      <p className="text-2xl font-bold">{metrics.today}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">This Week</p>
                      <p className="text-2xl font-bold">{metrics.thisWeek}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                      <CalendarIcon2 className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Growth</p>
                      <p className={cn(
                        "text-2xl font-bold",
                        metrics.growthRate > 0 ? "text-green-600" : metrics.growthRate < 0 ? "text-red-600" : ""
                      )}>
                        {metrics.growthRate > 0 ? "+" : ""}{metrics.growthRate}%
                      </p>
                    </div>
                    <div className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center",
                      metrics.growthRate >= 0 ? "bg-green-500/10" : "bg-red-500/10"
                    )}>
                      <TrendingUp className={cn(
                        "h-5 w-5",
                        metrics.growthRate >= 0 ? "text-green-600" : "text-red-600"
                      )} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">vs last week</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Event Check-ins Manager */}
        <div id="section-event-checkins">
          {!isLoading && <EventCheckinsManager />}
        </div>
        {/* Deliverability Dashboard */}
        <div id="section-deliverability">
          {!isLoading && <DeliverabilityDashboard />}
        </div>

        {/* Cron Jobs Manager */}
        <div id="section-cron-jobs">
          {!isLoading && <CronJobsManager />}
        </div>

        {/* Security Overview */}
        <div id="section-security-overview" className="space-y-4">
          {!isLoading && <SecurityOverviewCard />}
          {!isLoading && <SecuritySettingsChecklist />}
        </div>

        {/* Security Summary Scheduler */}
        <div id="section-security-summary">
          {!isLoading && <SecuritySummaryScheduler />}
        </div>

        {/* Security Audit Log */}
        <div id="section-audit-log">
          {!isLoading && <AdminAuditLogWidget />}
        </div>

        {/* Security Events Audit Log (MFA, Lockouts, Recovery) */}
        <div id="section-security-events">
          {!isLoading && <SecurityEventsAuditLog />}
        </div>

        {/* Real-Time Abuse Monitoring */}
        <div id="section-abuse-monitoring" className="space-y-6">
          {!isLoading && <BotDetectionTrendsChart />}
          {!isLoading && <AbuseMonitoringFeed />}
        </div>

        {/* Rate Limit Violations */}
        <div id="section-rate-limits" className="space-y-6">
          {!isLoading && <RateLimitTrendsChart />}
          {!isLoading && <RateLimitViolationsWidget />}
        </div>

        {/* Bot Detection Statistics */}
        <div id="section-bot-detection">
          {!isLoading && <BotDetectionWidget />}
        </div>

        {/* User Agent Analysis */}
        {!isLoading && <UserAgentAnalysisView />}

        {/* IP Blocklist Manager */}
        <div id="section-ip-blocklist">
          {!isLoading && <IpBlocklistManager />}
        </div>

        {/* Geographic Restrictions Manager */}
        <div id="section-geo-restrictions">
          {!isLoading && <GeoRestrictionsManager />}
        </div>

        {/* Signup Error Logs */}
        <div id="section-error-logs">
          {!isLoading && <SignupErrorLogs />}
        </div>

        {/* Email Sender Settings */}
        <div id="section-email-sender">
          {!isLoading && <EmailSenderSettings />}
        </div>

        {/* User Role Management */}
        <div id="section-user-roles">
          {!isLoading && <UserRoleManager />}
        </div>

        {/* User Feedback */}
        <div id="section-feedback">
          {!isLoading && <FeedbackManager />}
        </div>

        {/* Customer Support View */}
        <div id="section-support">
          {!isLoading && <CustomerSupportView />}
        </div>

        {/* Admin Notification Settings */}
        <div id="section-notifications">
          {!isLoading && <AdminNotificationSettings />}
        </div>

        {/* Data Retention Settings */}
        <div id="section-data-retention">
          {!isLoading && <DataRetentionSettings />}
        </div>

        {/* Highlight Duration Settings */}
        <div id="section-highlight-settings">
          {!isLoading && <HighlightDurationSettings />}
        </div>

        {/* MFA Settings */}
        <div id="section-mfa-settings" className="space-y-6">
          {!isLoading && <MFAEnforcementSettings />}
          {!isLoading && <MFAEnrollment />}
          {!isLoading && <RecoveryCodesDisplay />}
          {!isLoading && <RecoveryCodeAttemptsWidget />}
          {!isLoading && <RecoveryCodeInvestigator />}
        </div>

        {/* MFA Adoption Dashboard */}
        <div id="section-mfa-adoption">
          {!isLoading && <MFAAdoptionDashboard />}
        </div>

        {/* Locked Out Users */}
        <div id="section-locked-users">
          {!isLoading && <LockedOutUsersManager />}
        </div>

        {/* Trust Decay Dashboard */}
        <div id="section-trust-decay">
          {!isLoading && <TrustDecayDashboard />}
        </div>

        {/* Event Check-ins Manager */}
        <div id="section-event-checkins">
          {!isLoading && <EventCheckinsManager />}
        </div>

        {/* Blog Posts Manager */}
        <div id="section-blog-posts">
          {!isLoading && <BlogPostsManager />}
        </div>

        {/* Daily Entropy Manager */}
        <div id="section-daily-entropy">
          {!isLoading && <DailyEntropyManager />}
        </div>

        {/* Notification History */}
        {!isLoading && <NotificationHistory />}

        {/* Accessibility Checklist */}
        <div id="section-accessibility">
          {!isLoading && <AccessibilityChecklist />}
        </div>

        {/* Email Preview Section */}
        {!isLoading && <WelcomeEmailPreview />}

        {/* Campaign Analytics */}
        <div id="section-campaigns">
          {!isLoading && <CampaignAnalytics />}
        </div>

        {/* Scheduled Emails Manager */}
        <div id="section-scheduled">
          {!isLoading && <ScheduledEmailsManager />}
        </div>

        {/* Email Templates Manager */}
        <div id="section-templates">
          {!isLoading && <EmailTemplatesManager />}
        </div>

        {/* Unsubscribes Manager */}
        <div id="section-unsubscribes">
          {!isLoading && <UnsubscribesManager />}
        </div>

        {/* Bounces Manager */}
        <div id="section-bounces">
          {!isLoading && <BouncesManager />}
        </div>

        {/* Complaints Manager */}
        <div id="section-complaints">
          {!isLoading && <ComplaintsManager />}
        </div>

        {!isLoading && signups.length > 0 && (
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Signup Trends (Last 30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillSignups" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#fillSignups)"
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        <div className="glass-card overflow-hidden">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          ) : filteredSignups.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery ? "No matching signups" : "No signups yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        paginatedSignups.length > 0 &&
                        paginatedSignups.every((s) => selectedIds.has(s.id))
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("name")}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Name
                      <SortIcon field="name" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("email")}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Email
                      <SortIcon field="email" />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      onClick={() => handleSort("created_at")}
                      className="flex items-center hover:text-foreground transition-colors"
                    >
                      Signed Up
                      <SortIcon field="created_at" />
                    </button>
                  </TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSignups.map((signup) => (
                  <TableRow 
                    key={signup.id} 
                    className={cn(
                      selectedIds.has(signup.id) && "bg-muted/50",
                      isSignupHighlighted(signup.id) && "animate-highlight-new"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(signup.id)}
                        onCheckedChange={() => toggleSelect(signup.id)}
                        aria-label={`Select ${signup.email}`}
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="flex items-center gap-2">
                        {[signup.first_name, signup.last_name].filter(Boolean).join(" ") || "—"}
                        {isSignupHighlighted(signup.id) && (
                          <Badge variant="default" className="animate-fade-in text-[10px] px-1.5 py-0 h-4">
                            New
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{signup.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(signup.created_at), "MMM d, yyyy 'at' h:mm a")}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(signup.id)}
                        disabled={deletingId === signup.id || isBulkDeleting}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        {deletingId === signup.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {selectedIds.size > 0 && (
          <div className="mt-4 flex items-center gap-4 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedIds.size} selected
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete selected
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
              disabled={isBulkDeleting}
            >
              Clear selection
            </Button>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {searchQuery && filteredSignups.length !== signups.length
              ? `Showing ${filteredSignups.length} of ${signups.length} signup${signups.length !== 1 ? "s" : ""}`
              : `Total: ${signups.length} signup${signups.length !== 1 ? "s" : ""}`}
          </p>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

        <AdminSectionHintBar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>

      <KeyboardShortcutsModal
        open={showShortcutsModal}
        onOpenChange={setShowShortcutsModal}
      />
      <ExportEarlyAccessDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        signupCount={signups.length}
      />
    </KeyboardPreferencesProvider>
    </DateRangeProvider>
    </MFAEnforcementGuard>
  );
};

export default Admin;
