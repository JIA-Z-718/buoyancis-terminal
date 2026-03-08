import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Shield,
  ShieldAlert,
  Bot,
  Clock,
  AlertTriangle,
  Gauge,
  Mail,
  AtSign,
  Globe,
  Activity,
  Bell,
  BellOff,
  Trash2,
  Pause,
  Play,
  Wifi,
  WifiOff,
  Volume2,
  VolumeX,
  Filter,
  Ban,
  ShieldCheck,
  Loader2,
  Download,
  RefreshCw,
  History,
  Search,
  X,
  CheckSquare,
  Square,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
} from "@/components/ui/alert-dialog";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRelativeTimeRefresh } from "@/hooks/useRelativeTimeRefresh";
import { playAlertSound, initAudioContext } from "@/lib/alertSound";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { useIpGeolocation, getCountryFlag } from "@/hooks/useIpGeolocation";

interface BotEvent {
  id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface RateLimitViolation {
  id: string;
  function_name: string;
  ip_address: string;
  request_count: number;
  max_requests: number;
  created_at: string;
}

type FeedItem = 
  | { type: "bot"; data: BotEvent }
  | { type: "rate_limit"; data: RateLimitViolation };

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; severity: "low" | "medium" | "high" }> = {
  honeypot: { label: "Honeypot Triggered", icon: <Bot className="w-4 h-4" />, severity: "high" },
  timing: { label: "Timing Violation", icon: <Clock className="w-4 h-4" />, severity: "medium" },
  captcha_failure: { label: "CAPTCHA Failure", icon: <ShieldAlert className="w-4 h-4" />, severity: "high" },
  suspicious_ua: { label: "Suspicious User-Agent", icon: <AlertTriangle className="w-4 h-4" />, severity: "medium" },
  challenge_failure: { label: "Challenge Failure", icon: <Shield className="w-4 h-4" />, severity: "high" },
  rate_limit: { label: "Rate Limited", icon: <Gauge className="w-4 h-4" />, severity: "high" },
  spam_domain: { label: "Spam Domain", icon: <Mail className="w-4 h-4" />, severity: "medium" },
  typo_domain: { label: "Email Typo", icon: <AtSign className="w-4 h-4" />, severity: "low" },
  ip_blocked: { label: "IP Blocked", icon: <Shield className="w-4 h-4" />, severity: "high" },
  geo_blocked: { label: "Geo Blocked", icon: <Globe className="w-4 h-4" />, severity: "medium" },
};

const MAX_FEED_ITEMS = 50;

const AbuseMonitoringFeed = () => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showToasts, setShowToasts] = useState(true);
  const [playSounds, setPlaySounds] = useState(false);
  const [filterType, setFilterType] = useState<"all" | "bot" | "rate_limit">("all");
  const [filterSeverity, setFilterSeverity] = useState<"all" | "high" | "medium" | "low">("all");
  const [filterIp, setFilterIp] = useState("");
  const [botEventCount, setBotEventCount] = useState(0);
  const [rateLimitCount, setRateLimitCount] = useState(0);
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());
  const [blockedIpCount, setBlockedIpCount] = useState(0);
  const [blockingIp, setBlockingIp] = useState<string | null>(null);
  const [unblockingIp, setUnblockingIp] = useState<string | null>(null);
  const [unblockConfirmIp, setUnblockConfirmIp] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(30);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [selectedIps, setSelectedIps] = useState<Set<string>>(new Set());
  const [showBulkBlockDialog, setShowBulkBlockDialog] = useState(false);
  const [isBulkBlocking, setIsBulkBlocking] = useState(false);
  const { toast } = useToast();

  // Filter feed items based on selected filters
  const filteredFeedItems = feedItems.filter((item) => {
    // Type filter
    if (filterType !== "all" && item.type !== filterType) return false;
    
    // IP filter
    if (filterIp.trim()) {
      const itemIp = item.type === "bot" ? item.data.ip_address : item.data.ip_address;
      if (!itemIp || !itemIp.toLowerCase().includes(filterIp.toLowerCase().trim())) {
        return false;
      }
    }
    
    // Severity filter
    if (filterSeverity !== "all") {
      if (item.type === "rate_limit") {
        // Rate limits are always high severity
        return filterSeverity === "high";
      } else {
        const config = EVENT_TYPE_CONFIG[item.data.event_type];
        const severity = config?.severity || "medium";
        return severity === filterSeverity;
      }
    }
    
    return true;
  });

  // Get unique IPs from filtered feed items that can be selected (not already blocked)
  const selectableIps = useMemo(() => {
    const ips = new Set<string>();
    filteredFeedItems.forEach((item) => {
      const ip = item.type === "bot" ? item.data.ip_address : item.data.ip_address;
      if (ip && !blockedIps.has(ip)) {
        ips.add(ip);
      }
    });
    return ips;
  }, [filteredFeedItems, blockedIps]);

  // Clean up selected IPs when they get blocked
  useEffect(() => {
    setSelectedIps((prev) => {
      const newSet = new Set<string>();
      prev.forEach((ip) => {
        if (selectableIps.has(ip)) {
          newSet.add(ip);
        }
      });
      return newSet;
    });
  }, [selectableIps]);

  // Extract IPs from filtered items for geolocation lookup
  const ipAddresses = filteredFeedItems
    .map((item) => item.type === "bot" ? item.data.ip_address : item.data.ip_address)
    .filter((ip): ip is string => Boolean(ip));
  const { locations, isLoading: isLoadingGeo } = useIpGeolocation(ipAddresses);
  useEffect(() => {
    const handleInteraction = () => {
      initAudioContext();
      window.removeEventListener("click", handleInteraction);
    };
    window.addEventListener("click", handleInteraction);
    return () => window.removeEventListener("click", handleInteraction);
  }, []);

  // Refresh relative times every minute
  useRelativeTimeRefresh(60000);

  const addFeedItem = useCallback((item: FeedItem) => {
    if (isPaused) return;
    
    setFeedItems((prev) => {
      const newItems = [item, ...prev].slice(0, MAX_FEED_ITEMS);
      return newItems;
    });

    if (item.type === "bot") {
      setBotEventCount((prev) => prev + 1);
    } else {
      setRateLimitCount((prev) => prev + 1);
    }
  }, [isPaused]);

  const showNotification = useCallback((item: FeedItem) => {
    if (isPaused) return;

    const isHighSeverity = item.type === "rate_limit" || 
      (item.type === "bot" && (EVENT_TYPE_CONFIG[item.data.event_type]?.severity === "high"));

    // Play sound for high severity events
    if (playSounds && isHighSeverity) {
      playAlertSound("critical");
    } else if (playSounds) {
      playAlertSound("warning");
    }

    // Show toast notification
    if (showToasts) {
      if (item.type === "bot") {
        const config = EVENT_TYPE_CONFIG[item.data.event_type] || { label: item.data.event_type, severity: "medium" };
        toast({
          title: `🤖 ${config.label}`,
          description: item.data.ip_address ? `IP: ${item.data.ip_address}` : "Bot activity detected",
          variant: config.severity === "high" ? "destructive" : "default",
        });
      } else {
        toast({
          title: "🚫 Rate Limit Violation",
          description: `${item.data.function_name} - ${item.data.ip_address}`,
          variant: "destructive",
        });
      }
    }
  }, [showToasts, playSounds, isPaused, toast]);

  // Fetch blocked IP count on mount
  useEffect(() => {
    const fetchBlockedIpCount = async () => {
      const { count, error } = await supabase
        .from("ip_blocklist")
        .select("*", { count: "exact", head: true });
      
      if (!error && count !== null) {
        setBlockedIpCount(count);
      }
    };
    fetchBlockedIpCount();
  }, []);

  // Set up realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel("abuse-monitoring-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bot_detection_events" },
        (payload) => {
          const item: FeedItem = { type: "bot", data: payload.new as BotEvent };
          addFeedItem(item);
          showNotification(item);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rate_limit_violations" },
        (payload) => {
          const item: FeedItem = { type: "rate_limit", data: payload.new as RateLimitViolation };
          addFeedItem(item);
          showNotification(item);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ip_blocklist" },
        async () => {
          // Refresh blocked IP count when blocklist changes
          const { count } = await supabase
            .from("ip_blocklist")
            .select("*", { count: "exact", head: true });
          if (count !== null) {
            setBlockedIpCount(count);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [addFeedItem, showNotification]);

  const clearFeed = () => {
    setFeedItems([]);
    setBotEventCount(0);
    setRateLimitCount(0);
  };

  // Fetch historical events
  const fetchHistoricalEvents = useCallback(async (showToast = false) => {
    setIsLoadingHistory(true);
    try {
      // Fetch recent bot detection events
      const { data: botEvents, error: botError } = await supabase
        .from("bot_detection_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25);

      // Fetch recent rate limit violations
      const { data: rateLimitEvents, error: rateLimitError } = await supabase
        .from("rate_limit_violations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(25);

      if (botError || rateLimitError) {
        throw new Error("Failed to fetch historical events");
      }

      // Combine and sort by created_at
      const combinedItems: FeedItem[] = [
        ...(botEvents || []).map((e) => ({ type: "bot" as const, data: e as BotEvent })),
        ...(rateLimitEvents || []).map((e) => ({ type: "rate_limit" as const, data: e as RateLimitViolation })),
      ].sort((a, b) => 
        new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
      ).slice(0, MAX_FEED_ITEMS);

      setFeedItems(combinedItems);
      setBotEventCount((botEvents || []).length);
      setRateLimitCount((rateLimitEvents || []).length);
      setLastRefresh(new Date());

      if (showToast) {
        toast({
          title: "Feed refreshed",
          description: `Loaded ${combinedItems.length} historical events`,
        });
      }
    } catch (error) {
      console.error("Error fetching historical events:", error);
      toast({
        title: "Error",
        description: "Failed to fetch historical events",
        variant: "destructive",
      });
    } finally {
      setIsLoadingHistory(false);
    }
  }, [toast]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    // Initial fetch
    fetchHistoricalEvents();

    // Set up interval
    const intervalId = setInterval(() => {
      fetchHistoricalEvents();
    }, refreshInterval * 1000);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchHistoricalEvents]);

  const exportToJson = () => {
    const exportData = filteredFeedItems.map((item) => {
      const ipAddress = item.type === "bot" ? item.data.ip_address : item.data.ip_address;
      const location = ipAddress ? locations[ipAddress] : null;
      
      if (item.type === "bot") {
        const config = EVENT_TYPE_CONFIG[item.data.event_type];
        return {
          type: "bot_detection",
          event_type: item.data.event_type,
          label: config?.label || item.data.event_type,
          severity: config?.severity || "medium",
          ip_address: item.data.ip_address,
          user_agent: item.data.user_agent,
          location: location ? {
            country: location.country,
            countryCode: location.countryCode,
            region: location.region,
            city: location.city,
          } : null,
          details: item.data.details,
          created_at: item.data.created_at,
        };
      } else {
        return {
          type: "rate_limit_violation",
          severity: "high",
          function_name: item.data.function_name,
          ip_address: item.data.ip_address,
          request_count: item.data.request_count,
          max_requests: item.data.max_requests,
          location: location ? {
            country: location.country,
            countryCode: location.countryCode,
            region: location.region,
            city: location.city,
          } : null,
          created_at: item.data.created_at,
        };
      }
    });

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abuse-feed-${format(new Date(), "yyyy-MM-dd-HHmmss")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${exportData.length} events as JSON`,
    });
  };

  const exportToCsv = () => {
    const headers = [
      "Type",
      "Event Type",
      "Severity",
      "IP Address",
      "Country",
      "City",
      "Function Name",
      "Request Count",
      "Max Requests",
      "Created At",
    ];

    const rows = filteredFeedItems.map((item) => {
      const ipAddress = item.type === "bot" ? item.data.ip_address : item.data.ip_address;
      const location = ipAddress ? locations[ipAddress] : null;
      
      if (item.type === "bot") {
        const config = EVENT_TYPE_CONFIG[item.data.event_type];
        return [
          "bot_detection",
          config?.label || item.data.event_type,
          config?.severity || "medium",
          item.data.ip_address || "",
          location?.country || "",
          location?.city || "",
          "",
          "",
          "",
          item.data.created_at,
        ];
      } else {
        return [
          "rate_limit_violation",
          "Rate Limit Exceeded",
          "high",
          item.data.ip_address,
          location?.country || "",
          location?.city || "",
          item.data.function_name,
          String(item.data.request_count),
          String(item.data.max_requests),
          item.data.created_at,
        ];
      }
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abuse-feed-${format(new Date(), "yyyy-MM-dd-HHmmss")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: `Exported ${rows.length} events as CSV`,
    });
  };

  const blockIp = async (ipAddress: string, eventType: string) => {
    if (!ipAddress || blockedIps.has(ipAddress)) return;
    
    setBlockingIp(ipAddress);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("ip_blocklist")
        .insert({
          ip_address: ipAddress,
          reason: `Blocked from abuse feed - ${eventType}`,
          blocked_by: user?.id || null,
        });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation - IP already blocked
          toast({
            title: "Already Blocked",
            description: `IP ${ipAddress} is already in the blocklist`,
          });
          setBlockedIps((prev) => new Set([...prev, ipAddress]));
        } else {
          throw error;
        }
      } else {
        setBlockedIps((prev) => new Set([...prev, ipAddress]));
        toast({
          title: "🚫 IP Blocked",
          description: `${ipAddress} has been added to the blocklist`,
        });
      }
    } catch (error) {
      console.error("Failed to block IP:", error);
      toast({
        title: "Error",
        description: "Failed to block IP address",
        variant: "destructive",
      });
    } finally {
      setBlockingIp(null);
    }
  };

  const unblockIp = async (ipAddress: string) => {
    if (!ipAddress) return;
    
    setUnblockingIp(ipAddress);
    try {
      const { error } = await supabase
        .from("ip_blocklist")
        .delete()
        .eq("ip_address", ipAddress);

      if (error) throw error;

      setBlockedIps((prev) => {
        const next = new Set(prev);
        next.delete(ipAddress);
        return next;
      });
      setBlockedIpCount((prev) => Math.max(0, prev - 1));
      toast({
        title: "✅ IP Unblocked",
        description: `${ipAddress} has been removed from the blocklist`,
      });
    } catch (error) {
      console.error("Failed to unblock IP:", error);
      toast({
        title: "Error",
        description: "Failed to unblock IP address",
        variant: "destructive",
      });
    } finally {
      setUnblockingIp(null);
      setUnblockConfirmIp(null);
    }
  };

  // Bulk block IPs
  const bulkBlockIps = async () => {
    if (selectedIps.size === 0) return;
    
    setIsBulkBlocking(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ipsToBlock = Array.from(selectedIps);
      
      const { error } = await supabase
        .from("ip_blocklist")
        .insert(
          ipsToBlock.map((ip) => ({
            ip_address: ip,
            reason: "Bulk blocked from abuse feed",
            blocked_by: user?.id || null,
          }))
        );

      if (error) {
        if (error.code === "23505") {
          // Some IPs already blocked - partial success
          toast({
            title: "Partial Success",
            description: "Some IPs were already blocked",
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "🚫 IPs Blocked",
          description: `${ipsToBlock.length} IP${ipsToBlock.length !== 1 ? "s have" : " has"} been added to the blocklist`,
        });
      }

      // Update local state
      setBlockedIps((prev) => {
        const next = new Set(prev);
        ipsToBlock.forEach((ip) => next.add(ip));
        return next;
      });
      setSelectedIps(new Set());
    } catch (error) {
      console.error("Failed to bulk block IPs:", error);
      toast({
        title: "Error",
        description: "Failed to block IP addresses",
        variant: "destructive",
      });
    } finally {
      setIsBulkBlocking(false);
      setShowBulkBlockDialog(false);
    }
  };

  // Toggle IP selection
  const toggleIpSelection = (ip: string) => {
    setSelectedIps((prev) => {
      const next = new Set(prev);
      if (next.has(ip)) {
        next.delete(ip);
      } else {
        next.add(ip);
      }
      return next;
    });
  };

  // Select/deselect all visible IPs
  const toggleSelectAll = () => {
    if (selectedIps.size === selectableIps.size && selectableIps.size > 0) {
      setSelectedIps(new Set());
    } else {
      setSelectedIps(new Set(selectableIps));
    }
  };

  const getSeverityColor = (severity: "low" | "medium" | "high") => {
    switch (severity) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "medium":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "low":
        return "bg-muted text-muted-foreground border-muted";
    }
  };

  const renderFeedItem = (item: FeedItem, index: number) => {
    const isNew = index < 3;
    const ipAddress = item.type === "bot" ? item.data.ip_address : item.data.ip_address;
    const location = ipAddress ? locations[ipAddress] : null;
    
    if (item.type === "bot") {
      const config = EVENT_TYPE_CONFIG[item.data.event_type] || { 
        label: item.data.event_type, 
        icon: <Shield className="w-4 h-4" />,
        severity: "medium" as const,
      };
      
      const isSelectable = ipAddress && !blockedIps.has(ipAddress);
      const isSelected = ipAddress ? selectedIps.has(ipAddress) : false;

      return (
        <div
          key={`bot-${item.data.id}`}
          className={cn(
            "p-3 rounded-lg border transition-all duration-300",
            getSeverityColor(config.severity),
            isNew && "ring-2 ring-primary/20 animate-in fade-in slide-in-from-top-2",
            isSelected && "ring-2 ring-primary"
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              {/* Checkbox for multi-select */}
              {isSelectable && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleIpSelection(ipAddress!)}
                  aria-label={`Select ${ipAddress}`}
                  className="shrink-0"
                />
              )}
              {!isSelectable && ipAddress && blockedIps.has(ipAddress) && (
                <div className="w-4 h-4 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
                </div>
              )}
              <div className="p-1.5 rounded-md bg-background/50">
                {config.icon}
              </div>
              <div>
                <div className="font-medium text-sm">{config.label}</div>
                {item.data.ip_address && (
                  <div className="flex items-center gap-1.5 text-xs font-mono opacity-75">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => setFilterIp(item.data.ip_address!)}
                            className="hover:text-foreground hover:underline transition-colors cursor-pointer"
                          >
                            {item.data.ip_address}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>Click to filter by this IP</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {location && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-1 cursor-help">
                              <span>{getCountryFlag(location.countryCode)}</span>
                              <span className="text-muted-foreground">{location.city || location.country}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">
                              <div className="font-medium">{location.country}</div>
                              {location.region && <div>{location.region}</div>}
                              {location.city && <div>{location.city}</div>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {item.data.ip_address && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          if (blockedIps.has(item.data.ip_address!)) {
                            setUnblockConfirmIp(item.data.ip_address!);
                          } else {
                            blockIp(item.data.ip_address!, config.label);
                          }
                        }}
                        disabled={blockingIp === item.data.ip_address || unblockingIp === item.data.ip_address}
                      >
                        {blockingIp === item.data.ip_address || unblockingIp === item.data.ip_address ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : blockedIps.has(item.data.ip_address) ? (
                          <ShieldCheck className="w-3 h-3 text-green-600" />
                        ) : (
                          <Ban className="w-3 h-3" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {blockedIps.has(item.data.ip_address) ? "Click to unblock" : "Block IP"}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Badge variant="outline" className="text-xs">
                <Bot className="w-3 h-3 mr-1" />
                Bot
              </Badge>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="text-xs opacity-60 cursor-help">
                      {formatDistanceToNow(new Date(item.data.created_at), { addSuffix: true })}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    {format(new Date(item.data.created_at), "PPpp")}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      );
    }

    // Rate limit violation
    const isSelectable = ipAddress && !blockedIps.has(ipAddress);
    const isSelected = ipAddress ? selectedIps.has(ipAddress) : false;
    return (
      <div
        key={`rate-${item.data.id}`}
        className={cn(
          "p-3 rounded-lg border transition-all duration-300",
          "bg-destructive/10 text-destructive border-destructive/30",
          isNew && "ring-2 ring-primary/20 animate-in fade-in slide-in-from-top-2",
          isSelected && "ring-2 ring-primary"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            {/* Checkbox for multi-select */}
            {isSelectable && (
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleIpSelection(ipAddress!)}
                aria-label={`Select ${ipAddress}`}
                className="shrink-0"
              />
            )}
            {!isSelectable && ipAddress && blockedIps.has(ipAddress) && (
              <div className="w-4 h-4 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              </div>
            )}
            <div className="p-1.5 rounded-md bg-background/50">
              <Gauge className="w-4 h-4" />
            </div>
            <div>
              <div className="font-medium text-sm">Rate Limit Exceeded</div>
              <div className="text-xs opacity-75">
                {item.data.function_name} • {item.data.request_count}/{item.data.max_requests} requests
              </div>
              <div className="flex items-center gap-1.5 text-xs font-mono opacity-75">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setFilterIp(item.data.ip_address)}
                        className="hover:text-foreground hover:underline transition-colors cursor-pointer"
                      >
                        {item.data.ip_address}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Click to filter by this IP</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {location && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 cursor-help">
                          <span>{getCountryFlag(location.countryCode)}</span>
                          <span className="text-muted-foreground">{location.city || location.country}</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs">
                          <div className="font-medium">{location.country}</div>
                          {location.region && <div>{location.region}</div>}
                          {location.city && <div>{location.city}</div>}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      if (blockedIps.has(item.data.ip_address)) {
                        setUnblockConfirmIp(item.data.ip_address);
                      } else {
                        blockIp(item.data.ip_address, "Rate Limit Violation");
                      }
                    }}
                    disabled={blockingIp === item.data.ip_address || unblockingIp === item.data.ip_address}
                  >
                    {blockingIp === item.data.ip_address || unblockingIp === item.data.ip_address ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : blockedIps.has(item.data.ip_address) ? (
                      <ShieldCheck className="w-3 h-3 text-green-600" />
                    ) : (
                      <Ban className="w-3 h-3" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {blockedIps.has(item.data.ip_address) ? "Click to unblock" : "Block IP"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Badge variant="outline" className="text-xs">
              <ShieldAlert className="w-3 h-3 mr-1" />
              Rate
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs opacity-60 cursor-help">
                    {formatDistanceToNow(new Date(item.data.created_at), { addSuffix: true })}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {format(new Date(item.data.created_at), "PPpp")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">Real-Time Abuse Monitoring</CardTitle>
              <CardDescription className="text-sm">
                Live feed of bot detection events and rate limit violations
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                <Wifi className="w-3 h-3 mr-1" />
                Live
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30">
                <WifiOff className="w-3 h-3 mr-1" />
                Disconnected
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Bot Events</div>
            <div className="text-xl font-bold">
              <AnimatedCounter value={botEventCount} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Rate Limits</div>
            <div className="text-xl font-bold text-destructive">
              <AnimatedCounter value={rateLimitCount} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Ban className="w-3 h-3" />
              Blocked IPs
            </div>
            <div className="text-xl font-bold text-amber-600">
              <AnimatedCounter value={blockedIpCount} />
            </div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Feed Items</div>
            <div className="text-xl font-bold">{feedItems.length}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="text-xl font-bold">
              {isPaused ? "Paused" : "Active"}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filterType} onValueChange={(value: "all" | "bot" | "rate_limit") => setFilterType(value)}>
                <SelectTrigger className="w-[130px] h-8 text-sm">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="bot">Bot Events</SelectItem>
                  <SelectItem value="rate_limit">Rate Limits</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterSeverity} onValueChange={(value: "all" | "high" | "medium" | "low") => setFilterSeverity(value)}>
                <SelectTrigger className="w-[130px] h-8 text-sm">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="high">🔴 High</SelectItem>
                  <SelectItem value="medium">🟠 Medium</SelectItem>
                  <SelectItem value="low">🟢 Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Filter by IP..."
                  value={filterIp}
                  onChange={(e) => setFilterIp(e.target.value)}
                  className="h-8 w-[160px] pl-8 pr-8 text-sm font-mono"
                />
                {filterIp && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0.5 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setFilterIp("")}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-toasts"
                checked={showToasts}
                onCheckedChange={setShowToasts}
              />
              <Label htmlFor="show-toasts" className="text-sm flex items-center gap-1">
                {showToasts ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                Notifications
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="play-sounds"
                checked={playSounds}
                onCheckedChange={setPlaySounds}
              />
              <Label htmlFor="play-sounds" className="text-sm flex items-center gap-1">
                {playSounds ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                Sound Alerts
              </Label>
            </div>
            <div className="flex items-center gap-2 border-l pl-4 ml-2">
              <Switch
                id="auto-refresh"
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
              />
              <Label htmlFor="auto-refresh" className="text-sm flex items-center gap-1">
                <RefreshCw className={cn("w-4 h-4", autoRefresh && "animate-spin")} />
                Auto-refresh
              </Label>
              {autoRefresh && (
                <Select 
                  value={String(refreshInterval)} 
                  onValueChange={(v) => setRefreshInterval(Number(v))}
                >
                  <SelectTrigger className="w-[80px] h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15s</SelectItem>
                    <SelectItem value="30">30s</SelectItem>
                    <SelectItem value="60">1m</SelectItem>
                    <SelectItem value="120">2m</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lastRefresh && (
              <span className="text-xs text-muted-foreground hidden md:inline">
                Last refresh: {formatDistanceToNow(lastRefresh, { addSuffix: true })}
              </span>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchHistoricalEvents(true)}
                    disabled={isLoadingHistory}
                  >
                    {isLoadingHistory ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <History className="w-4 h-4" />
                    )}
                    <span className="ml-1 hidden sm:inline">Load History</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Fetch recent historical events from the database</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filteredFeedItems.length === 0}
                >
                  <Download className="w-4 h-4 mr-1" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={exportToJson}>
                  Export as JSON
                </DropdownMenuItem>
                <DropdownMenuItem onClick={exportToCsv}>
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPaused(!isPaused)}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-1" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-1" />
                  Pause
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFeed}
              disabled={feedItems.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectableIps.size > 0 && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 border">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleSelectAll}
                className="h-8 gap-2"
              >
                {selectedIps.size === selectableIps.size && selectableIps.size > 0 ? (
                  <CheckSquare className="w-4 h-4" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                {selectedIps.size === selectableIps.size && selectableIps.size > 0
                  ? "Deselect All"
                  : `Select All (${selectableIps.size})`}
              </Button>
              {selectedIps.size > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedIps.size} IP{selectedIps.size !== 1 ? "s" : ""} selected
                </span>
              )}
            </div>
            {selectedIps.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkBlockDialog(true)}
                className="gap-2"
              >
                <Ban className="w-4 h-4" />
                Block {selectedIps.size} IP{selectedIps.size !== 1 ? "s" : ""}
              </Button>
            )}
          </div>
        )}

        {/* Feed */}
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-2">
            {filteredFeedItems.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {feedItems.length === 0 ? "Monitoring Active" : "No Matching Events"}
                </p>
                <p className="text-sm">
                  {isPaused 
                    ? "Feed is paused. Click Resume to continue monitoring."
                    : feedItems.length === 0
                    ? "Waiting for new bot detection events or rate limit violations..."
                    : "No events match the current filters."
                  }
                </p>
              </div>
            ) : (
              filteredFeedItems.map((item, index) => renderFeedItem(item, index))
            )}
          </div>
        </ScrollArea>
      </CardContent>

      {/* Unblock Confirmation Dialog */}
      <AlertDialog open={!!unblockConfirmIp} onOpenChange={(open) => !open && setUnblockConfirmIp(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock IP Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unblock <span className="font-mono font-medium">{unblockConfirmIp}</span>? 
              This IP will be able to access the system again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unblockConfirmIp && unblockIp(unblockConfirmIp)}
              className="bg-green-600 hover:bg-green-700"
            >
              {unblockingIp ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Unblocking...
                </>
              ) : (
                "Unblock IP"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Block Confirmation Dialog */}
      <AlertDialog open={showBulkBlockDialog} onOpenChange={setShowBulkBlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block {selectedIps.size} IP Address{selectedIps.size !== 1 ? "es" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to block the following IP addresses?
              <span className="block mt-2 max-h-32 overflow-y-auto rounded bg-muted p-2 font-mono text-xs">
                {Array.from(selectedIps).join(", ")}
              </span>
              <span className="block mt-2">
                These IPs will be blocked from signing up and accessing the system.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkBlocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={bulkBlockIps}
              disabled={isBulkBlocking}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isBulkBlocking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Blocking...
                </>
              ) : (
                `Block ${selectedIps.size} IP${selectedIps.size !== 1 ? "s" : ""}`
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default AbuseMonitoringFeed;
