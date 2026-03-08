import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Calculator, Atom, TrendingUp, Info } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CalculatorParams {
  observerMass: number;
  targetMass: number;
  distance: number;
  gravityConstant: number;
}

const PRESETS = [
  { 
    name: "頂級廚師評餐廳", 
    nameEn: "Master Chef → Restaurant",
    observerMass: 95, 
    targetMass: 50, 
    distance: 0.1,
    description: "專業領域高度相關"
  },
  { 
    name: "廚師評軟體公司", 
    nameEn: "Chef → Software Co.",
    observerMass: 95, 
    targetMass: 50, 
    distance: 100,
    description: "跨領域低相關性"
  },
  { 
    name: "新用戶觀察", 
    nameEn: "New User Observation",
    observerMass: 10, 
    targetMass: 80, 
    distance: 1,
    description: "低質量觀察者"
  },
  { 
    name: "機構級觀察", 
    nameEn: "Institutional Observer",
    observerMass: 100, 
    targetMass: 100, 
    distance: 0.5,
    description: "頂級雙向互動"
  },
];

const formatNumber = (num: number): string => {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  if (num < 0.01) return num.toExponential(2);
  return num.toFixed(2);
};

const getInfluenceLevel = (influence: number): { label: string; labelEn: string; color: string } => {
  if (influence >= 10000) return { label: "黑洞級", labelEn: "Black Hole", color: "text-purple-400" };
  if (influence >= 1000) return { label: "恆星級", labelEn: "Stellar", color: "text-gold" };
  if (influence >= 100) return { label: "行星級", labelEn: "Planetary", color: "text-blue-400" };
  if (influence >= 10) return { label: "衛星級", labelEn: "Satellite", color: "text-cyan-400" };
  if (influence >= 1) return { label: "小行星級", labelEn: "Asteroid", color: "text-white/60" };
  return { label: "塵埃級", labelEn: "Dust", color: "text-white/30" };
};

const GravityCalculator = () => {
  const [params, setParams] = useState<CalculatorParams>({
    observerMass: 50,
    targetMass: 50,
    distance: 1,
    gravityConstant: 6.674,
  });

  const influence = useMemo(() => {
    const { observerMass, targetMass, distance, gravityConstant } = params;
    if (distance === 0) return Infinity;
    return (gravityConstant * observerMass * targetMass) / (distance * distance);
  }, [params]);

  const influenceLevel = useMemo(() => getInfluenceLevel(influence), [influence]);

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setParams(prev => ({
      ...prev,
      observerMass: preset.observerMass,
      targetMass: preset.targetMass,
      distance: preset.distance,
    }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="border border-gold/30 bg-gradient-to-b from-gold/5 to-transparent backdrop-blur-sm p-6 md:p-8 relative"
    >
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-gold/40" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-gold/40" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-gold/40" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-gold/40" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded border border-gold/30 flex items-center justify-center bg-gold/5">
          <Calculator className="w-5 h-5 text-gold/70" />
        </div>
        <div>
          <h3 className="text-gold/80 text-xs tracking-[0.3em] uppercase font-mono">Interactive Simulator</h3>
          <p className="text-white/90 font-medium">觀察引力計算器</p>
        </div>
      </div>

      {/* Formula display */}
      <div className="bg-black/50 rounded p-4 mb-6 text-center font-mono">
        <p className="text-white/40 text-xs mb-2">Buoyancis Gravity Formula</p>
        <p className="text-lg md:text-xl text-gold">
          Influence = G × M<sub className="text-xs">obs</sub> × M<sub className="text-xs">target</sub> / r²
        </p>
      </div>

      {/* Presets */}
      <div className="mb-6">
        <p className="text-white/50 text-xs font-mono mb-3">快速預設 / Quick Presets</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {PRESETS.map((preset, i) => (
            <button
              key={i}
              onClick={() => applyPreset(preset)}
              className="px-3 py-2 border border-white/10 bg-white/5 hover:border-gold/30 hover:bg-gold/5 transition-colors text-left group"
            >
              <p className="text-white/80 text-xs font-medium group-hover:text-gold transition-colors">{preset.name}</p>
              <p className="text-white/30 text-[10px]">{preset.nameEn}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Parameters */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Observer Mass */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white/70 text-sm font-mono flex items-center gap-2">
              <span className="text-gold">M<sub>obs</sub></span>
              <span className="text-white/40">觀察者質量</span>
            </Label>
            <span className="text-gold font-mono text-sm">{params.observerMass}</span>
          </div>
          <Slider
            value={[params.observerMass]}
            onValueChange={([value]) => setParams(prev => ({ ...prev, observerMass: value }))}
            min={1}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-gold [&_[role=slider]]:border-gold [&_.bg-primary]:bg-gold"
          />
          <p className="text-white/30 text-xs">歷史誠信與專業權重 (1-100)</p>
        </div>

        {/* Target Mass */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white/70 text-sm font-mono flex items-center gap-2">
              <span className="text-gold">M<sub>target</sub></span>
              <span className="text-white/40">目標質量</span>
            </Label>
            <span className="text-gold font-mono text-sm">{params.targetMass}</span>
          </div>
          <Slider
            value={[params.targetMass]}
            onValueChange={([value]) => setParams(prev => ({ ...prev, targetMass: value }))}
            min={1}
            max={100}
            step={1}
            className="[&_[role=slider]]:bg-gold [&_[role=slider]]:border-gold [&_.bg-primary]:bg-gold"
          />
          <p className="text-white/30 text-xs">被觀察對象的累積信用值 (1-100)</p>
        </div>

        {/* Distance */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white/70 text-sm font-mono flex items-center gap-2">
              <span className="text-gold">r</span>
              <span className="text-white/40">相關性距離</span>
            </Label>
            <span className="text-gold font-mono text-sm">{params.distance.toFixed(1)}</span>
          </div>
          <Slider
            value={[params.distance * 10]}
            onValueChange={([value]) => setParams(prev => ({ ...prev, distance: value / 10 }))}
            min={1}
            max={1000}
            step={1}
            className="[&_[role=slider]]:bg-gold [&_[role=slider]]:border-gold [&_.bg-primary]:bg-gold"
          />
          <p className="text-white/30 text-xs">專業圖譜距離 (0.1 = 高度相關, 100 = 跨領域)</p>
        </div>

        {/* Gravity Constant */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-white/70 text-sm font-mono flex items-center gap-2">
              <span className="text-gold">G</span>
              <span className="text-white/40">協議重力常數</span>
            </Label>
            <Input
              type="number"
              value={params.gravityConstant}
              onChange={(e) => setParams(prev => ({ ...prev, gravityConstant: parseFloat(e.target.value) || 1 }))}
              className="w-20 h-8 bg-black/50 border-white/20 text-gold text-right font-mono text-sm"
              step="0.001"
              min="0.001"
            />
          </div>
          <p className="text-white/30 text-xs">由 Genesis Nodes 初始質量定義 (預設: 6.674)</p>
        </div>
      </div>

      {/* Result */}
      <div className="border-t border-white/10 pt-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full border-2 border-gold/50 flex items-center justify-center bg-gold/10">
              <Atom className="w-6 h-6 text-gold animate-pulse" />
            </div>
            <div>
              <p className="text-white/50 text-xs font-mono mb-1">計算結果 / Calculated Influence</p>
              <p className="text-3xl md:text-4xl font-light text-gold">
                {isFinite(influence) ? formatNumber(influence) : "∞"}
              </p>
            </div>
          </div>
          
          <div className="text-center md:text-right">
            <p className="text-white/40 text-xs font-mono mb-1">影響力等級 / Influence Level</p>
            <p className={`text-xl font-medium ${influenceLevel.color}`}>
              {influenceLevel.label}
              <span className="text-white/30 text-sm ml-2">({influenceLevel.labelEn})</span>
            </p>
          </div>
        </div>

        {/* Insight */}
        <div className="mt-6 p-4 bg-white/5 rounded border border-white/10">
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 text-gold/60 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm">
              <p className="text-white/60">
                <span className="text-gold">距離 r 的平方效應：</span>
                當 r 從 1 增加到 10，引力將減少 100 倍。專業相關性是影響力的關鍵槓桿。
              </p>
              <p className="text-white/40 text-xs font-mono">
                The r² factor means doubling the distance reduces influence by 4x. Professional relevance is the key leverage.
              </p>
            </div>
          </div>
        </div>

        {/* Visual comparison */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "你的引力", value: influence, icon: TrendingUp },
            { label: "vs 新用戶", value: (params.gravityConstant * 10 * params.targetMass) / (params.distance * params.distance), icon: null },
            { label: "vs 機構", value: (params.gravityConstant * 100 * params.targetMass) / (0.5 * 0.5), icon: null },
            { label: "相對強度", value: influence / ((params.gravityConstant * 50 * 50) / 1), icon: null, isRatio: true },
          ].map((item, i) => (
            <div key={i} className="bg-black/30 border border-white/5 p-3 text-center">
              <p className="text-white/40 text-xs mb-1">{item.label}</p>
              <p className="text-white/80 font-mono text-sm">
                {isFinite(item.value) 
                  ? (item.isRatio ? `${(item.value * 100).toFixed(1)}%` : formatNumber(item.value))
                  : "∞"
                }
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default GravityCalculator;
