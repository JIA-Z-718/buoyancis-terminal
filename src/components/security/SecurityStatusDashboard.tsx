import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Timer,
  Shield,
  Eye,
  Clock,
  Bot,
  Fingerprint,
  Ban,
  Globe,
  Mail,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LayerMetrics {
  layer: number;
  name: string;
  icon: React.ReactNode;
  description: string;
  last24h: number;
  last7d: number;
  trend: number; // percentage change
  status: "active" | "warning" | "critical";
  eventType: string;
}

export default function SecurityStatusDashboard() {
  const [metrics, setMetrics] = useState<LayerMetrics[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [ipBlockCount, setIpBlockCount] = useState(0);
  const [geoBlockCount, setGeoBlockCount] = useState(0);
  const [rateLimitViolations, setRateLimitViolations] = useState({ last24h: 0, last7d: 0 });

  const fetchMetrics = async () => {
    setIsLoading(true);
    
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const prev7d = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    try {
      // Fetch bot detection events
      const [events24h, events7d, eventsPrev7d, ipBlocks, geoRestrictions, rateViolations24h, rateViolations7d] = await Promise.all([
        supabase
          .from("bot_detection_events")
          .select("event_type")
          .gte("created_at", last24h.toISOString()),
        supabase
          .from("bot_detection_events")
          .select("event_type")
          .gte("created_at", last7d.toISOString()),
        supabase
          .from("bot_detection_events")
          .select("event_type")
          .gte("created_at", prev7d.toISOString())
          .lt("created_at", last7d.toISOString()),
        supabase
          .from("ip_blocklist")
          .select("id", { count: "exact", head: true }),
        supabase
          .from("geo_restrictions")
          .select("id", { count: "exact", head: true })
          .eq("is_blocked", true),
        supabase
          .from("rate_limit_violations")
          .select("id")
          .gte("created_at", last24h.toISOString()),
        supabase
          .from("rate_limit_violations")
          .select("id")
          .gte("created_at", last7d.toISOString())
      ]);

      const countByType = (events: { event_type: string }[] | null, type: string) => 
        events?.filter(e => e.event_type === type).length || 0;

      const calculateTrend = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      const getStatus = (count24h: number): "active" | "warning" | "critical" => {
        if (count24h === 0) return "active";
        if (count24h < 10) return "warning";
        return "critical";
      };

      // Rate limiting metrics
      const rl24h = rateViolations24h.data?.length || 0;
      const rl7d = rateViolations7d.data?.length || 0;
      setRateLimitViolations({ last24h: rl24h, last7d: rl7d });

      // IP and Geo counts
      setIpBlockCount(ipBlocks.count || 0);
      setGeoBlockCount(geoRestrictions.count || 0);

      const layerData: LayerMetrics[] = [
        {
          layer: 1,
          name: "Rate Limiting",
          icon: <Timer className="w-5 h-5" />,
          description: "Exponential backoff throttling",
          last24h: rl24h,
          last7d: rl7d,
          trend: 0, // Will calculate separately
          status: getStatus(rl24h),
          eventType: "rate_limit"
        },
        {
          layer: 2,
          name: "Turnstile CAPTCHA",
          icon: <Shield className="w-5 h-5" />,
          description: "Cloudflare challenge verification",
          last24h: countByType(events24h.data, "captcha_failed"),
          last7d: countByType(events7d.data, "captcha_failed"),
          trend: calculateTrend(
            countByType(events7d.data, "captcha_failed"),
            countByType(eventsPrev7d.data, "captcha_failed")
          ),
          status: getStatus(countByType(events24h.data, "captcha_failed")),
          eventType: "captcha_failed"
        },
        {
          layer: 3,
          name: "Honeypot Detection",
          icon: <Eye className="w-5 h-5" />,
          description: "Hidden field trap for bots",
          last24h: countByType(events24h.data, "honeypot_triggered"),
          last7d: countByType(events7d.data, "honeypot_triggered"),
          trend: calculateTrend(
            countByType(events7d.data, "honeypot_triggered"),
            countByType(eventsPrev7d.data, "honeypot_triggered")
          ),
          status: getStatus(countByType(events24h.data, "honeypot_triggered")),
          eventType: "honeypot_triggered"
        },
        {
          layer: 4,
          name: "Timing Analysis",
          icon: <Clock className="w-5 h-5" />,
          description: "Submission speed detection",
          last24h: countByType(events24h.data, "timing_violation"),
          last7d: countByType(events7d.data, "timing_violation"),
          trend: calculateTrend(
            countByType(events7d.data, "timing_violation"),
            countByType(eventsPrev7d.data, "timing_violation")
          ),
          status: getStatus(countByType(events24h.data, "timing_violation")),
          eventType: "timing_violation"
        },
        {
          layer: 5,
          name: "User-Agent Filter",
          icon: <Bot className="w-5 h-5" />,
          description: "Bot signature blocking",
          last24h: countByType(events24h.data, "suspicious_user_agent"),
          last7d: countByType(events7d.data, "suspicious_user_agent"),
          trend: calculateTrend(
            countByType(events7d.data, "suspicious_user_agent"),
            countByType(eventsPrev7d.data, "suspicious_user_agent")
          ),
          status: getStatus(countByType(events24h.data, "suspicious_user_agent")),
          eventType: "suspicious_user_agent"
        },
        {
          layer: 6,
          name: "JS Challenge",
          icon: <Fingerprint className="w-5 h-5" />,
          description: "Client-side hash verification",
          last24h: countByType(events24h.data, "missing_client_challenge"),
          last7d: countByType(events7d.data, "missing_client_challenge"),
          trend: calculateTrend(
            countByType(events7d.data, "missing_client_challenge"),
            countByType(eventsPrev7d.data, "missing_client_challenge")
          ),
          status: getStatus(countByType(events24h.data, "missing_client_challenge")),
          eventType: "missing_client_challenge"
        },
        {
          layer: 7,
          name: "IP Blocklist",
          icon: <Ban className="w-5 h-5" />,
          description: `${ipBlocks.count || 0} IPs blocked`,
          last24h: countByType(events24h.data, "blocked_ip"),
          last7d: countByType(events7d.data, "blocked_ip"),
          trend: calculateTrend(
            countByType(events7d.data, "blocked_ip"),
            countByType(eventsPrev7d.data, "blocked_ip")
          ),
          status: getStatus(countByType(events24h.data, "blocked_ip")),
          eventType: "blocked_ip"
        },
        {
          layer: 8,
          name: "Geo Restrictions",
          icon: <Globe className="w-5 h-5" />,
          description: `${geoRestrictions.count || 0} regions blocked`,
          last24h: countByType(events24h.data, "geo_blocked"),
          last7d: countByType(events7d.data, "geo_blocked"),
          trend: calculateTrend(
            countByType(events7d.data, "geo_blocked"),
            countByType(eventsPrev7d.data, "geo_blocked")
          ),
          status: getStatus(countByType(events24h.data, "geo_blocked")),
          eventType: "geo_blocked"
        },
        {
          layer: 9,
          name: "Email Validation",
          icon: <Mail className="w-5 h-5" />,
          description: "Disposable email blocking",
          last24h: countByType(events24h.data, "spam_domain") + countByType(events24h.data, "typo_domain"),
          last7d: countByType(events7d.data, "spam_domain") + countByType(events7d.data, "typo_domain"),
          trend: calculateTrend(
            countByType(events7d.data, "spam_domain") + countByType(events7d.data, "typo_domain"),
            countByType(eventsPrev7d.data, "spam_domain") + countByType(eventsPrev7d.data, "typo_domain")
          ),
          status: getStatus(countByType(events24h.data, "spam_domain") + countByType(events24h.data, "typo_domain")),
          eventType: "spam_domain"
        }
      ];

      setMetrics(layerData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching security metrics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Set up realtime subscription
    const channel = supabase
      .channel("security-metrics")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bot_detection_events" },
        () => fetchMetrics()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rate_limit_violations" },
        () => fetchMetrics()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const totalBlocked24h = metrics.reduce((sum, m) => sum + m.last24h, 0);
  const totalBlocked7d = metrics.reduce((sum, m) => sum + m.last7d, 0);
  const activeThreats = metrics.filter(m => m.status === "critical").length;

  const getStatusColor = (status: "active" | "warning" | "critical") => {
    switch (status) {
      case "active": return "bg-green-500";
      case "warning": return "bg-yellow-500";
      case "critical": return "bg-red-500";
    }
  };

  const getStatusBadge = (status: "active" | "warning" | "critical") => {
    switch (status) {
      case "active": return <Badge variant="outline" className="border-green-500 text-green-600">Secure</Badge>;
      case "warning": return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Alert</Badge>;
      case "critical": return <Badge variant="destructive">Critical</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="w-4 h-4" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <Button variant="outline" size="sm" onClick={fetchMetrics}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blocked (24h)</p>
                  <p className="text-3xl font-bold">{totalBlocked24h}</p>
                </div>
                <div className="p-3 rounded-full bg-primary/10">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Blocked (7d)</p>
                  <p className="text-3xl font-bold">{totalBlocked7d}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-500/10">
                  <Activity className="w-6 h-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Threats</p>
                  <p className="text-3xl font-bold">{activeThreats}</p>
                </div>
                <div className={`p-3 rounded-full ${activeThreats > 0 ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                  <AlertTriangle className={`w-6 h-6 ${activeThreats > 0 ? 'text-red-500' : 'text-green-500'}`} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Protection Layers</p>
                  <p className="text-3xl font-bold">9/9</p>
                </div>
                <div className="p-3 rounded-full bg-green-500/10">
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Layer Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.map((layer) => (
            <Card key={layer.layer} className="relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(layer.status)}`} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-muted">
                      {layer.icon}
                    </div>
                    <div>
                      <CardTitle className="text-sm font-medium">
                        Layer {layer.layer}: {layer.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground">{layer.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(layer.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last 24h</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{layer.last24h}</span>
                      {layer.last24h > 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="text-xs text-muted-foreground">blocked</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {layer.last24h} attack attempts blocked in the last 24 hours
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last 7d</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{layer.last7d}</span>
                      {layer.trend !== 0 && (
                        <Tooltip>
                          <TooltipTrigger>
                            <span className={`flex items-center text-xs ${layer.trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                              {layer.trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                              {Math.abs(layer.trend)}%
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {layer.trend > 0 ? 'Increase' : 'Decrease'} compared to previous 7 days
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>

                  {/* Activity bar */}
                  <div className="pt-2">
                    <Progress 
                      value={Math.min((layer.last24h / (totalBlocked24h || 1)) * 100, 100)} 
                      className="h-1.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Ban className="w-4 h-4" />
                IP Blocklist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total blocked IPs</span>
                <Badge variant="secondary">{ipBlockCount}</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Geographic Restrictions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Blocked regions</span>
                <Badge variant="secondary">{geoBlockCount}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}
