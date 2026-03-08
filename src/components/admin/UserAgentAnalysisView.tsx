import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Smartphone, Monitor, Tablet, Bot, HelpCircle, Globe, Server, Shield, ShieldBan, Loader2, Check, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { subDays } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface BotEvent {
  id: string;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface ParsedUA {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  device: string;
  isBot: boolean;
  botName?: string;
}

// Parse user agent string into structured data
const parseUserAgent = (ua: string | null): ParsedUA => {
  if (!ua) {
    return { browser: "Unknown", browserVersion: "", os: "Unknown", osVersion: "", device: "Unknown", isBot: false };
  }

  const uaLower = ua.toLowerCase();
  let browser = "Other";
  let browserVersion = "";
  let os = "Unknown";
  let osVersion = "";
  let device = "Desktop";
  let isBot = false;
  let botName: string | undefined;

  // Bot detection
  const botPatterns = [
    { pattern: /googlebot/i, name: "Googlebot" },
    { pattern: /bingbot/i, name: "Bingbot" },
    { pattern: /slurp/i, name: "Yahoo Slurp" },
    { pattern: /duckduckbot/i, name: "DuckDuckBot" },
    { pattern: /baiduspider/i, name: "Baidu Spider" },
    { pattern: /yandexbot/i, name: "Yandex Bot" },
    { pattern: /facebookexternalhit/i, name: "Facebook Bot" },
    { pattern: /twitterbot/i, name: "Twitter Bot" },
    { pattern: /linkedinbot/i, name: "LinkedIn Bot" },
    { pattern: /whatsapp/i, name: "WhatsApp Bot" },
    { pattern: /telegrambot/i, name: "Telegram Bot" },
    { pattern: /discordbot/i, name: "Discord Bot" },
    { pattern: /slackbot/i, name: "Slack Bot" },
    { pattern: /bot|crawler|spider|scraper/i, name: "Generic Bot" },
    { pattern: /curl|wget|python|java|node|go-http|axios|fetch/i, name: "HTTP Client" },
    { pattern: /headless|phantom|puppeteer|selenium|playwright/i, name: "Headless Browser" },
  ];

  for (const { pattern, name } of botPatterns) {
    if (pattern.test(ua)) {
      isBot = true;
      botName = name;
      device = "Bot";
      break;
    }
  }

  // Browser detection
  if (/edg/i.test(ua)) {
    browser = "Edge";
    const match = ua.match(/edg[ea]?\/(\d+)/i);
    if (match) browserVersion = match[1];
  } else if (/opr|opera/i.test(ua)) {
    browser = "Opera";
    const match = ua.match(/(?:opr|opera)\/(\d+)/i);
    if (match) browserVersion = match[1];
  } else if (/chrome|crios/i.test(ua) && !/edg/i.test(ua)) {
    browser = "Chrome";
    const match = ua.match(/(?:chrome|crios)\/(\d+)/i);
    if (match) browserVersion = match[1];
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox";
    const match = ua.match(/(?:firefox|fxios)\/(\d+)/i);
    if (match) browserVersion = match[1];
  } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
    browser = "Safari";
    const match = ua.match(/version\/(\d+)/i);
    if (match) browserVersion = match[1];
  } else if (/msie|trident/i.test(ua)) {
    browser = "Internet Explorer";
    const match = ua.match(/(?:msie |rv:)(\d+)/i);
    if (match) browserVersion = match[1];
  }

  // OS detection
  if (/windows nt 10/i.test(ua)) {
    os = "Windows";
    osVersion = "10/11";
  } else if (/windows nt/i.test(ua)) {
    os = "Windows";
    const match = ua.match(/windows nt (\d+\.\d+)/i);
    if (match) osVersion = match[1];
  } else if (/mac os x/i.test(ua)) {
    os = "macOS";
    const match = ua.match(/mac os x (\d+[._]\d+)/i);
    if (match) osVersion = match[1].replace("_", ".");
  } else if (/android/i.test(ua)) {
    os = "Android";
    const match = ua.match(/android (\d+)/i);
    if (match) osVersion = match[1];
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    os = "iOS";
    const match = ua.match(/os (\d+)/i);
    if (match) osVersion = match[1];
  } else if (/linux/i.test(ua)) {
    os = "Linux";
  } else if (/cros/i.test(ua)) {
    os = "Chrome OS";
  }

  // Device type detection
  if (!isBot) {
    if (/mobile|iphone|android(?!.*tablet)|ipod|blackberry|opera mini|iemobile/i.test(uaLower)) {
      device = "Mobile";
    } else if (/tablet|ipad|android.*tablet|kindle|silk/i.test(uaLower)) {
      device = "Tablet";
    }
  }

  return { browser, browserVersion, os, osVersion, device, isBot, botName };
};

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(220 70% 50%)",
  "hsl(280 70% 50%)",
  "hsl(30 70% 50%)",
];

const getDeviceIcon = (device: string) => {
  switch (device) {
    case "Mobile":
      return <Smartphone className="h-4 w-4" />;
    case "Tablet":
      return <Tablet className="h-4 w-4" />;
    case "Desktop":
      return <Monitor className="h-4 w-4" />;
    case "Bot":
      return <Bot className="h-4 w-4" />;
    default:
      return <HelpCircle className="h-4 w-4" />;
  }
};

export const UserAgentAnalysisView = () => {
  const [timeRange, setTimeRange] = useState<"7d" | "14d" | "30d">("7d");
  const [blockedIps, setBlockedIps] = useState<Set<string>>(new Set());
  const [blockingIp, setBlockingIp] = useState<string | null>(null);
  const [unblockingIp, setUnblockingIp] = useState<string | null>(null);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [pendingBlockIp, setPendingBlockIp] = useState<string | null>(null);
  const [blockReason, setBlockReason] = useState("");
  // Bulk block state
  const [bulkBlockDialogOpen, setBulkBlockDialogOpen] = useState(false);
  const [pendingBulkBlockIps, setPendingBulkBlockIps] = useState<string[]>([]);
  const [bulkBlockReason, setBulkBlockReason] = useState("");
  const [isBulkBlocking, setIsBulkBlocking] = useState(false);
  const { toast } = useToast();

  // Fetch existing blocked IPs on mount
  useEffect(() => {
    const fetchBlockedIps = async () => {
      const { data } = await supabase.from("ip_blocklist").select("ip_address");
      if (data) {
        setBlockedIps(new Set(data.map((row) => row.ip_address)));
      }
    };
    fetchBlockedIps();
  }, []);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["bot-detection-ua-analysis", timeRange],
    queryFn: async () => {
      const daysAgo = timeRange === "7d" ? 7 : timeRange === "14d" ? 14 : 30;
      const startDate = subDays(new Date(), daysAgo).toISOString();

      const { data, error } = await supabase
        .from("bot_detection_events")
        .select("*")
        .gte("created_at", startDate)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as BotEvent[]) || [];
    },
  });

  // Parse all user agents
  const parsedData = useMemo(() => {
    return events.map((event) => ({
      ...event,
      parsed: parseUserAgent(event.user_agent),
    }));
  }, [events]);

  // Group by browser
  const browserStats = useMemo(() => {
    const counts: Record<string, number> = {};
    parsedData.forEach(({ parsed }) => {
      const key = parsed.browser;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percentage: (count / parsedData.length) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [parsedData]);

  // Group by OS
  const osStats = useMemo(() => {
    const counts: Record<string, number> = {};
    parsedData.forEach(({ parsed }) => {
      const key = parsed.os;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percentage: (count / parsedData.length) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [parsedData]);

  // Group by device type
  const deviceStats = useMemo(() => {
    const counts: Record<string, number> = {};
    parsedData.forEach(({ parsed }) => {
      const key = parsed.device;
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percentage: (count / parsedData.length) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [parsedData]);

  // Bot breakdown
  const botStats = useMemo(() => {
    const counts: Record<string, number> = {};
    parsedData
      .filter(({ parsed }) => parsed.isBot)
      .forEach(({ parsed }) => {
        const key = parsed.botName || "Unknown Bot";
        counts[key] = (counts[key] || 0) + 1;
      });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count, percentage: (count / parsedData.filter((d) => d.parsed.isBot).length) * 100 }))
      .sort((a, b) => b.count - a.count);
  }, [parsedData]);

  // Suspicious patterns - group by repeated user agents
  const suspiciousPatterns = useMemo(() => {
    const uaCounts: Record<string, { count: number; events: typeof parsedData }> = {};
    parsedData.forEach((event) => {
      if (!event.user_agent) return;
      if (!uaCounts[event.user_agent]) {
        uaCounts[event.user_agent] = { count: 0, events: [] };
      }
      uaCounts[event.user_agent].count++;
      uaCounts[event.user_agent].events.push(event);
    });

    return Object.entries(uaCounts)
      .filter(([, data]) => data.count >= 3) // Only show patterns with 3+ occurrences
      .map(([ua, data]) => {
        const ips = [...new Set(data.events.map((e) => e.ip_address).filter(Boolean))] as string[];
        return {
          userAgent: ua,
          count: data.count,
          parsed: data.events[0].parsed,
          eventTypes: [...new Set(data.events.map((e) => e.event_type))],
          uniqueIps: ips,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
  }, [parsedData]);

  // Open confirmation dialog before blocking
  const openBlockDialog = (ip: string) => {
    setPendingBlockIp(ip);
    setBlockReason("Blocked from User Agent Analysis - Suspicious Pattern");
    setBlockDialogOpen(true);
  };

  // Handle blocking an IP after confirmation
  const handleConfirmBlock = async () => {
    if (!pendingBlockIp) return;
    
    setBlockingIp(pendingBlockIp);
    setBlockDialogOpen(false);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from("ip_blocklist").insert({
        ip_address: pendingBlockIp,
        reason: blockReason.trim() || null,
        blocked_by: userData?.user?.id || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already blocked", description: `${pendingBlockIp} is already in the blocklist` });
        } else {
          throw error;
        }
      } else {
        setBlockedIps((prev) => new Set([...prev, pendingBlockIp]));
        toast({ title: "IP blocked", description: `${pendingBlockIp} has been added to the blocklist` });
      }
    } catch (error) {
      console.error("Error blocking IP:", error);
      toast({ title: "Error", description: "Failed to block IP address", variant: "destructive" });
    } finally {
      setBlockingIp(null);
      setPendingBlockIp(null);
      setBlockReason("");
    }
  };

  // Handle unblocking an IP
  const handleUnblockIp = async (ip: string) => {
    setUnblockingIp(ip);
    try {
      const { error } = await supabase
        .from("ip_blocklist")
        .delete()
        .eq("ip_address", ip);

      if (error) throw error;

      setBlockedIps((prev) => {
        const newSet = new Set(prev);
        newSet.delete(ip);
        return newSet;
      });
      toast({ title: "IP unblocked", description: `${ip} has been removed from the blocklist` });
    } catch (error) {
      console.error("Error unblocking IP:", error);
      toast({ title: "Error", description: "Failed to unblock IP address", variant: "destructive" });
    } finally {
      setUnblockingIp(null);
    }
  };

  // Open bulk block dialog
  const openBulkBlockDialog = (ips: string[]) => {
    // Filter out already blocked IPs
    const unblockedIps = ips.filter((ip) => !blockedIps.has(ip));
    if (unblockedIps.length === 0) {
      toast({ title: "All blocked", description: "All IPs in this pattern are already blocked" });
      return;
    }
    setPendingBulkBlockIps(unblockedIps);
    setBulkBlockReason("Blocked from User Agent Analysis - Bulk action on suspicious pattern");
    setBulkBlockDialogOpen(true);
  };

  // Handle bulk blocking IPs
  const handleConfirmBulkBlock = async () => {
    if (pendingBulkBlockIps.length === 0) return;
    
    setIsBulkBlocking(true);
    setBulkBlockDialogOpen(false);
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Insert all IPs in a single batch
      const insertData = pendingBulkBlockIps.map((ip) => ({
        ip_address: ip,
        reason: bulkBlockReason.trim() || null,
        blocked_by: userData?.user?.id || null,
      }));
      
      const { error } = await supabase.from("ip_blocklist").insert(insertData);

      if (error) {
        // Handle partial success (some IPs might already be blocked)
        if (error.code === "23505") {
          toast({ title: "Partial success", description: "Some IPs were already blocked" });
        } else {
          throw error;
        }
      }
      
      // Update local state
      setBlockedIps((prev) => {
        const newSet = new Set(prev);
        pendingBulkBlockIps.forEach((ip) => newSet.add(ip));
        return newSet;
      });
      
      toast({ 
        title: "IPs blocked", 
        description: `${pendingBulkBlockIps.length} IP${pendingBulkBlockIps.length > 1 ? "s" : ""} added to the blocklist` 
      });
    } catch (error) {
      console.error("Error bulk blocking IPs:", error);
      toast({ title: "Error", description: "Failed to block IP addresses", variant: "destructive" });
    } finally {
      setIsBulkBlocking(false);
      setPendingBulkBlockIps([]);
      setBulkBlockReason("");
    }
  };

  const chartConfig = {
    count: { label: "Count", color: "hsl(var(--chart-1))" },
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            User Agent Analysis
          </CardTitle>
          <CardDescription>No bot detection events found in the selected time range.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const totalBots = parsedData.filter((d) => d.parsed.isBot).length;
  const botPercentage = (totalBots / parsedData.length) * 100;

  return (
    <>
      {/* Block IP Confirmation Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldBan className="h-5 w-5 text-destructive" />
              Block IP Address
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to block <span className="font-mono font-medium">{pendingBlockIp}</span>? 
              This will silently reject all future signup attempts from this IP.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-4">
            <label htmlFor="block-reason" className="text-sm font-medium">
              Reason (optional)
            </label>
            <Textarea
              id="block-reason"
              placeholder="Why is this IP being blocked?"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              rows={3}
            />
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
              Are you sure you want to block {pendingBulkBlockIps.length} IP address{pendingBulkBlockIps.length > 1 ? "es" : ""}? 
              This will silently reject all future signup attempts from these IPs.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">IPs to block</label>
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-2 bg-muted/50 rounded-md">
                {pendingBulkBlockIps.map((ip) => (
                  <Badge key={ip} variant="outline" className="font-mono text-xs">
                    {ip}
                  </Badge>
                ))}
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
              onClick={handleConfirmBulkBlock}
              disabled={isBulkBlocking}
            >
              {isBulkBlocking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Blocking...
                </>
              ) : (
                `Block ${pendingBulkBlockIps.length} IP${pendingBulkBlockIps.length > 1 ? "s" : ""}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              User Agent Analysis
            </CardTitle>
            <CardDescription>
              Analyze bot detection events by browser, device, and operating system patterns
            </CardDescription>
          </div>
          <Select value={timeRange} onValueChange={(v) => setTimeRange(v as "7d" | "14d" | "30d")}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="14d">Last 14 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{parsedData.length}</div>
            <div className="text-sm text-muted-foreground">Total Events</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-destructive" />
              <span className="text-2xl font-bold">{totalBots}</span>
            </div>
            <div className="text-sm text-muted-foreground">{botPercentage.toFixed(1)}% Bot Traffic</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{browserStats.length}</div>
            <div className="text-sm text-muted-foreground">Unique Browsers</div>
          </div>
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{suspiciousPatterns.length}</div>
            <div className="text-sm text-muted-foreground">Suspicious Patterns</div>
          </div>
        </div>

        <Tabs defaultValue="devices" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="browsers">Browsers</TabsTrigger>
            <TabsTrigger value="bots">Bot Types</TabsTrigger>
            <TabsTrigger value="patterns">Patterns</TabsTrigger>
          </TabsList>

          <TabsContent value="devices" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Device Type Pie Chart */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Device Types</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <PieChart>
                      <Pie
                        data={deviceStats}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="count"
                        nameKey="name"
                        label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {deviceStats.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Device List */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Device Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {deviceStats.map(({ name, count, percentage }) => (
                    <div key={name} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          {getDeviceIcon(name)}
                          <span>{name}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* OS Distribution */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    Operating Systems
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[200px]">
                    <BarChart data={osStats.slice(0, 8)} layout="vertical">
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="browsers" className="space-y-4">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Browser Bar Chart */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Browser Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartContainer config={chartConfig} className="h-[250px]">
                    <BarChart data={browserStats.slice(0, 10)}>
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ChartContainer>
                </CardContent>
              </Card>

              {/* Browser Details Table */}
              <Card className="md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Browser Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Browser</TableHead>
                        <TableHead className="text-right">Events</TableHead>
                        <TableHead className="text-right">Percentage</TableHead>
                        <TableHead>Distribution</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {browserStats.slice(0, 10).map(({ name, count, percentage }) => (
                        <TableRow key={name}>
                          <TableCell className="font-medium">{name}</TableCell>
                          <TableCell className="text-right">{count}</TableCell>
                          <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                          <TableCell>
                            <Progress value={percentage} className="h-2 w-24" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="bots" className="space-y-4">
            {botStats.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No bot traffic detected in this time period.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Bot Types Chart */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Bot Types Detected
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ChartContainer config={chartConfig} className="h-[250px]">
                      <PieChart>
                        <Pie
                          data={botStats}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="name"
                          label={({ name }) => name}
                          labelLine
                        >
                          {botStats.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <ChartTooltip content={<ChartTooltipContent />} />
                      </PieChart>
                    </ChartContainer>
                  </CardContent>
                </Card>

                {/* Bot List */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Bot Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {botStats.map(({ name, count, percentage }) => (
                      <div key={name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Bot className="h-4 w-4 text-destructive" />
                            <span>{name}</span>
                          </div>
                          <span className="text-muted-foreground">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Suspicious User Agent Patterns
                </CardTitle>
                <CardDescription>User agents that appeared 3 or more times across multiple events</CardDescription>
              </CardHeader>
              <CardContent>
                {suspiciousPatterns.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No suspicious patterns detected.</p>
                  </div>
                ) : (
                  <TooltipProvider>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User Agent</TableHead>
                          <TableHead>Device</TableHead>
                          <TableHead>Browser</TableHead>
                          <TableHead>Event Types</TableHead>
                          <TableHead className="text-right">Count</TableHead>
                          <TableHead className="text-right">IPs</TableHead>
                          <TableHead className="w-[120px]">Actions</TableHead>
                          <TableHead className="w-[100px]">Bulk</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {suspiciousPatterns.map(({ userAgent, count, parsed, eventTypes, uniqueIps }) => (
                          <TableRow key={userAgent}>
                            <TableCell className="max-w-[300px]">
                              <div className="flex items-center gap-2">
                                {parsed.isBot && <Badge variant="destructive" className="text-xs">Bot</Badge>}
                                <span className="truncate text-xs font-mono" title={userAgent}>
                                  {userAgent.slice(0, 60)}...
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {getDeviceIcon(parsed.device)}
                                <span className="text-sm">{parsed.device}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{parsed.browser}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {eventTypes.map((type) => (
                                  <Badge key={type} variant="outline" className="text-xs">
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{count}</TableCell>
                            <TableCell className="text-right text-muted-foreground">{uniqueIps.length}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {uniqueIps.slice(0, 3).map((ip) => {
                                  const isBlocked = blockedIps.has(ip);
                                  const isBlocking = blockingIp === ip;
                                  const isUnblocking = unblockingIp === ip;
                                  
                                  if (isBlocked) {
                                    return (
                                      <Tooltip key={ip}>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6 bg-green-100 text-green-700 hover:bg-red-100 hover:text-red-700 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                                            onClick={() => handleUnblockIp(ip)}
                                            disabled={isUnblocking}
                                          >
                                            {isUnblocking ? (
                                              <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                              <ShieldCheck className="w-3 h-3" />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Unblock {ip}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    );
                                  }
                                  
                                  return (
                                    <Tooltip key={ip}>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                          onClick={() => openBlockDialog(ip)}
                                          disabled={isBlocking}
                                        >
                                          {isBlocking ? (
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                          ) : (
                                            <ShieldBan className="w-3 h-3" />
                                          )}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Block {ip}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  );
                                })}
                                {uniqueIps.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{uniqueIps.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const unblockedCount = uniqueIps.filter((ip) => !blockedIps.has(ip)).length;
                                const allBlocked = unblockedCount === 0;
                                
                                if (allBlocked) {
                                  return (
                                    <Badge variant="secondary" className="gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                      <ShieldCheck className="w-3 h-3" />
                                      All blocked
                                    </Badge>
                                  );
                                }
                                
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => openBulkBlockDialog(uniqueIps)}
                                        disabled={isBulkBlocking}
                                      >
                                        <ShieldBan className="w-3 h-3" />
                                        Block {unblockedCount}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Block all {unblockedCount} unblocked IP{unblockedCount > 1 ? "s" : ""}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TooltipProvider>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </>
  );
};
