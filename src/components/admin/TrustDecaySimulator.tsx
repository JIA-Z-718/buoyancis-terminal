import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ReferenceLine,
} from "recharts";
import { Activity, Play, RotateCcw, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SimulatorConfig {
  initialFrequency: number;
  halfLifeDays: number;
  daysSinceObservation: number;
}

const chartConfig: ChartConfig = {
  frequency: {
    label: "Resonance Frequency",
    color: "hsl(45 80% 55%)",
  },
  threshold: {
    label: "Tier Threshold",
    color: "hsl(var(--destructive))",
  },
};

const tierThresholds = [
  { tier: 1, name: "Observer", threshold: 0, color: "#6b7280" },
  { tier: 2, name: "Witness", threshold: 10, color: "#3b82f6" },
  { tier: 3, name: "Guardian", threshold: 50, color: "#8b5cf6" },
  { tier: 4, name: "Sage", threshold: 200, color: "#f59e0b" },
  { tier: 5, name: "Oracle", threshold: 500, color: "#ef4444" },
];

const TrustDecaySimulator = () => {
  const [config, setConfig] = useState<SimulatorConfig>({
    initialFrequency: 100,
    halfLifeDays: 30,
    daysSinceObservation: 0,
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDay, setAnimationDay] = useState(0);

  // Calculate decay using half-life formula: N(t) = N₀ × (1/2)^(t/t½)
  const calculateDecay = (initial: number, halfLife: number, days: number) => {
    return initial * Math.pow(0.5, days / halfLife);
  };

  // Generate curve data points
  const curveData = useMemo(() => {
    const points = [];
    const maxDays = config.halfLifeDays * 4; // Show 4 half-lives
    
    for (let day = 0; day <= maxDays; day += 1) {
      const frequency = calculateDecay(
        config.initialFrequency,
        config.halfLifeDays,
        day
      );
      points.push({
        day,
        frequency: Math.max(0.01, frequency),
        isCurrentDay: day === Math.floor(config.daysSinceObservation),
      });
    }
    return points;
  }, [config.initialFrequency, config.halfLifeDays, config.daysSinceObservation]);

  // Current frequency based on days since observation
  const currentFrequency = useMemo(() => {
    const days = isAnimating ? animationDay : config.daysSinceObservation;
    return calculateDecay(config.initialFrequency, config.halfLifeDays, days);
  }, [config, isAnimating, animationDay]);

  // Current tier based on frequency
  const currentTier = useMemo(() => {
    for (let i = tierThresholds.length - 1; i >= 0; i--) {
      if (currentFrequency >= tierThresholds[i].threshold) {
        return tierThresholds[i];
      }
    }
    return tierThresholds[0];
  }, [currentFrequency]);

  // Animate decay over time
  const startAnimation = () => {
    setIsAnimating(true);
    setAnimationDay(0);
    
    const maxDays = config.halfLifeDays * 3;
    let day = 0;
    
    const interval = setInterval(() => {
      day += 0.5;
      setAnimationDay(day);
      
      if (day >= maxDays) {
        clearInterval(interval);
        setIsAnimating(false);
        setConfig(prev => ({ ...prev, daysSinceObservation: maxDays }));
      }
    }, 50);
  };

  const resetSimulation = () => {
    setIsAnimating(false);
    setAnimationDay(0);
    setConfig(prev => ({ ...prev, daysSinceObservation: 0 }));
  };

  const displayDay = isAnimating ? animationDay : config.daysSinceObservation;

  return (
    <Card className="border-gold/20 bg-gradient-to-br from-background to-gold/5">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-gold" />
          <CardTitle className="text-base font-medium">
            Trust Decay Simulator
          </CardTitle>
          <Badge variant="outline" className="border-gold/30 text-gold text-xs">
            N(t) = N₀ × (½)^(t/t½)
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={resetSimulation}
            disabled={isAnimating}
          >
            <RotateCcw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button
            size="sm"
            onClick={startAnimation}
            disabled={isAnimating}
            className="bg-gold hover:bg-gold/80 text-black"
          >
            <Play className="h-4 w-4 mr-1" />
            Simulate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current State Display */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">
              Current Frequency
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentFrequency.toFixed(1)}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="text-2xl font-bold text-gold"
              >
                {currentFrequency.toFixed(2)}
              </motion.div>
            </AnimatePresence>
            <div className="text-xs text-muted-foreground">
              of {config.initialFrequency} initial
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">
              Days Elapsed
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                key={displayDay.toFixed(0)}
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 10, opacity: 0 }}
                transition={{ duration: 0.1 }}
                className="text-2xl font-bold"
              >
                {displayDay.toFixed(0)}
              </motion.div>
            </AnimatePresence>
            <div className="text-xs text-muted-foreground">
              / {config.halfLifeDays}d half-life
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 text-center">
            <div className="text-xs text-muted-foreground mb-1">
              Current Tier
            </div>
            <motion.div
              key={currentTier.name}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold"
              style={{ color: currentTier.color }}
            >
              {currentTier.name}
            </motion.div>
            <div className="text-xs text-muted-foreground">
              T{currentTier.tier} ≥ {currentTier.threshold}
            </div>
          </div>
        </div>

        {/* Half-Life Curve Chart */}
        <div className="relative">
          <ChartContainer config={chartConfig} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={curveData}>
                <defs>
                  <linearGradient id="frequencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(45 80% 55%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(45 80% 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  label={{ value: "Days Since Observation", position: "bottom", fontSize: 10 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10 }}
                  domain={[0, config.initialFrequency * 1.1]}
                  label={{ value: "Frequency", angle: -90, position: "insideLeft", fontSize: 10 }}
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  formatter={(value: number) => [value.toFixed(2), "Frequency"]}
                />
                
                {/* Tier threshold lines */}
                {tierThresholds.slice(1).map((tier) => (
                  <ReferenceLine
                    key={tier.tier}
                    y={tier.threshold}
                    stroke={tier.color}
                    strokeDasharray="5 5"
                    strokeOpacity={0.5}
                  />
                ))}
                
                {/* Half-life reference line */}
                <ReferenceLine
                  x={config.halfLifeDays}
                  stroke="hsl(var(--destructive))"
                  strokeDasharray="3 3"
                  label={{
                    value: `t½ = ${config.halfLifeDays}d`,
                    position: "top",
                    fontSize: 10,
                    fill: "hsl(var(--destructive))",
                  }}
                />
                
                {/* Current position line */}
                <ReferenceLine
                  x={displayDay}
                  stroke="hsl(45 80% 55%)"
                  strokeWidth={2}
                />
                
                <Area
                  type="monotone"
                  dataKey="frequency"
                  stroke="hsl(45 80% 55%)"
                  strokeWidth={2}
                  fill="url(#frequencyGradient)"
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
          
          {/* Animated current point indicator */}
          {isAnimating && (
            <motion.div
              className="absolute w-4 h-4 bg-gold rounded-full shadow-lg shadow-gold/50"
              style={{
                left: `calc(${(displayDay / (config.halfLifeDays * 4)) * 100}% + 40px)`,
                bottom: `calc(${(currentFrequency / (config.initialFrequency * 1.1)) * 100}% + 20px)`,
              }}
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.5 }}
            />
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4 pt-4 border-t">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-2">
                <Zap className="w-3 h-3 text-gold" />
                Initial Frequency (N₀)
              </span>
              <span className="font-mono font-bold text-gold">
                {config.initialFrequency}
              </span>
            </div>
            <Slider
              value={[config.initialFrequency]}
              onValueChange={([value]) =>
                setConfig((prev) => ({ ...prev, initialFrequency: value }))
              }
              min={10}
              max={500}
              step={10}
              disabled={isAnimating}
              className="[&_[role=slider]]:bg-gold"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Half-Life Period (t½)</span>
              <span className="font-mono font-bold">{config.halfLifeDays} days</span>
            </div>
            <Slider
              value={[config.halfLifeDays]}
              onValueChange={([value]) =>
                setConfig((prev) => ({ ...prev, halfLifeDays: value }))
              }
              min={7}
              max={90}
              step={1}
              disabled={isAnimating}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Days Since Observation</span>
              <span className="font-mono font-bold">{displayDay.toFixed(0)} days</span>
            </div>
            <Slider
              value={[config.daysSinceObservation]}
              onValueChange={([value]) =>
                setConfig((prev) => ({ ...prev, daysSinceObservation: value }))
              }
              min={0}
              max={config.halfLifeDays * 4}
              step={1}
              disabled={isAnimating}
            />
          </div>
        </div>

        {/* Formula Explanation */}
        <div className="rounded-lg bg-muted/30 p-4 text-sm">
          <div className="font-medium mb-2 flex items-center gap-2">
            <span className="font-mono text-gold">N(t) = N₀ × (½)^(t/t½)</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            <p>• <strong>N(t)</strong> = Resonance frequency at time t</p>
            <p>• <strong>N₀</strong> = Initial frequency ({config.initialFrequency})</p>
            <p>• <strong>t</strong> = Days since last observation ({displayDay.toFixed(0)})</p>
            <p>• <strong>t½</strong> = Half-life period ({config.halfLifeDays} days)</p>
            <p className="pt-2 text-muted-foreground italic">
              「物壯則老」— All things decline after reaching their prime
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TrustDecaySimulator;
