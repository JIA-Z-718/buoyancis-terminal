import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, BarChart, Bar, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, AlertTriangle, CheckCircle, Mail, Eye, MousePointer, UserMinus, Ban, AlertCircle, X, Play, Volume2, VolumeX, Bell, BellOff, Clock, ArrowUpCircle } from "lucide-react";
import { format, subDays, parseISO, startOfDay, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import AlertThresholdSettings from "./AlertThresholdSettings";
import AlertEmailTemplateSettings from "./AlertEmailTemplateSettings";
import AlertHistory from "./AlertHistory";
import AlertNotificationSettings from "./AlertNotificationSettings";
import AlertFrequencyTrends from "./AlertFrequencyTrends";
import AlertResolutionDialog from "./AlertResolutionDialog";
import EscalationSettings from "./EscalationSettings";
import { playAlertSound, initAudioContext } from "@/lib/alertSound";
import { 
  isNotificationSupported, 
  getNotificationPermission, 
  requestNotificationPermission, 
  showAlertNotification,
  type NotificationPermissionState 
} from "@/lib/browserNotifications";

interface DeliverabilityMetrics {
  totalSent: number;
  totalOpens: number;
  totalClicks: number;
  totalBounces: number;
  totalComplaints: number;
  totalUnsubscribes: number;
  bounceRate: number;
  complaintRate: number;
  unsubscribeRate: number;
  openRate: number;
  clickRate: number;
}

interface TrendData {
  date: string;
  label: string;
  opens: number;
  clicks: number;
  bounces: number;
}

interface DeliverabilityAlert {
  id: string;
  alert_type: string;
  metric_value: number;
  threshold_value: number;
  created_at: string;
  resolved_at: string | null;
  escalation_level: number | null;
  escalated_at: string | null;
}

const DeliverabilityDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [metrics, setMetrics] = useState<DeliverabilityMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [activeAlerts, setActiveAlerts] = useState<DeliverabilityAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('alertSoundEnabled') !== 'false';
    }
    return true;
  });
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermissionState>(() => {
    if (typeof window !== 'undefined') {
      return getNotificationPermission();
    }
    return 'default';
  });
  const { toast } = useToast();

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('alertSoundEnabled', String(newValue));
    if (newValue) {
      initAudioContext();
      // Play a test sound to confirm
      playAlertSound('warning');
    }
  };

  const toggleNotifications = async () => {
    if (notificationPermission === 'granted') {
      // Can't revoke, just show a message
      toast({
        title: "Notifications enabled",
        description: "To disable, use your browser settings for this site.",
      });
      return;
    }
    
    if (notificationPermission === 'denied') {
      toast({
        title: "Notifications blocked",
        description: "Please enable notifications in your browser settings for this site.",
        variant: "destructive",
      });
      return;
    }

    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);
    
    if (permission === 'granted') {
      toast({
        title: "Notifications enabled",
        description: "You'll receive browser notifications for critical alerts.",
      });
      // Show a test notification
      showAlertNotification({
        title: "🔔 Notifications Enabled",
        body: "You'll be notified when critical alerts are triggered.",
        severity: "warning",
      });
    } else if (permission === 'denied') {
      toast({
        title: "Notifications blocked",
        description: "You won't receive browser notifications for alerts.",
        variant: "destructive",
      });
    }
  };

  const fetchMetrics = async () => {
    setIsLoading(true);

    try {
      // Fetch all data in parallel including alerts
      const [
        campaignsResult,
        opensResult,
        clicksResult,
        bouncesResult,
        complaintsResult,
        unsubscribesResult,
        alertsResult,
      ] = await Promise.all([
        supabase.from("email_campaigns").select("id, recipient_count, sent_at"),
        supabase.from("email_opens").select("id, opened_at"),
        supabase.from("email_clicks").select("id, clicked_at"),
        supabase.from("email_bounces").select("id, bounced_at, bounce_type"),
        supabase.from("email_complaints").select("id, complained_at"),
        supabase.from("email_unsubscribes").select("id, unsubscribed_at"),
        supabase.from("deliverability_alerts").select("*").is("resolved_at", null).order("created_at", { ascending: false }),
      ]);

      if (campaignsResult.error) throw campaignsResult.error;

      const campaigns = campaignsResult.data || [];
      const opens = opensResult.data || [];
      const clicks = clicksResult.data || [];
      const bounces = bouncesResult.data || [];
      const complaints = complaintsResult.data || [];
      const unsubscribes = unsubscribesResult.data || [];

      // Calculate total sent
      const totalSent = campaigns.reduce((sum, c) => sum + (c.recipient_count || 0), 0);

      // Calculate rates
      const bounceRate = totalSent > 0 ? (bounces.length / totalSent) * 100 : 0;
      const complaintRate = totalSent > 0 ? (complaints.length / totalSent) * 100 : 0;
      const unsubscribeRate = totalSent > 0 ? (unsubscribes.length / totalSent) * 100 : 0;
      const openRate = totalSent > 0 ? (opens.length / totalSent) * 100 : 0;
      const clickRate = totalSent > 0 ? (clicks.length / totalSent) * 100 : 0;

      setMetrics({
        totalSent,
        totalOpens: opens.length,
        totalClicks: clicks.length,
        totalBounces: bounces.length,
        totalComplaints: complaints.length,
        totalUnsubscribes: unsubscribes.length,
        bounceRate,
        complaintRate,
        unsubscribeRate,
        openRate,
        clickRate,
      });

      // Generate trend data for last 30 days
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(new Date(), 29 - i);
        return {
          date: format(date, "yyyy-MM-dd"),
          label: format(date, "MMM d"),
          opens: 0,
          clicks: 0,
          bounces: 0,
        };
      });

      // Aggregate opens by day
      opens.forEach((open) => {
        const openDate = format(parseISO(open.opened_at), "yyyy-MM-dd");
        const dayData = last30Days.find((d) => d.date === openDate);
        if (dayData) dayData.opens += 1;
      });

      // Aggregate clicks by day
      clicks.forEach((click) => {
        const clickDate = format(parseISO(click.clicked_at), "yyyy-MM-dd");
        const dayData = last30Days.find((d) => d.date === clickDate);
        if (dayData) dayData.clicks += 1;
      });

      // Aggregate bounces by day
      bounces.forEach((bounce) => {
        const bounceDate = format(parseISO(bounce.bounced_at), "yyyy-MM-dd");
        const dayData = last30Days.find((d) => d.date === bounceDate);
        if (dayData) dayData.bounces += 1;
      });

      setTrendData(last30Days);
      setActiveAlerts(alertsResult.data || []);
    } catch (error: any) {
      console.error("Error fetching deliverability metrics:", error);
      toast({
        title: "Error loading metrics",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Subscribe to real-time alerts
    const channel = supabase
      .channel('deliverability-alerts')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliverability_alerts',
        },
        (payload) => {
          console.log('Alert change:', payload);
          
          if (payload.eventType === 'INSERT') {
            const newAlert = payload.new as DeliverabilityAlert;
            setActiveAlerts((prev) => [newAlert, ...prev]);
            
            const info = getAlertInfo(newAlert.alert_type);
            
            // Play sound notification
            if (soundEnabled) {
              playAlertSound(info.severity);
            }
            
            // Show browser notification (works even when tab is in background)
            if (notificationPermission === 'granted') {
              showAlertNotification({
                title: `🚨 ${info.title}`,
                body: `${info.description} (${Number(newAlert.metric_value).toFixed(2)}%)`,
                severity: info.severity,
                onClick: () => window.focus(),
              });
            }
            
            toast({
              title: `🚨 ${info.title}`,
              description: `${info.description} (${Number(newAlert.metric_value).toFixed(2)}%)`,
              variant: info.severity === 'critical' ? 'destructive' : 'default',
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as DeliverabilityAlert;
            if (updated.resolved_at) {
              // Alert was resolved - remove from active
              setActiveAlerts((prev) => prev.filter((a) => a.id !== updated.id));
            } else {
              // Update in place
              setActiveAlerts((prev) =>
                prev.map((a) => (a.id === updated.id ? updated : a))
              );
            }
          } else if (payload.eventType === 'DELETE') {
            const deleted = payload.old as DeliverabilityAlert;
            setActiveAlerts((prev) => prev.filter((a) => a.id !== deleted.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const runDeliverabilityCheck = async () => {
    setIsRunningCheck(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-deliverability-alerts');
      
      if (error) throw error;
      
      toast({
        title: "Check completed",
        description: data?.alertsCreated > 0 
          ? `${data.alertsCreated} new alert(s) created` 
          : "No new alerts triggered",
      });
      
      // Refresh the dashboard to show any new alerts
      await fetchMetrics();
    } catch (error: any) {
      console.error("Error running deliverability check:", error);
      toast({
        title: "Check failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsRunningCheck(false);
    }
  };

  const chartConfig = {
    opens: {
      label: "Opens",
      color: "hsl(var(--primary))",
    },
    clicks: {
      label: "Clicks",
      color: "hsl(142 76% 36%)",
    },
    bounces: {
      label: "Bounces",
      color: "hsl(0 84% 60%)",
    },
  };

  const getHealthStatus = () => {
    if (!metrics) return { status: "unknown", color: "text-muted-foreground", icon: AlertCircle };
    
    // Industry standards: bounce rate < 2% is good, complaint rate < 0.1% is good
    if (metrics.bounceRate > 5 || metrics.complaintRate > 0.5) {
      return { status: "Poor", color: "text-destructive", icon: AlertTriangle };
    }
    if (metrics.bounceRate > 2 || metrics.complaintRate > 0.1) {
      return { status: "Fair", color: "text-amber-600", icon: AlertCircle };
    }
    return { status: "Good", color: "text-green-600", icon: CheckCircle };
  };

  const healthStatus = getHealthStatus();
  const HealthIcon = healthStatus.icon;

  const getAlertInfo = (alertType: string) => {
    const alertMap: Record<string, { title: string; description: string; severity: "warning" | "critical" }> = {
      bounce_rate_warning: {
        title: "Bounce Rate Warning",
        description: "Your bounce rate is above 2%. This may affect your sender reputation.",
        severity: "warning",
      },
      bounce_rate_critical: {
        title: "Critical Bounce Rate",
        description: "Your bounce rate is above 5%. Take immediate action to clean your email list.",
        severity: "critical",
      },
      complaint_rate_warning: {
        title: "Complaint Rate Warning",
        description: "Your complaint rate is above 0.1%. Review your email content and targeting.",
        severity: "warning",
      },
      complaint_rate_critical: {
        title: "Critical Complaint Rate",
        description: "Your complaint rate is above 0.5%. This may result in sending restrictions.",
        severity: "critical",
      },
      unsubscribe_rate_warning: {
        title: "High Unsubscribe Rate",
        description: "Your unsubscribe rate is above 1%. Consider reviewing your email frequency and content.",
        severity: "warning",
      },
    };
    return alertMap[alertType] || { title: "Alert", description: "Unknown alert type", severity: "warning" as const };
  };

  const dismissAlert = (alertId: string) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const visibleAlerts = activeAlerts.filter(a => !dismissedAlerts.has(a.id));

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-8 w-8" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Deliverability Dashboard
            <span className={cn("flex items-center gap-1 text-sm font-normal ml-2", healthStatus.color)}>
              <HealthIcon className="h-4 w-4" />
              {healthStatus.status}
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={runDeliverabilityCheck} 
              disabled={isRunningCheck || isLoading}
              className="gap-1.5"
            >
              <Play className={cn("h-3.5 w-3.5", isRunningCheck && "animate-pulse")} />
              {isRunningCheck ? "Checking..." : "Run Check"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSound}
              title={soundEnabled ? "Mute alert sounds" : "Enable alert sounds"}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
            </Button>
            {isNotificationSupported() && (
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleNotifications}
                title={
                  notificationPermission === 'granted' 
                    ? "Browser notifications enabled" 
                    : notificationPermission === 'denied'
                    ? "Browser notifications blocked"
                    : "Enable browser notifications"
                }
              >
                {notificationPermission === 'granted' ? (
                  <Bell className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            )}
            <AlertNotificationSettings />
            <EscalationSettings />
            <AlertEmailTemplateSettings />
            <AlertThresholdSettings onSettingsUpdated={fetchMetrics} />
            <Button variant="ghost" size="icon" onClick={fetchMetrics} disabled={isLoading}>
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Alert Banners */}
        {visibleAlerts.length > 0 && (
          <div className="space-y-3 mb-6">
            {visibleAlerts.map((alert) => {
              const info = getAlertInfo(alert.alert_type);
              const isCritical = info.severity === "critical";
              const escalationLevel = alert.escalation_level || 0;
              const timeUnresolved = formatDistanceToNow(new Date(alert.created_at), { addSuffix: false });
              
              return (
                <Alert
                  key={alert.id}
                  variant={isCritical ? "destructive" : "default"}
                  className={cn(
                    "relative pr-28",
                    !isCritical && "border-amber-500/50 bg-amber-50 dark:bg-amber-950/20"
                  )}
                >
                  {isCritical ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                  )}
                  <AlertTitle className={cn("flex items-center gap-2", !isCritical && "text-amber-800 dark:text-amber-200")}>
                    {info.title}
                    {escalationLevel > 0 && (
                      <span className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-medium rounded",
                        escalationLevel >= 2 
                          ? "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200"
                          : "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-200"
                      )}>
                        <ArrowUpCircle className="h-3 w-3" />
                        Level {escalationLevel}
                      </span>
                    )}
                  </AlertTitle>
                  <AlertDescription className={cn(!isCritical && "text-amber-700 dark:text-amber-300")}>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span>{info.description} (Current: {Number(alert.metric_value).toFixed(2)}%)</span>
                      <span className="inline-flex items-center gap-1 text-xs opacity-75">
                        <Clock className="h-3 w-3" />
                        Unresolved for {timeUnresolved}
                      </span>
                    </div>
                  </AlertDescription>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <AlertResolutionDialog
                      alertId={alert.id}
                      alertType={alert.alert_type}
                      metricValue={alert.metric_value}
                      onResolved={fetchMetrics}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => dismissAlert(alert.id)}
                      title="Dismiss (hide temporarily)"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </Alert>
              );
            })}
          </div>
        )}
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Mail className="h-3.5 w-3.5" />
              Total Sent
            </div>
            <p className="text-xl font-bold">{metrics.totalSent.toLocaleString()}</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Eye className="h-3.5 w-3.5" />
              Open Rate
            </div>
            <p className={cn(
              "text-xl font-bold",
              metrics.openRate >= 20 ? "text-green-600" : 
              metrics.openRate >= 10 ? "text-amber-600" : 
              "text-muted-foreground"
            )}>
              {metrics.openRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">{metrics.totalOpens.toLocaleString()} opens</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <MousePointer className="h-3.5 w-3.5" />
              Click Rate
            </div>
            <p className={cn(
              "text-xl font-bold",
              metrics.clickRate >= 3 ? "text-green-600" : 
              metrics.clickRate >= 1 ? "text-amber-600" : 
              "text-muted-foreground"
            )}>
              {metrics.clickRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">{metrics.totalClicks.toLocaleString()} clicks</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertTriangle className="h-3.5 w-3.5" />
              Bounce Rate
            </div>
            <p className={cn(
              "text-xl font-bold",
              metrics.bounceRate <= 2 ? "text-green-600" : 
              metrics.bounceRate <= 5 ? "text-amber-600" : 
              "text-destructive"
            )}>
              {metrics.bounceRate.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">{metrics.totalBounces} bounces</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Ban className="h-3.5 w-3.5" />
              Complaint Rate
            </div>
            <p className={cn(
              "text-xl font-bold",
              metrics.complaintRate <= 0.1 ? "text-green-600" : 
              metrics.complaintRate <= 0.5 ? "text-amber-600" : 
              "text-destructive"
            )}>
              {metrics.complaintRate.toFixed(3)}%
            </p>
            <p className="text-xs text-muted-foreground">{metrics.totalComplaints} complaints</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <UserMinus className="h-3.5 w-3.5" />
              Unsubscribe Rate
            </div>
            <p className={cn(
              "text-xl font-bold",
              metrics.unsubscribeRate <= 0.5 ? "text-green-600" : 
              metrics.unsubscribeRate <= 1 ? "text-amber-600" : 
              "text-destructive"
            )}>
              {metrics.unsubscribeRate.toFixed(2)}%
            </p>
            <p className="text-xs text-muted-foreground">{metrics.totalUnsubscribes} unsubscribes</p>
          </div>
        </div>

        {/* Engagement Trends Chart */}
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Engagement Trends (Last 30 Days)
          </h4>
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="fillOpens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillClicks" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142 76% 36%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142 76% 36%)" stopOpacity={0} />
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
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="opens"
                stroke="hsl(var(--primary))"
                fill="url(#fillOpens)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="hsl(142 76% 36%)"
                fill="url(#fillClicks)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Bounce Trend Chart */}
        <div>
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Bounce Trend (Last 30 Days)
          </h4>
          <ChartContainer config={chartConfig} className="h-[120px] w-full">
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="bounces"
                fill="hsl(0 84% 60%)"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        </div>

        {/* Alert Frequency Trends */}
        <AlertFrequencyTrends />

        {/* Alert History */}
        <AlertHistory />
      </CardContent>
    </Card>
  );
};

export default DeliverabilityDashboard;
