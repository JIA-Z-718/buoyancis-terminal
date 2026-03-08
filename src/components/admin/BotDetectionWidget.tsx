import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Bot, Clock, AlertTriangle, ShieldAlert, Gauge, Download, Mail, AtSign, Filter, CalendarIcon, X, ChevronLeft, ChevronRight, ShieldBan, ShieldOff, Loader2, Check, Globe, ChevronDown, ChevronUp, Search, Copy, MapPin } from "lucide-react";
import { format, subDays, parseISO, startOfDay, isWithinInterval, endOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useIpGeolocation, getCountryFlag } from "@/hooks/useIpGeolocation";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import BotDetectionWorldMap from "./BotDetectionWorldMap";
import { AnimatedCounter } from "@/components/ui/animated-counter";

interface BotEvent {
  id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

type TimeRange = "7d" | "14d" | "30d";

const EVENT_TYPE_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  honeypot: { label: "Honeypot", color: "hsl(var(--chart-1))", icon: <Bot className="w-4 h-4" /> },
  timing: { label: "Timing Violation", color: "hsl(var(--chart-2))", icon: <Clock className="w-4 h-4" /> },
  captcha_failure: { label: "CAPTCHA Failure", color: "hsl(var(--chart-3))", icon: <ShieldAlert className="w-4 h-4" /> },
  suspicious_ua: { label: "Suspicious UA", color: "hsl(var(--chart-4))", icon: <AlertTriangle className="w-4 h-4" /> },
  challenge_failure: { label: "Challenge Failure", color: "hsl(var(--chart-5))", icon: <Shield className="w-4 h-4" /> },
  rate_limit: { label: "Rate Limited", color: "hsl(var(--destructive))", icon: <Gauge className="w-4 h-4" /> },
  spam_domain: { label: "Spam Domain", color: "hsl(var(--chart-1))", icon: <Mail className="w-4 h-4" /> },
  typo_domain: { label: "Email Typo", color: "hsl(var(--chart-2))", icon: <AtSign className="w-4 h-4" /> },
  ip_blocked: { label: "IP Blocked", color: "hsl(var(--destructive))", icon: <Shield className="w-4 h-4" /> },
  geo_blocked: { label: "Geo Blocked", color: "hsl(220 70% 50%)", icon: <Globe className="w-4 h-4" /> },
};

const BotDetectionWidget = () => {
  const [events, setEvents] = useState<BotEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>("7d");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [ipFilter, setIpFilter] = useState<string>("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [isFilterTransitioning, setIsFilterTransitioning] = useState(false);
  const [screenReaderAnnouncement, setScreenReaderAnnouncement] = useState("");
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [legendScrollInfo, setLegendScrollInfo] = useState({ scrollTop: 0, scrollHeight: 0, clientHeight: 0 });
  const [isDraggingMinimap, setIsDraggingMinimap] = useState(false);
  const minimapTrackRef = useRef<HTMLDivElement>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [blockingIp, setBlockingIp] = useState<string | null>(null);
  const [unblockingIp, setUnblockingIp] = useState<string | null>(null);
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());
  // Single block confirmation state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [pendingBlockIp, setPendingBlockIp] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState("");
  // Bulk operations state
  const [bulkBlockDialogOpen, setBulkBlockDialogOpen] = useState(false);
  const [bulkUnblockDialogOpen, setBulkUnblockDialogOpen] = useState(false);
  const [bulkBlockReason, setBulkBlockReason] = useState("");
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  // Top IPs bulk block dialog
  const [topIpsBlockDialogOpen, setTopIpsBlockDialogOpen] = useState(false);
  const [topIpsBlockReason, setTopIpsBlockReason] = useState("");
  // Top IPs expanded view, search, and country filter
  const [showAllTopIps, setShowAllTopIps] = useState(false);
  const [topIpsSearch, setTopIpsSearch] = useState("");
  const [topIpsCountryFilter, setTopIpsCountryFilter] = useState<string>("all");
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  // Email export state
  const [emailExportDialogOpen, setEmailExportDialogOpen] = useState(false);
  const [exportEmail, setExportEmail] = useState("");
  const [isSendingExport, setIsSendingExport] = useState(false);
  const { toast } = useToast();
  
  // Ref for legend scroll container
  const legendContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBlockedIps = async () => {
      const { data } = await supabase
        .from("ip_blocklist")
        .select("ip_address");
      if (data) {
        setBlockedIps(new Set(data.map((d) => d.ip_address)));
      }
    };
    fetchBlockedIps();
  }, []);

  // Get unique IPs for geolocation lookup (before filtering by country)
  const allUniqueIps = useMemo(() => {
    return [...new Set(events.filter((e) => e.ip_address).map((e) => e.ip_address as string))];
  }, [events]);

  const { locations: geoLocations, isLoading: isLoadingGeo } = useIpGeolocation(allUniqueIps);

  // Extract unique countries for the filter dropdown
  const availableCountries = useMemo(() => {
    const countries = new Map<string, string>();
    Object.values(geoLocations).forEach((geo) => {
      if (geo?.countryCode && geo?.country) {
        countries.set(geo.countryCode, geo.country);
      }
    });
    return Array.from(countries.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [geoLocations]);

  // Filter events based on selected filters
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Event type filter
      if (eventTypeFilter !== "all" && event.event_type !== eventTypeFilter) {
        return false;
      }
      
      // IP address filter
      if (ipFilter && event.ip_address && !event.ip_address.toLowerCase().includes(ipFilter.toLowerCase())) {
        return false;
      }

      // Country filter
      if (countryFilter !== "all" && event.ip_address) {
        const geo = geoLocations[event.ip_address];
        if (!geo || geo.countryCode !== countryFilter) {
          return false;
        }
      }
      
      // Date range filter
      if (dateRange?.from) {
        const eventDate = parseISO(event.created_at);
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        if (!isWithinInterval(eventDate, { start: from, end: to })) {
          return false;
        }
      }
      
      return true;
    });
  }, [events, eventTypeFilter, ipFilter, countryFilter, geoLocations, dateRange]);

  // Smooth transition wrapper for country filter changes
  const handleCountryFilterChange = useCallback((code: string) => {
    if (code === countryFilter) return;
    setIsFilterTransitioning(true);
    // Short delay to trigger exit animation, then update filter
    setTimeout(() => {
      setCountryFilter(code);
      // Allow enter animation to complete
      setTimeout(() => setIsFilterTransitioning(false), 150);
    }, 100);
  }, [countryFilter]);

  const clearFilters = () => {
    setIsFilterTransitioning(true);
    setTimeout(() => {
      setEventTypeFilter("all");
      setIpFilter("");
      setCountryFilter("all");
      setDateRange(undefined);
      setTimeout(() => setIsFilterTransitioning(false), 150);
    }, 100);
  };

  const hasActiveFilters = eventTypeFilter !== "all" || ipFilter !== "" || countryFilter !== "all" || dateRange !== undefined;

  // Scroll selected legend item into view when country filter changes
  useEffect(() => {
    if (countryFilter !== "all" && legendContainerRef.current) {
      const selectedButton = legendContainerRef.current.querySelector(`[data-country="${countryFilter}"]`);
      if (selectedButton) {
        selectedButton.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
  }, [countryFilter]);

  // Track legend scroll position for mini-map
  const handleLegendScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setLegendScrollInfo({
      scrollTop: target.scrollTop,
      scrollHeight: target.scrollHeight,
      clientHeight: target.clientHeight,
    });
  }, []);

  // Handle minimap drag scrolling
  const handleMinimapDrag = useCallback((clientY: number) => {
    if (!legendContainerRef.current || !minimapTrackRef.current) return;
    const rect = minimapTrackRef.current.getBoundingClientRect();
    const clickY = Math.max(0, Math.min(clientY - rect.top, rect.height));
    const clickPercent = clickY / rect.height;
    const scrollableHeight = legendScrollInfo.scrollHeight - legendScrollInfo.clientHeight;
    const targetScroll = clickPercent * scrollableHeight;
    legendContainerRef.current.scrollTop = targetScroll;
  }, [legendScrollInfo.scrollHeight, legendScrollInfo.clientHeight]);

  // Mouse move and mouse up handlers for drag
  useEffect(() => {
    if (!isDraggingMinimap) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleMinimapDrag(e.clientY);
    };

    const handleMouseUp = () => {
      setIsDraggingMinimap(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDraggingMinimap, handleMinimapDrag]);

  const fetchEvents = async () => {
    setIsLoading(true);
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30;
    const startDate = subDays(new Date(), daysAgo).toISOString();

    const { data, error } = await supabase
      .from("bot_detection_events")
      .select("*")
      .gte("created_at", startDate)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching bot detection events:", error);
    } else {
      setEvents((data as BotEvent[]) || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel("bot-detection-events")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bot_detection_events" },
        (payload) => {
          setEvents((prev) => [payload.new as BotEvent, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [timeRange]);

  // Calculate stats by event type (uses filtered events)
  const statsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEvents.forEach((event) => {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      type,
      count,
      label: EVENT_TYPE_CONFIG[type]?.label || type,
      color: EVENT_TYPE_CONFIG[type]?.color || "hsl(var(--muted))",
    }));
  }, [filteredEvents]);

  // Calculate daily trend data (uses filtered events)
  const trendData = useMemo(() => {
    const daysAgo = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30;
    const days = Array.from({ length: daysAgo }, (_, i) => {
      const date = subDays(new Date(), daysAgo - 1 - i);
      return {
        date: format(date, "yyyy-MM-dd"),
        label: format(date, "MMM d"),
        honeypot: 0,
        timing: 0,
        captcha_failure: 0,
        suspicious_ua: 0,
        challenge_failure: 0,
        rate_limit: 0,
        total: 0,
      };
    });

    filteredEvents.forEach((event) => {
      const eventDate = format(parseISO(event.created_at), "yyyy-MM-dd");
      const dayData = days.find((d) => d.date === eventDate);
      if (dayData && event.event_type in dayData) {
        const eventType = event.event_type as keyof typeof dayData;
        if (typeof dayData[eventType] === 'number') {
          (dayData[eventType] as number) += 1;
        }
        dayData.total += 1;
      }
    });

    return days;
  }, [filteredEvents, timeRange]);

  // Get unique IPs blocked (uses filtered events)
  const uniqueIPs = useMemo(() => {
    const ips = new Set(filteredEvents.filter((e) => e.ip_address).map((e) => e.ip_address));
    return ips.size;
  }, [filteredEvents]);

  // Get top blocked IPs (uses filtered events) - get all for expanded view
  const allTopBlockedIPs = useMemo(() => {
    const ipCounts: Record<string, number> = {};
    filteredEvents.forEach((event) => {
      if (event.ip_address) {
        ipCounts[event.ip_address] = (ipCounts[event.ip_address] || 0) + 1;
      }
    });
    return Object.entries(ipCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([ip, count]) => ({ ip, count }));
  }, [filteredEvents]);

  // Extract unique countries from top IPs for the filter dropdown
  const topIpsAvailableCountries = useMemo(() => {
    const countries = new Map<string, string>();
    allTopBlockedIPs.forEach(({ ip }) => {
      const geo = geoLocations[ip];
      if (geo?.countryCode && geo?.country) {
        countries.set(geo.countryCode, geo.country);
      }
    });
    return Array.from(countries.entries())
      .map(([code, name]) => ({ code, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allTopBlockedIPs, geoLocations]);

  // Displayed top IPs based on expanded state, search filter, and country filter
  const topBlockedIPs = useMemo(() => {
    let filtered = allTopBlockedIPs;
    
    // Apply search filter
    if (topIpsSearch.trim()) {
      const searchLower = topIpsSearch.toLowerCase().trim();
      filtered = filtered.filter(({ ip }) => 
        ip.toLowerCase().includes(searchLower)
      );
    }

    // Apply country filter
    if (topIpsCountryFilter !== "all") {
      filtered = filtered.filter(({ ip }) => {
        const geo = geoLocations[ip];
        return geo?.countryCode === topIpsCountryFilter;
      });
    }
    
    // Apply limit based on expanded state
    const limit = showAllTopIps ? 20 : 5;
    return filtered.slice(0, limit);
  }, [allTopBlockedIPs, showAllTopIps, topIpsSearch, topIpsCountryFilter, geoLocations]);

  // Stats for Top Blocked IPs bulk actions
  const topIpStats = useMemo(() => {
    const ips = topBlockedIPs.map(({ ip }) => ip);
    const unblockedIps = ips.filter((ip) => !blockedIps.has(ip));
    const currentlyBlockedIps = ips.filter((ip) => blockedIps.has(ip));
    return { ips, unblockedIps, currentlyBlockedIps };
  }, [topBlockedIPs, blockedIps]);

  // Calculate country distribution from all filtered events
  const countryDistribution = useMemo(() => {
    const countryCounts: Record<string, { count: number; name: string; code: string }> = {};
    filteredEvents.forEach((event) => {
      if (event.ip_address) {
        const geo = geoLocations[event.ip_address];
        if (geo?.countryCode && geo?.country) {
          if (!countryCounts[geo.countryCode]) {
            countryCounts[geo.countryCode] = { count: 0, name: geo.country, code: geo.countryCode };
          }
          countryCounts[geo.countryCode].count += 1;
        }
      }
    });
    return Object.values(countryCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8); // Top 8 countries for chart
  }, [filteredEvents, geoLocations]);

  // Update scroll info when legend content changes
  useEffect(() => {
    if (legendContainerRef.current) {
      const target = legendContainerRef.current;
      setLegendScrollInfo({
        scrollTop: target.scrollTop,
        scrollHeight: target.scrollHeight,
        clientHeight: target.clientHeight,
      });
    }
  }, [countryDistribution]);

  // Colors for country pie chart
  const COUNTRY_COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
  ];

  const chartConfig = {
    honeypot: { label: "Honeypot", color: "hsl(var(--chart-1))" },
    timing: { label: "Timing", color: "hsl(var(--chart-2))" },
    captcha_failure: { label: "CAPTCHA", color: "hsl(var(--chart-3))" },
    suspicious_ua: { label: "Suspicious UA", color: "hsl(var(--chart-4))" },
    challenge_failure: { label: "Challenge", color: "hsl(var(--chart-5))" },
    rate_limit: { label: "Rate Limit", color: "hsl(var(--destructive))" },
    spam_domain: { label: "Spam Domain", color: "hsl(var(--chart-1))" },
    typo_domain: { label: "Email Typo", color: "hsl(var(--chart-2))" },
  };

  const exportToCSV = () => {
    if (filteredEvents.length === 0) {
      toast({
        title: "No data to export",
        description: "There are no bot detection events to export.",
        variant: "destructive",
      });
      return;
    }

    const headers = ["Event Type", "IP Address", "User Agent", "Details", "Created At"];
    
    const rows = filteredEvents.map((event) => {
      const eventLabel = EVENT_TYPE_CONFIG[event.event_type]?.label || event.event_type;
      return [
        eventLabel,
        event.ip_address || "N/A",
        event.user_agent || "N/A",
        event.details ? JSON.stringify(event.details) : "",
        format(parseISO(event.created_at), "yyyy-MM-dd HH:mm:ss"),
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `bot-detection-events-${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export complete",
      description: `Exported ${filteredEvents.length} event(s) to CSV.`,
    });
  };

  // Build filter description for email
  const getFilterDescription = () => {
    const parts: string[] = [];
    if (eventTypeFilter !== "all") {
      parts.push(`Type: ${EVENT_TYPE_CONFIG[eventTypeFilter]?.label || eventTypeFilter}`);
    }
    if (ipFilter) {
      parts.push(`IP: ${ipFilter}`);
    }
    if (countryFilter !== "all") {
      const country = availableCountries.find(c => c.code === countryFilter);
      parts.push(`Country: ${country?.name || countryFilter}`);
    }
    if (dateRange?.from) {
      parts.push(`Date: ${format(dateRange.from, "MMM d")}${dateRange.to ? ` - ${format(dateRange.to, "MMM d")}` : ""}`);
    }
    return parts.length > 0 ? parts.join(", ") : "No filters applied";
  };

  // Email export function
  const handleEmailExport = async () => {
    if (!exportEmail.trim()) {
      toast({
        title: "Email required",
        description: "Please enter an email address to receive the export.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingExport(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("export-events-email", {
        body: {
          events: filteredEvents.map(e => ({
            event_type: e.event_type,
            ip_address: e.ip_address,
            user_agent: e.user_agent,
            details: e.details,
            created_at: format(parseISO(e.created_at), "yyyy-MM-dd HH:mm:ss"),
          })),
          recipientEmail: exportEmail.trim(),
          filterDescription: getFilterDescription(),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to send export");
      }

      toast({
        title: "Export sent!",
        description: `Check ${exportEmail} for the download link.`,
      });

      setEmailExportDialogOpen(false);
      setExportEmail("");
    } catch (error) {
      console.error("Error sending export email:", error);
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Failed to send export email",
        variant: "destructive",
      });
    } finally {
      setIsSendingExport(false);
    }
  };

  // Open block confirmation dialog
  const openBlockDialog = (ip: string) => {
    setPendingBlockIp(ip);
    setBlockReason("Blocked from bot detection events");
    setBlockDialogOpen(true);
  };

  // Handle confirmed block
  const handleConfirmBlock = async () => {
    if (!pendingBlockIp) return;
    
    setBlockDialogOpen(false);
    setBlockingIp(pendingBlockIp);
    
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase.from("ip_blocklist").insert({
      ip_address: pendingBlockIp,
      reason: blockReason.trim() || null,
      blocked_by: userData?.user?.id || null,
    });

    if (error) {
      if (error.code === "23505") {
        setBlockedIps((prev) => new Set([...prev, pendingBlockIp]));
        toast({
          title: "Already blocked",
          description: `${pendingBlockIp} is already in the blocklist`,
        });
      } else {
        console.error("Error blocking IP:", error);
        toast({
          title: "Error",
          description: "Failed to block IP address",
          variant: "destructive",
        });
      }
    } else {
      setBlockedIps((prev) => new Set([...prev, pendingBlockIp]));
      toast({
        title: "IP blocked",
        description: `${pendingBlockIp} has been added to the blocklist`,
      });
    }
    
    setBlockingIp(null);
    setPendingBlockIp(null);
    setBlockReason("");
  };

  // Handle unblock
  const handleUnblockIp = async (ip: string) => {
    setUnblockingIp(ip);
    
    const { error } = await supabase
      .from("ip_blocklist")
      .delete()
      .eq("ip_address", ip);

    if (error) {
      console.error("Error unblocking IP:", error);
      toast({
        title: "Error",
        description: "Failed to unblock IP address",
        variant: "destructive",
      });
    } else {
      setBlockedIps((prev) => {
        const newSet = new Set(prev);
        newSet.delete(ip);
        return newSet;
      });
      toast({
        title: "IP unblocked",
        description: `${ip} has been removed from the blocklist`,
      });
    }
    
    setUnblockingIp(null);
  };

  // Get IPs for bulk operations based on filtered events
  const bulkIpStats = useMemo(() => {
    const uniqueIps = [...new Set(filteredEvents.filter((e) => e.ip_address).map((e) => e.ip_address as string))];
    const unblockedIps = uniqueIps.filter((ip) => !blockedIps.has(ip));
    const currentlyBlockedIps = uniqueIps.filter((ip) => blockedIps.has(ip));
    return { uniqueIps, unblockedIps, currentlyBlockedIps };
  }, [filteredEvents, blockedIps]);

  // Handle bulk block
  const handleBulkBlock = async () => {
    if (bulkIpStats.unblockedIps.length === 0) return;
    
    setIsBulkProcessing(true);
    setBulkBlockDialogOpen(false);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = bulkIpStats.unblockedIps.map((ip) => ({
        ip_address: ip,
        reason: bulkBlockReason.trim() || "Bulk blocked from bot detection events",
        blocked_by: userData?.user?.id || null,
      }));
      
      const { error } = await supabase.from("ip_blocklist").insert(insertData);

      if (error && error.code !== "23505") {
        throw error;
      }
      
      setBlockedIps((prev) => {
        const newSet = new Set(prev);
        bulkIpStats.unblockedIps.forEach((ip) => newSet.add(ip));
        return newSet;
      });
      
      toast({ 
        title: "IPs blocked", 
        description: `${bulkIpStats.unblockedIps.length} IP${bulkIpStats.unblockedIps.length > 1 ? "s" : ""} added to the blocklist` 
      });
    } catch (error) {
      console.error("Error bulk blocking IPs:", error);
      toast({ title: "Error", description: "Failed to block IP addresses", variant: "destructive" });
    } finally {
      setIsBulkProcessing(false);
      setBulkBlockReason("");
    }
  };

  // Handle bulk unblock
  const handleBulkUnblock = async () => {
    if (bulkIpStats.currentlyBlockedIps.length === 0) return;
    
    setIsBulkProcessing(true);
    setBulkUnblockDialogOpen(false);
    
    try {
      const { error } = await supabase
        .from("ip_blocklist")
        .delete()
        .in("ip_address", bulkIpStats.currentlyBlockedIps);

      if (error) throw error;
      
      setBlockedIps((prev) => {
        const newSet = new Set(prev);
        bulkIpStats.currentlyBlockedIps.forEach((ip) => newSet.delete(ip));
        return newSet;
      });
      
      toast({ 
        title: "IPs unblocked", 
        description: `${bulkIpStats.currentlyBlockedIps.length} IP${bulkIpStats.currentlyBlockedIps.length > 1 ? "s" : ""} removed from the blocklist` 
      });
    } catch (error) {
      console.error("Error bulk unblocking IPs:", error);
      toast({ title: "Error", description: "Failed to unblock IP addresses", variant: "destructive" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  // Handle bulk block for top IPs section
  const handleTopIpsBulkBlock = async () => {
    if (topIpStats.unblockedIps.length === 0) return;
    
    setIsBulkProcessing(true);
    setTopIpsBlockDialogOpen(false);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = topIpStats.unblockedIps.map((ip) => ({
        ip_address: ip,
        reason: topIpsBlockReason.trim() || "Bulk blocked from top repeat offenders",
        blocked_by: userData?.user?.id || null,
      }));
      
      const { error } = await supabase.from("ip_blocklist").insert(insertData);

      if (error && error.code !== "23505") {
        throw error;
      }
      
      setBlockedIps((prev) => {
        const newSet = new Set(prev);
        topIpStats.unblockedIps.forEach((ip) => newSet.add(ip));
        return newSet;
      });
      
      toast({ 
        title: "Top offenders blocked", 
        description: `${topIpStats.unblockedIps.length} IP${topIpStats.unblockedIps.length > 1 ? "s" : ""} added to the blocklist` 
      });
    } catch (error) {
      console.error("Error bulk blocking top IPs:", error);
      toast({ title: "Error", description: "Failed to block IP addresses", variant: "destructive" });
    } finally {
      setIsBulkProcessing(false);
      setTopIpsBlockReason("");
    }
  };

  // Keyboard navigation for country filter
  // Announce country selection to screen readers
  const announceCountry = useCallback((code: string) => {
    if (code === "all") {
      setScreenReaderAnnouncement("Country filter cleared. Showing all countries.");
    } else {
      const country = countryDistribution.find(c => c.code === code);
      if (country) {
        const index = countryDistribution.findIndex(c => c.code === code) + 1;
        setScreenReaderAnnouncement(
          `${country.name}, ${country.count} events, ${index} of ${countryDistribution.length} countries`
        );
      }
    }
  }, [countryDistribution]);

  const handleGeoKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (countryDistribution.length === 0) return;
    
    const currentIndex = countryFilter === "all" 
      ? -1 
      : countryDistribution.findIndex(c => c.code === countryFilter);
    
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = currentIndex + 1 >= countryDistribution.length ? 0 : currentIndex + 1;
      const nextCode = countryDistribution[nextIndex].code;
      handleCountryFilterChange(nextCode);
      announceCountry(nextCode);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      const prevIndex = currentIndex <= 0 ? countryDistribution.length - 1 : currentIndex - 1;
      const prevCode = countryDistribution[prevIndex].code;
      handleCountryFilterChange(prevCode);
      announceCountry(prevCode);
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCountryFilterChange("all");
      announceCountry("all");
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (countryFilter !== "all") {
        handleCountryFilterChange("all");
        announceCountry("all");
      } else if (countryDistribution.length > 0) {
        const firstCode = countryDistribution[0].code;
        handleCountryFilterChange(firstCode);
        announceCountry(firstCode);
      }
    }
  }, [countryDistribution, countryFilter, handleCountryFilterChange, announceCountry]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Bot Detection Statistics
          </CardTitle>
          <CardDescription>Loading security event data...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="text-center p-4 rounded-lg bg-muted/50">
                <Skeleton className="h-9 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </div>
            ))}
          </div>

          {/* Trend Chart Skeleton */}
          <div>
            <Skeleton className="h-4 w-24 mb-3" />
            <div className="h-[200px] flex items-end gap-2 p-4 bg-muted/30 rounded-lg">
              {[...Array(7)].map((_, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end gap-1">
                  <Skeleton 
                    className="w-full rounded-t" 
                    style={{ height: `${Math.random() * 60 + 20}%` }} 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Geographic & Breakdown Skeleton */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pie Chart Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-40" />
              <div className="flex items-center gap-4">
                <div className="relative h-[160px] w-[160px]">
                  <Skeleton className="absolute inset-0 rounded-full" />
                  <div className="absolute inset-[25%] rounded-full bg-background" />
                </div>
                <div className="flex-1 space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Skeleton className="h-3 w-3 rounded-sm" />
                      <Skeleton className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Breakdown Skeleton */}
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top IPs Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Events Table Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <div className="rounded-lg border">
              <div className="flex items-center gap-4 p-3 border-b bg-muted/30">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-4 flex-1" />
                ))}
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3 border-b last:border-0">
                  {[...Array(5)].map((_, j) => (
                    <Skeleton key={j} className="h-4 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Bot Detection Statistics
            </CardTitle>
            <CardDescription>
              Monitor blocked bot attempts and security events
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={showFilters ? "secondary" : "outline"} 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  !
                </Badge>
              )}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToCSV}
              disabled={filteredEvents.length === 0}
              className="gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as TimeRange)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="14d">Last 14 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters Panel */}
        {showFilters && (
          <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Filter Events</h4>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 gap-1">
                  <X className="h-3 w-3" />
                  Clear all
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Event Type Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Event Type</label>
                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          {config.icon}
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* IP Address Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">IP Address</label>
                <Input
                  placeholder="Search IP..."
                  value={ipFilter}
                  onChange={(e) => setIpFilter(e.target.value)}
                  className="h-10"
                />
              </div>

              {/* Country Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Country</label>
                <Select value={countryFilter} onValueChange={handleCountryFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All countries</SelectItem>
                    {availableCountries.map(({ code, name }) => (
                      <SelectItem key={code} value={code}>
                        <div className="flex items-center gap-2">
                          <span>{getCountryFlag(code)}</span>
                          {name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10",
                        !dateRange && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "MMM d")} - {format(dateRange.to, "MMM d")}
                          </>
                        ) : (
                          format(dateRange.from, "MMM d, yyyy")
                        )
                      ) : (
                        "Select dates"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground">
                Showing {filteredEvents.length} of {events.length} events
              </p>
            )}
            
            {/* Bulk Actions */}
            {bulkIpStats.uniqueIps.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <span className="text-xs text-muted-foreground">Bulk actions for {bulkIpStats.uniqueIps.length} unique IPs:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBulkBlockReason("Bulk blocked from bot detection events");
                        setBulkBlockDialogOpen(true);
                      }}
                      disabled={bulkIpStats.unblockedIps.length === 0 || isBulkProcessing}
                      className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      <ShieldBan className="w-3 h-3" />
                      Block All ({bulkIpStats.unblockedIps.length})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Block all {bulkIpStats.unblockedIps.length} unblocked IPs</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setBulkUnblockDialogOpen(true)}
                      disabled={bulkIpStats.currentlyBlockedIps.length === 0 || isBulkProcessing}
                      className="h-7 text-xs gap-1 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
                    >
                      <ShieldOff className="w-3 h-3" />
                      Unblock All ({bulkIpStats.currentlyBlockedIps.length})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Unblock all {bulkIpStats.currentlyBlockedIps.length} blocked IPs</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        )}

        {/* Summary Stats */}
        <div className="relative">
          {/* Transition spinner overlay */}
          {isFilterTransitioning && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[1px] z-10 rounded-lg">
              <div className="flex items-center gap-2 bg-background/80 px-3 py-1.5 rounded-full shadow-sm border">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Updating...</span>
              </div>
            </div>
          )}
          <div 
            className={cn(
              "grid grid-cols-2 md:grid-cols-4 gap-4 transition-all duration-200",
              isFilterTransitioning ? "opacity-50 scale-[0.98]" : "opacity-100 scale-100"
            )}
          >
            <div className="text-center p-4 rounded-lg bg-muted/50 transition-all duration-300">
              <p className="text-3xl font-bold text-foreground">
                <AnimatedCounter value={filteredEvents.length} />
              </p>
              <p className="text-sm text-muted-foreground">Total Blocked</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50 transition-all duration-300">
              <p className="text-3xl font-bold text-foreground">
                <AnimatedCounter value={uniqueIPs} />
              </p>
              <p className="text-sm text-muted-foreground">Unique IPs</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50 transition-all duration-300">
              <p className="text-3xl font-bold text-foreground">
                <AnimatedCounter value={statsByType.find((s) => s.type === "honeypot")?.count || 0} />
              </p>
              <p className="text-sm text-muted-foreground">Honeypot Catches</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50 transition-all duration-300">
              <p className="text-3xl font-bold text-foreground">
                <AnimatedCounter value={statsByType.find((s) => s.type === "captcha_failure")?.count || 0} />
              </p>
              <p className="text-sm text-muted-foreground">CAPTCHA Failures</p>
            </div>
          </div>
        </div>

        {/* Trend Chart */}
        <div 
          className={cn(
            "transition-all duration-200",
            isFilterTransitioning ? "opacity-50 scale-[0.99]" : "opacity-100 scale-100"
          )}
        >
          <h4 className="text-sm font-medium mb-3">Daily Trend</h4>
          <ChartContainer config={chartConfig} className="h-[200px]">
            <BarChart data={trendData}>
              <XAxis dataKey="label" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="honeypot" stackId="a" fill="var(--color-honeypot)" />
              <Bar dataKey="timing" stackId="a" fill="var(--color-timing)" />
              <Bar dataKey="captcha_failure" stackId="a" fill="var(--color-captcha_failure)" />
              <Bar dataKey="suspicious_ua" stackId="a" fill="var(--color-suspicious_ua)" />
              <Bar dataKey="challenge_failure" stackId="a" fill="var(--color-challenge_failure)" />
              <Bar dataKey="rate_limit" stackId="a" fill="var(--color-rate_limit)" />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Geographic Distribution with World Map */}
        {countryDistribution.length > 0 && (
          <div
            tabIndex={0}
            onKeyDown={handleGeoKeyDown}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
            role="listbox"
            aria-label="Geographic distribution - use arrow keys to navigate countries, Escape to clear filter"
          >
            {/* Screen reader announcements */}
            <div 
              role="status" 
              aria-live="polite" 
              aria-atomic="true"
              className="sr-only"
            >
              {screenReaderAnnouncement}
            </div>
            
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Geographic Distribution
                {isLoadingGeo && <span className="text-xs text-muted-foreground ml-2">(loading...)</span>}
                {countryFilter !== "all" && (
                  <Badge variant="secondary" className="ml-2 gap-1">
                    {getCountryFlag(countryFilter)} {availableCountries.find(c => c.code === countryFilter)?.name || countryFilter}
                  </Badge>
                )}
              </h4>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground hidden sm:inline">
                  ←→ navigate • Esc clear
                </span>
                {countryFilter !== "all" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCountryFilterChange("all")}
                    className="h-7 gap-1.5 text-xs"
                  >
                    <X className="w-3 h-3" />
                    Clear filter
                  </Button>
                )}
              </div>
            </div>
            
            {/* World Map */}
            <div className="mb-4 border rounded-lg p-2 bg-muted/30">
              <BotDetectionWorldMap
                countryDistribution={countryDistribution}
                totalEvents={filteredEvents.length}
                onCountryClick={handleCountryFilterChange}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4 items-center">
              {/* Pie Chart */}
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={countryDistribution}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {countryDistribution.map((entry, index) => {
                        const isSelected = countryFilter === entry.code;
                        const isHovered = hoveredCountry === entry.code;
                        return (
                          <Cell 
                            key={entry.code} 
                            fill={COUNTRY_COLORS[index % COUNTRY_COLORS.length]}
                            className={cn(
                              "cursor-pointer transition-all duration-200",
                              isSelected && "animate-chart-pulse"
                            )}
                            style={{
                              opacity: countryFilter !== "all" && !isSelected && !isHovered 
                                ? 0.3 
                                : isHovered && !isSelected 
                                  ? 0.85 
                                  : 1,
                              stroke: isSelected 
                                ? "hsl(var(--foreground))" 
                                : isHovered 
                                  ? "hsl(var(--primary))" 
                                  : "transparent",
                              strokeWidth: isSelected ? 3 : isHovered ? 2 : 0,
                              transformOrigin: "center",
                              filter: isHovered && !isSelected ? "brightness(1.1)" : "none",
                            }}
                            onClick={() => handleCountryFilterChange(entry.code)}
                          />
                        );
                      })}
                    </Pie>
                    <ChartTooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          const percentage = filteredEvents.length > 0 
                            ? Math.round((data.count / filteredEvents.length) * 100) 
                            : 0;
                          return (
                            <div className="bg-popover border rounded-md shadow-md px-3 py-2 text-sm">
                              <p className="font-medium">{getCountryFlag(data.code)} {data.name}</p>
                              <p className="text-muted-foreground">{data.count} events ({percentage}%)</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend with mini-map */}
              <div className="relative">
                <div 
                  ref={legendContainerRef}
                  onScroll={handleLegendScroll}
                  className="space-y-2 max-h-[200px] overflow-y-auto scroll-smooth pr-3"
                >
                  {countryDistribution.map((country, index) => {
                    const percentage = filteredEvents.length > 0 
                      ? Math.round((country.count / filteredEvents.length) * 100) 
                      : 0;
                    const isSelected = countryFilter === country.code;
                    return (
                      <button
                        key={country.code}
                        data-country={country.code}
                        onClick={() => handleCountryFilterChange(country.code)}
                        onMouseEnter={() => setHoveredCountry(country.code)}
                        onMouseLeave={() => setHoveredCountry(null)}
                        className={cn(
                          "flex items-center justify-between py-1.5 w-full rounded-lg px-2 transition-all",
                          isSelected 
                            ? "bg-primary/10 ring-2 ring-primary/50" 
                            : countryFilter !== "all" 
                              ? "opacity-50 hover:opacity-75 hover:bg-muted/30"
                              : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className={cn(
                              "w-3 h-3 rounded-sm transition-transform",
                              isSelected && "scale-125 animate-pulse"
                            )}
                            style={{ 
                              backgroundColor: COUNTRY_COLORS[index % COUNTRY_COLORS.length],
                              boxShadow: isSelected ? `0 0 8px ${COUNTRY_COLORS[index % COUNTRY_COLORS.length]}` : "none",
                            }} 
                          />
                          <span className={cn("text-sm", isSelected && "font-medium")}>
                            {getCountryFlag(country.code)} {country.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={isSelected ? "default" : "secondary"}>{country.count}</Badge>
                          <span className="text-xs text-muted-foreground w-10 text-right">{percentage}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                
                {/* Mini-map scroll indicator */}
                {legendScrollInfo.scrollHeight > legendScrollInfo.clientHeight && (
                  <div 
                    ref={minimapTrackRef}
                    className={cn(
                      "absolute right-0 top-0 bottom-0 w-3 bg-muted/30 rounded-full cursor-pointer transition-colors",
                      isDraggingMinimap ? "bg-muted/60" : "hover:bg-muted/50"
                    )}
                    onClick={(e) => {
                      if (isDraggingMinimap) return;
                      if (!legendContainerRef.current) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickY = e.clientY - rect.top;
                      const clickPercent = clickY / rect.height;
                      const scrollableHeight = legendScrollInfo.scrollHeight - legendScrollInfo.clientHeight;
                      const targetScroll = clickPercent * scrollableHeight;
                      legendContainerRef.current.scrollTo({
                        top: targetScroll,
                        behavior: "smooth"
                      });
                    }}
                  >
                    {/* Draggable thumb */}
                    <div 
                      className={cn(
                        "absolute w-full rounded-full cursor-grab active:cursor-grabbing",
                        isDraggingMinimap 
                          ? "bg-primary/80 shadow-md" 
                          : "bg-primary/60 hover:bg-primary/70"
                      )}
                      style={{
                        height: `${Math.max(
                          20,
                          (legendScrollInfo.clientHeight / legendScrollInfo.scrollHeight) * 100
                        )}%`,
                        top: `${(legendScrollInfo.scrollTop / (legendScrollInfo.scrollHeight - legendScrollInfo.clientHeight)) * 
                          (100 - Math.max(20, (legendScrollInfo.clientHeight / legendScrollInfo.scrollHeight) * 100))}%`,
                        transition: isDraggingMinimap ? "none" : "all 150ms",
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsDraggingMinimap(true);
                      }}
                    />
                    {/* Country dots on mini-map */}
                    {countryDistribution.map((country, index) => {
                      const itemPosition = (index / countryDistribution.length) * 100;
                      const isSelected = countryFilter === country.code;
                      return (
                        <div
                          key={country.code}
                          className={cn(
                            "absolute w-1.5 h-1.5 left-[3px] rounded-full transition-all pointer-events-none",
                            isSelected ? "bg-primary scale-125" : "bg-muted-foreground/40"
                          )}
                          style={{ top: `calc(${itemPosition}% - 2px)` }}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Breakdown by Type */}
        <div 
          className={cn(
            "grid md:grid-cols-2 gap-6 transition-all duration-200",
            isFilterTransitioning ? "opacity-50 scale-[0.99]" : "opacity-100 scale-100"
          )}
        >
          <div>
            <h4 className="text-sm font-medium mb-3">Breakdown by Type</h4>
            <div className="space-y-2">
              {Object.entries(EVENT_TYPE_CONFIG).map(([type, config]) => {
                const count = statsByType.find((s) => s.type === type)?.count || 0;
                const percentage = filteredEvents.length > 0 ? Math.round((count / filteredEvents.length) * 100) : 0;
                return (
                  <div key={type} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      {config.icon}
                      <span className="text-sm">{config.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{count}</Badge>
                      <span className="text-xs text-muted-foreground w-10 text-right">{percentage}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">
                Top Blocked IPs
                {isLoadingGeo && <span className="text-xs text-muted-foreground ml-2">(loading locations...)</span>}
              </h4>
              {topIpStats.unblockedIps.length > 0 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTopIpsBlockDialogOpen(true)}
                      disabled={isBulkProcessing}
                      className="h-7 gap-1.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50"
                    >
                      <ShieldBan className="w-3.5 h-3.5" />
                      Block All ({topIpStats.unblockedIps.length})
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Block all unblocked IPs from this list</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            {/* Filters for Top IPs */}
            {allTopBlockedIPs.length > 3 && (
              <div className="flex gap-2 mt-2">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                  <Input
                    placeholder="Search IPs..."
                    value={topIpsSearch}
                    onChange={(e) => setTopIpsSearch(e.target.value)}
                    className="h-7 pl-7 text-xs"
                  />
                  {topIpsSearch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setTopIpsSearch("")}
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-5 w-5 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {/* Country filter */}
                {topIpsAvailableCountries.length > 1 && (
                  <Select value={topIpsCountryFilter} onValueChange={setTopIpsCountryFilter}>
                    <SelectTrigger className="h-7 w-[130px] text-xs">
                      <Globe className="w-3 h-3 mr-1" />
                      <SelectValue placeholder="All countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All countries</SelectItem>
                      {topIpsAvailableCountries.map(({ code, name }) => (
                        <SelectItem key={code} value={code}>
                          <div className="flex items-center gap-2">
                            <span>{getCountryFlag(code)}</span>
                            {name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
            {topBlockedIPs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                {topIpsSearch || topIpsCountryFilter !== "all" 
                  ? "No IPs match your filters" 
                  : "No blocked IPs in this period"}
              </p>
            ) : (
              <div className="space-y-2 mt-2">
                {topBlockedIPs.map(({ ip, count }, index) => {
                  const geo = geoLocations[ip];
                  const isBlocked = blockedIps.has(ip);
                  const isBlocking = ip === blockingIp;
                  const isUnblocking = ip === unblockingIp;
                  return (
                    <div key={ip} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-4">{index + 1}.</span>
                        {geo && (
                          <span className="text-sm" title={`${geo.city}, ${geo.region}, ${geo.country}`}>
                            {getCountryFlag(geo.countryCode)}
                          </span>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(ip);
                                setCopiedIp(ip);
                                setTimeout(() => setCopiedIp(null), 2000);
                              }}
                              className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded hover:bg-muted/80 cursor-pointer transition-colors group"
                            >
                              <code>{ip}</code>
                              {copiedIp === ip ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                              )}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{copiedIp === ip ? "Copied!" : "Click to copy"}</p>
                          </TooltipContent>
                        </Tooltip>
                        {isBlocked && (
                          <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                            Blocked
                          </Badge>
                        )}
                        {geo && (
                          <span className="text-xs text-muted-foreground hidden md:inline">
                            {geo.city ? `${geo.city}, ` : ""}{geo.country}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{count} attempts</Badge>
                        {isBlocked ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleUnblockIp(ip)}
                                disabled={isUnblocking}
                                className="h-6 px-2 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                              >
                                {isUnblocking ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ShieldOff className="h-3 w-3" />
                                )}
                                Unblock
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove from blocklist</p>
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openBlockDialog(ip)}
                                disabled={isBlocking}
                                className="h-6 px-2 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                {isBlocking ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <ShieldBan className="h-3 w-3" />
                                )}
                                Block
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Add to blocklist</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {allTopBlockedIPs.length > 5 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllTopIps(!showAllTopIps)}
                className="w-full h-7 text-xs text-muted-foreground hover:text-foreground mt-2"
              >
                {showAllTopIps ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    Show more ({Math.min(allTopBlockedIPs.length, 20) - 5} more)
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Recent Events with Pagination */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium">Recent Events</h4>
            {filteredEvents.length > 0 && (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportToCSV}
                      className="h-7 gap-1.5 text-xs"
                    >
                      <Download className="w-3 h-3" />
                      Export CSV
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Download {filteredEvents.length} events to CSV</p>
                  </TooltipContent>
                </Tooltip>
                {filteredEvents.length >= 100 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEmailExportDialogOpen(true)}
                        className="h-7 gap-1.5 text-xs"
                      >
                        <Mail className="w-3 h-3" />
                        Email Export
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Email download link for large export</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                <span className="text-xs text-muted-foreground">Show:</span>
                <Select value={String(itemsPerPage)} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="h-7 w-[70px] text-xs">
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
            )}
          </div>
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {hasActiveFilters 
                ? "No events match your filters. Try adjusting the filter criteria."
                : "No bot detection events in this period. Your defenses are holding strong! 🛡️"}
            </p>
          ) : (
            <>
              <TooltipProvider>
                <div className="max-h-[400px] overflow-auto space-y-2">
                  {filteredEvents
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((event) => {
                      const geo = event.ip_address ? geoLocations[event.ip_address] : null;
                      const isBlocked = event.ip_address ? blockedIps.has(event.ip_address) : false;
                      const isBlocking = event.ip_address === blockingIp;
                      const isUnblocking = event.ip_address === unblockingIp;
                      
                      return (
                        <div
                          key={event.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {EVENT_TYPE_CONFIG[event.event_type]?.icon}
                            <span>{EVENT_TYPE_CONFIG[event.event_type]?.label || event.event_type}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {event.ip_address && (
                              <div className="flex items-center gap-1.5">
                                {geo && (
                                  <span title={`${geo.city}, ${geo.region}, ${geo.country}`}>
                                    {getCountryFlag(geo.countryCode)}
                                  </span>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(event.ip_address!);
                                        setCopiedIp(event.ip_address!);
                                        setTimeout(() => setCopiedIp(null), 2000);
                                      }}
                                      className="inline-flex items-center gap-1 bg-muted px-1.5 py-0.5 rounded hover:bg-muted/80 cursor-pointer transition-colors group"
                                    >
                                      <code>{event.ip_address}</code>
                                      {copiedIp === event.ip_address ? (
                                        <Check className="w-3 h-3 text-green-600" />
                                      ) : (
                                        <Copy className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                      )}
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{copiedIp === event.ip_address ? "Copied!" : "Click to copy"}</p>
                                  </TooltipContent>
                                </Tooltip>
                                {isBlocked ? (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleUnblockIp(event.ip_address!)}
                                        disabled={isUnblocking}
                                        className="h-5 px-1.5 text-xs gap-1 text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-950"
                                      >
                                        {isUnblocking ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <ShieldOff className="h-3 w-3" />
                                        )}
                                        Unblock
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Remove from blocklist</p>
                                    </TooltipContent>
                                  </Tooltip>
                                ) : (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openBlockDialog(event.ip_address!)}
                                        disabled={isBlocking}
                                        className="h-5 px-1.5 text-xs gap-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                                      >
                                        {isBlocking ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <ShieldBan className="h-3 w-3" />
                                        )}
                                        Block
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Add this IP to the blocklist</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            )}
                            <span>{format(parseISO(event.created_at), "MMM d, HH:mm")}</span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </TooltipProvider>
              
              {/* Pagination Controls */}
              {filteredEvents.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredEvents.length)} of {filteredEvents.length} events
                  </p>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1 px-2">
                      {Array.from({ length: Math.min(5, Math.ceil(filteredEvents.length / itemsPerPage)) }, (_, i) => {
                        const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
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
                            onClick={() => setCurrentPage(pageNum)}
                            className="h-7 w-7 p-0 text-xs"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredEvents.length / itemsPerPage), p + 1))}
                      disabled={currentPage >= Math.ceil(filteredEvents.length / itemsPerPage)}
                      className="h-7 w-7 p-0"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>

      {/* Single Block Confirmation Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldBan className="h-5 w-5 text-destructive" />
              Block IP Address
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to block {pendingBlockIp}? This will silently reject all future signup attempts from this IP.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">IP Address</label>
              <Badge variant="outline" className="font-mono">
                {pendingBlockIp}
              </Badge>
            </div>
            <div className="space-y-2">
              <label htmlFor="single-block-reason" className="text-sm font-medium">
                Reason (optional)
              </label>
              <Textarea
                id="single-block-reason"
                placeholder="Why is this IP being blocked?"
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmBlock}
              disabled={blockingIp !== null}
            >
              {blockingIp ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Blocking...
                </>
              ) : (
                "Block IP"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Block Confirmation Dialog */}
      <Dialog open={bulkBlockDialogOpen} onOpenChange={setBulkBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldBan className="h-5 w-5 text-destructive" />
              Block All IPs
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to block {bulkIpStats.unblockedIps.length} IP address{bulkIpStats.unblockedIps.length > 1 ? "es" : ""}? 
              This will silently reject all future signup attempts from these IPs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">IPs to block</label>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-muted/50 rounded-md">
                {bulkIpStats.unblockedIps.slice(0, 20).map((ip) => (
                  <Badge key={ip} variant="outline" className="font-mono text-xs">
                    {ip}
                  </Badge>
                ))}
                {bulkIpStats.unblockedIps.length > 20 && (
                  <Badge variant="secondary" className="text-xs">
                    +{bulkIpStats.unblockedIps.length - 20} more
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="bulk-block-reason" className="text-sm font-medium">
                Reason (optional)
              </label>
              <Textarea
                id="bulk-block-reason"
                placeholder="Why are these IPs being blocked?"
                value={bulkBlockReason}
                onChange={(e) => setBulkBlockReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleBulkBlock}
              disabled={isBulkProcessing}
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Blocking...
                </>
              ) : (
                `Block ${bulkIpStats.unblockedIps.length} IP${bulkIpStats.unblockedIps.length > 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Unblock Confirmation Dialog */}
      <Dialog open={bulkUnblockDialogOpen} onOpenChange={setBulkUnblockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldOff className="h-5 w-5 text-green-600" />
              Unblock All IPs
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to unblock {bulkIpStats.currentlyBlockedIps.length} IP address{bulkIpStats.currentlyBlockedIps.length > 1 ? "es" : ""}? 
              These IPs will be able to attempt signups again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">IPs to unblock</label>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-muted/50 rounded-md">
                {bulkIpStats.currentlyBlockedIps.slice(0, 20).map((ip) => (
                  <Badge key={ip} variant="outline" className="font-mono text-xs">
                    {ip}
                  </Badge>
                ))}
                {bulkIpStats.currentlyBlockedIps.length > 20 && (
                  <Badge variant="secondary" className="text-xs">
                    +{bulkIpStats.currentlyBlockedIps.length - 20} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkUnblockDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleBulkUnblock}
              disabled={isBulkProcessing}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Unblocking...
                </>
              ) : (
                `Unblock ${bulkIpStats.currentlyBlockedIps.length} IP${bulkIpStats.currentlyBlockedIps.length > 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Top IPs Bulk Block Confirmation Dialog */}
      <Dialog open={topIpsBlockDialogOpen} onOpenChange={setTopIpsBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldBan className="h-5 w-5 text-destructive" />
              Block Top Repeat Offenders
            </DialogTitle>
            <DialogDescription>
              Block {topIpStats.unblockedIps.length} IP address{topIpStats.unblockedIps.length > 1 ? "es" : ""} from the top offenders list. 
              These IPs will no longer be able to attempt signups.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">IPs to block</label>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-muted/50 rounded-md">
                {topIpStats.unblockedIps.map((ip) => (
                  <Badge key={ip} variant="outline" className="font-mono text-xs">
                    {ip}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason (optional)</label>
              <Textarea
                placeholder="e.g., Repeat offenders from bot detection"
                value={topIpsBlockReason}
                onChange={(e) => setTopIpsBlockReason(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopIpsBlockDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleTopIpsBulkBlock}
              disabled={isBulkProcessing}
            >
              {isBulkProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Blocking...
                </>
              ) : (
                `Block ${topIpStats.unblockedIps.length} IP${topIpStats.unblockedIps.length > 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Export Dialog */}
      <Dialog open={emailExportDialogOpen} onOpenChange={setEmailExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Email Export</DialogTitle>
            <DialogDescription>
              Send a download link for {filteredEvents.length} events to your email. The link will be valid for 24 hours.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={exportEmail}
                onChange={(e) => setExportEmail(e.target.value)}
              />
            </div>
            {hasActiveFilters && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-xs text-muted-foreground">
                  <strong>Filters applied:</strong> {getFilterDescription()}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailExport} disabled={isSendingExport}>
              {isSendingExport ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default BotDetectionWidget;
