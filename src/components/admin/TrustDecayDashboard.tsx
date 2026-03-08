import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Zap,
  Clock,
  Flame,
  Sparkles,
  RotateCcw,
  Play,
} from "lucide-react";
import { format, subDays, parseISO, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import TrustDecaySimulator from "./TrustDecaySimulator";

interface TrustProfile {
  id: string;
  user_id: string;
  resonance_frequency: number;
  base_frequency: number;
  accumulated_observations: number;
  last_observation_at: string | null;
  is_incubated: boolean;
  incubation_expires_at: string | null;
  current_tier: number;
  created_at: string;
}

interface EntropyCleaningCycle {
  id: string;
  cycle_number: number;
  started_at: string;
  completed_at: string | null;
  users_affected: number | null;
  total_frequency_redistributed: number | null;
  excess_harvested: number | null;
  deficiency_supplemented: number | null;
  status: string;
}

interface SovereigntySettings {
  decay_half_life_days: number;
  incubation_duration_days: number;
  entropy_cleaning_interval_days: number;
}

const tierNames = ["Observer", "Witness", "Guardian", "Sage", "Oracle"];
const tierColors = ["#6b7280", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444"];

const chartConfig: ChartConfig = {
  frequency: {
    label: "Resonance Frequency",
    color: "hsl(45 80% 55%)",
  },
  observations: {
    label: "Observations",
    color: "hsl(var(--primary))",
  },
};

const TrustDecayDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningDecay, setIsRunningDecay] = useState(false);
  const [profiles, setProfiles] = useState<TrustProfile[]>([]);
  const [cleaningCycles, setCleaningCycles] = useState<EntropyCleaningCycle[]>([]);
  const [settings, setSettings] = useState<SovereigntySettings | null>(null);
  const { toast } = useToast();

  const runDecayCalculation = async () => {
    setIsRunningDecay(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/calculate-trust-decay`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${sessionData.session?.access_token}`,
          },
          body: JSON.stringify({}),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to run decay calculation");
      }

      toast({
        title: "Trust Decay Calculated",
        description: `Processed ${result.processed} profiles. ${result.demoted} demoted, ${result.at_risk} at risk.`,
      });

      // Refresh data
      fetchData();
    } catch (error: any) {
      console.error("Error running decay calculation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to run decay calculation",
        variant: "destructive",
      });
    } finally {
      setIsRunningDecay(false);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [profilesResult, cyclesResult, settingsResult] = await Promise.all([
        supabase
          .from("trust_profiles")
          .select("*")
          .order("resonance_frequency", { ascending: false })
          .limit(100),
        supabase
          .from("entropy_cleaning_cycles")
          .select("*")
          .order("cycle_number", { ascending: false })
          .limit(10),
        supabase
          .from("sovereignty_settings")
          .select("setting_key, setting_value"),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (cyclesResult.error) throw cyclesResult.error;
      if (settingsResult.error) throw settingsResult.error;

      setProfiles(profilesResult.data || []);
      setCleaningCycles(cyclesResult.data || []);

      // Parse settings
      const settingsMap: Record<string, any> = {};
      (settingsResult.data || []).forEach((s) => {
        settingsMap[s.setting_key] = typeof s.setting_value === 'string' 
          ? JSON.parse(s.setting_value) 
          : s.setting_value;
      });
      
      setSettings({
        decay_half_life_days: settingsMap.decay_half_life_days || 30,
        incubation_duration_days: settingsMap.incubation_duration_days || 90,
        entropy_cleaning_interval_days: settingsMap.entropy_cleaning_interval_days || 365,
      });
    } catch (error) {
      console.error("Error fetching trust decay data:", error);
      toast({
        title: "Error",
        description: "Failed to load trust decay data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Calculate tier distribution
  const tierDistribution = useMemo(() => {
    const distribution = [0, 0, 0, 0, 0];
    profiles.forEach((p) => {
      const tierIndex = Math.min(p.current_tier - 1, 4);
      distribution[tierIndex]++;
    });
    return distribution.map((count, index) => ({
      tier: tierNames[index],
      count,
      color: tierColors[index],
    }));
  }, [profiles]);

  // Calculate decay risk users
  const decayRiskUsers = useMemo(() => {
    if (!settings) return [];
    const halfLifeDays = settings.decay_half_life_days;
    
    return profiles
      .filter((p) => {
        if (!p.last_observation_at) return true;
        const daysSinceObservation = differenceInDays(
          new Date(),
          parseISO(p.last_observation_at)
        );
        return daysSinceObservation > halfLifeDays * 0.5;
      })
      .slice(0, 10);
  }, [profiles, settings]);

  // Calculate incubated users
  const incubatedUsers = useMemo(() => {
    return profiles.filter((p) => p.is_incubated).length;
  }, [profiles]);

  // Calculate average frequency
  const avgFrequency = useMemo(() => {
    if (profiles.length === 0) return 0;
    return profiles.reduce((sum, p) => sum + Number(p.resonance_frequency), 0) / profiles.length;
  }, [profiles]);

  // Calculate total observations
  const totalObservations = useMemo(() => {
    return profiles.reduce((sum, p) => sum + p.accumulated_observations, 0);
  }, [profiles]);

  // Last entropy cleaning
  const lastCleaning = cleaningCycles.find((c) => c.status === "completed");
  const nextCleaningDays = useMemo(() => {
    if (!lastCleaning || !settings) return null;
    const lastCleaningDate = parseISO(lastCleaning.completed_at || lastCleaning.started_at);
    const nextCleaning = new Date(lastCleaningDate);
    nextCleaning.setDate(nextCleaning.getDate() + settings.entropy_cleaning_interval_days);
    return differenceInDays(nextCleaning, new Date());
  }, [lastCleaning, settings]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
            <Skeleton className="h-64" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Trust Decay Simulator */}
      <TrustDecaySimulator />

      {/* Header Card */}
      <Card className="border-gold/20 bg-gradient-to-br from-background to-gold/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gold" />
            <CardTitle className="text-base font-medium">
              Managed Sovereignty Dashboard
            </CardTitle>
            <Badge variant="outline" className="border-gold/30 text-gold text-xs">
              馬太效應
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={runDecayCalculation}
              disabled={isRunningDecay || isLoading}
              className="border-gold/30 text-gold hover:bg-gold/10"
            >
              <Play className={`h-4 w-4 mr-1 ${isRunningDecay ? "animate-pulse" : ""}`} />
              Run Decay
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Users className="w-3 h-3" />
                Total Observers
              </div>
              <div className="text-2xl font-bold">{profiles.length}</div>
              <div className="text-xs text-muted-foreground">
                {incubatedUsers} incubated
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Zap className="w-3 h-3 text-gold" />
                Avg. Frequency
              </div>
              <div className="text-2xl font-bold text-gold">
                {avgFrequency.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">
                resonance units
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Sparkles className="w-3 h-3" />
                Total Observations
              </div>
              <div className="text-2xl font-bold">{totalObservations}</div>
              <div className="text-xs text-muted-foreground">
                accumulated
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Clock className="w-3 h-3 text-amber-500" />
                Decay Risk
              </div>
              <div className="text-2xl font-bold text-amber-500">
                {decayRiskUsers.length}
              </div>
              <div className="text-xs text-muted-foreground">
                users at risk
              </div>
            </div>
          </div>

          {/* Tier Distribution */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-gold" />
              Tier Distribution (Credibility Hierarchy)
            </h4>
            <div className="space-y-2">
              {tierDistribution.map((tier, index) => (
                <div key={tier.tier} className="flex items-center gap-3">
                  <div className="w-20 text-xs font-medium" style={{ color: tier.color }}>
                    {tier.tier}
                  </div>
                  <div className="flex-1">
                    <Progress 
                      value={profiles.length > 0 ? (tier.count / profiles.length) * 100 : 0} 
                      className="h-2"
                      style={{ 
                        // @ts-ignore
                        "--progress-foreground": tier.color 
                      }}
                    />
                  </div>
                  <div className="w-12 text-xs text-right text-muted-foreground">
                    {tier.count} ({profiles.length > 0 ? Math.round((tier.count / profiles.length) * 100) : 0}%)
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tier Bar Chart */}
          <ChartContainer config={chartConfig} className="h-48 mb-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tierDistribution}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="tier"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  allowDecimals={false}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {tierDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Entropy Cleaning Card */}
      <Card className="border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5 text-purple-500" />
            <CardTitle className="text-base font-medium">
              Entropy Cleaning Cycles
            </CardTitle>
            <Badge variant="outline" className="border-purple-500/30 text-purple-500 text-xs">
              天之道
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Cycles Completed
              </div>
              <div className="text-2xl font-bold">
                {cleaningCycles.filter((c) => c.status === "completed").length}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Next Cleaning In
              </div>
              <div className="text-2xl font-bold">
                {nextCleaningDays !== null ? (
                  nextCleaningDays > 0 ? `${nextCleaningDays}d` : "Due"
                ) : (
                  "—"
                )}
              </div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Half-Life Period
              </div>
              <div className="text-2xl font-bold">
                {settings?.decay_half_life_days || 30}d
              </div>
            </div>
          </div>

          {/* Cleaning History */}
          {cleaningCycles.length > 0 ? (
            <div className="space-y-2">
              <h4 className="text-sm font-medium mb-2">Recent Cycles</h4>
              {cleaningCycles.slice(0, 5).map((cycle) => (
                <div
                  key={cycle.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={cycle.status === "completed" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      #{cycle.cycle_number}
                    </Badge>
                    <div className="text-sm">
                      {format(parseISO(cycle.started_at), "MMM d, yyyy HH:mm")}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    {cycle.users_affected !== null && (
                      <span>{cycle.users_affected} users</span>
                    )}
                    {cycle.excess_harvested !== null && (
                      <span className="text-red-500">
                        -{Number(cycle.excess_harvested).toFixed(2)} excess
                      </span>
                    )}
                    {cycle.deficiency_supplemented !== null && (
                      <span className="text-green-500">
                        +{Number(cycle.deficiency_supplemented).toFixed(2)} boost
                      </span>
                    )}
                    <Badge
                      variant={cycle.status === "completed" ? "outline" : "secondary"}
                      className="text-xs"
                    >
                      {cycle.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No entropy cleaning cycles yet</p>
              <p className="text-xs mt-1">
                「損有餘而補不足」— The first cycle will recalibrate the system
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decay Risk Users */}
      {decayRiskUsers.length > 0 && (
        <Card className="border-amber-500/20 bg-gradient-to-br from-background to-amber-500/5">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base font-medium">
                Decay Risk Users
              </CardTitle>
              <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-xs">
                物壯則老
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground mb-4">
              Users approaching trust half-life ({settings?.decay_half_life_days || 30} days)
            </div>
            <div className="space-y-2">
              {decayRiskUsers.map((user) => {
                const daysSinceObservation = user.last_observation_at
                  ? differenceInDays(new Date(), parseISO(user.last_observation_at))
                  : 999;
                const decayProgress = Math.min(
                  100,
                  (daysSinceObservation / (settings?.decay_half_life_days || 30)) * 100
                );

                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-2 rounded-lg border bg-card/50"
                  >
                    <Badge
                      variant="outline"
                      style={{ borderColor: tierColors[user.current_tier - 1] }}
                      className="text-xs"
                    >
                      T{user.current_tier}
                    </Badge>
                    <div className="flex-1">
                      <div className="text-xs font-mono truncate">
                        {user.user_id.slice(0, 8)}...
                      </div>
                      <Progress
                        value={decayProgress}
                        className="h-1 mt-1"
                      />
                    </div>
                    <div className="text-xs text-amber-500">
                      {daysSinceObservation}d inactive
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {Number(user.resonance_frequency).toFixed(2)} freq
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Parameters */}
      {settings && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Sovereignty Parameters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">Trust Half-Life</div>
                <div className="font-mono font-bold">{settings.decay_half_life_days} days</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">Incubation Period</div>
                <div className="font-mono font-bold">{settings.incubation_duration_days} days</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground">Cleaning Interval</div>
                <div className="font-mono font-bold">{settings.entropy_cleaning_interval_days} days</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrustDecayDashboard;
