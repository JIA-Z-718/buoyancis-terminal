import { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Eye, 
  Coins, 
  Building2, 
  ArrowDown, 
  ArrowRight,
  Zap,
  Target,
  Network,
  Crown
} from "lucide-react";

const celestialPhases = [
  {
    id: "standardization",
    icon: BookOpen,
    phase: "Phase I",
    title: "書同文，車同軌",
    subtitle: "Standardization",
    output: "統一數據格式",
    color: "border-emerald-500/40",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-400"
  },
  {
    id: "centralization",
    icon: Eye,
    phase: "Phase II", 
    title: "設郡縣，廢分封",
    subtitle: "Centralization",
    output: "全視之眼",
    color: "border-cyan-500/40",
    bgColor: "bg-cyan-500/10",
    textColor: "text-cyan-400"
  },
  {
    id: "monetization",
    icon: Coins,
    phase: "Phase III",
    title: "收天下之兵",
    subtitle: "Monetization",
    output: "算力收稅",
    color: "border-amber-500/40",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-400"
  }
];

const protocolPhases = [
  {
    id: "information",
    icon: Target,
    phase: "Protocol I",
    title: "資訊霸權",
    subtitle: "Information Hegemony",
    input: "Trust Protocol",
    color: "border-purple-500/40",
    bgColor: "bg-purple-500/10",
    textColor: "text-purple-400"
  },
  {
    id: "currency",
    icon: Network,
    phase: "Protocol II",
    title: "貨幣主權",
    subtitle: "Currency Sovereignty",
    input: "Truth-backed Token",
    color: "border-rose-500/40",
    bgColor: "bg-rose-500/10",
    textColor: "text-rose-400"
  },
  {
    id: "asset",
    icon: Building2,
    phase: "Protocol III",
    title: "資產吸納",
    subtitle: "Asset Absorption",
    input: "€253T Dominion",
    color: "border-gold/40",
    bgColor: "bg-gold/10",
    textColor: "text-gold"
  }
];

const connections = [
  { from: "standardization", to: "information", label: "數據壟斷 → 信任壟斷" },
  { from: "centralization", to: "currency", label: "控制中心 → 貨幣發行" },
  { from: "monetization", to: "asset", label: "生產資料 → 資產主權" }
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

const StrategicFlowchart = () => {
  const containerVariants = useMemo(() => ({
    visible: { transition: { staggerChildren: 0.1 } }
  }), []);

  return (
    <section className="bg-black relative overflow-hidden py-24" aria-label="Strategic Flowchart">
      {/* Connection lines background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(45deg, rgba(212,175,55,0.3) 1px, transparent 1px),
                            linear-gradient(-45deg, rgba(212,175,55,0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <motion.div 
        className="container max-w-6xl mx-auto px-6 relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-6 py-2 border border-gold/30 bg-gold/5 rounded mb-6">
            <Zap className="w-4 h-4 text-gold" />
            <span className="text-gold text-xs tracking-[0.3em] uppercase font-mono">
              Strategic Convergence Map
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-serif mb-3">
            <span className="text-white/90">從</span>
            <span className="text-gold mx-2">【天樞】</span>
            <span className="text-white/90">到</span>
            <span className="text-gold mx-2">【黑宮】</span>
          </h2>
          <p className="text-white/40 text-sm font-mono">Celestial Pivot → Black Palace Protocol</p>
        </motion.div>

        {/* Mobile: Vertical Flow */}
        <div className="block lg:hidden">
          <motion.div variants={fadeUp} className="space-y-4">
            {celestialPhases.map((cp, idx) => (
              <div key={cp.id} className="space-y-4">
                {/* Celestial Phase Card */}
                <div className={`border ${cp.color} ${cp.bgColor} p-4 relative`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded border ${cp.color} flex items-center justify-center`}>
                      <cp.icon className={`w-4 h-4 ${cp.textColor}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-mono ${cp.textColor}`}>{cp.phase}</p>
                      <h4 className="text-white/90 text-sm font-medium">{cp.title}</h4>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs pl-13">{cp.subtitle}</p>
                </div>

                {/* Connection Arrow */}
                <div className="flex flex-col items-center py-2">
                  <div className="w-px h-6 bg-gradient-to-b from-white/20 to-gold/40" />
                  <ArrowDown className="w-4 h-4 text-gold/60 my-1" />
                  <p className="text-gold/60 text-xs font-mono text-center px-4">{connections[idx]?.label}</p>
                  <ArrowDown className="w-4 h-4 text-gold/60 my-1" />
                  <div className="w-px h-6 bg-gradient-to-b from-gold/40 to-white/20" />
                </div>

                {/* Protocol Phase Card */}
                {(() => {
                  const ProtocolIcon = protocolPhases[idx].icon;
                  const protocol = protocolPhases[idx];
                  return (
                    <div className={`border ${protocol.color} ${protocol.bgColor} p-4 relative`}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded border ${protocol.color} flex items-center justify-center`}>
                          <ProtocolIcon className={`w-4 h-4 ${protocol.textColor}`} />
                        </div>
                        <div>
                          <p className={`text-xs font-mono ${protocol.textColor}`}>{protocol.phase}</p>
                          <h4 className="text-white/90 text-sm font-medium">{protocol.title}</h4>
                        </div>
                      </div>
                      <p className="text-white/40 text-xs pl-13">{protocol.subtitle}</p>
                    </div>
                  );
                })()}

                {/* Separator between phase pairs */}
                {idx < 2 && (
                  <div className="flex items-center justify-center py-6">
                    <div className="w-32 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Desktop: Horizontal Flow with crossing lines */}
        <div className="hidden lg:block">
          {/* Top Row: Celestial Pivot Phases */}
          <motion.div variants={fadeUp}>
            <div className="flex items-center justify-center gap-2 mb-8">
              <div className="w-3 h-3 rotate-45 border border-emerald-500/50" />
              <p className="text-white/50 text-xs font-mono tracking-wider">【天樞】操作層 — Operational Layer</p>
              <div className="w-3 h-3 rotate-45 border border-emerald-500/50" />
            </div>
            <div className="grid grid-cols-3 gap-6 mb-12">
              {celestialPhases.map((phase, idx) => (
                <motion.div
                  key={phase.id}
                  variants={fadeUp}
                  className={`border ${phase.color} ${phase.bgColor} p-6 relative group hover:scale-[1.02] transition-transform`}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded border ${phase.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <phase.icon className={`w-6 h-6 ${phase.textColor}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-mono ${phase.textColor}`}>{phase.phase}</p>
                      <h4 className="text-white/90 font-medium">{phase.title}</h4>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs mb-3">{phase.subtitle}</p>
                  <div className={`inline-flex px-3 py-1 ${phase.bgColor} border ${phase.color} rounded text-xs font-mono ${phase.textColor}`}>
                    產出：{phase.output}
                  </div>
                  
                  {/* Bottom arrow indicator */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="w-px h-6 bg-gradient-to-b from-white/20 to-gold/40" />
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Middle: Connection Zone */}
          <motion.div variants={fadeUp} className="relative py-12 my-4">
            {/* Connection visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            </div>
            
            {/* Connection labels */}
            <div className="relative grid grid-cols-3 gap-6">
              {connections.map((conn, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.15 }}
                  viewport={{ once: true }}
                  className="flex flex-col items-center"
                >
                  <ArrowDown className="w-5 h-5 text-gold/60 mb-2" />
                  <div className="px-4 py-2 bg-black border border-gold/30 rounded-sm">
                    <p className="text-gold/80 text-xs font-mono text-center whitespace-nowrap">{conn.label}</p>
                  </div>
                  <ArrowDown className="w-5 h-5 text-gold/60 mt-2" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Bottom Row: Black Palace Protocol Phases */}
          <motion.div variants={fadeUp}>
            <div className="grid grid-cols-3 gap-6 mt-12 mb-8">
              {protocolPhases.map((phase, idx) => (
                <motion.div
                  key={phase.id}
                  variants={fadeUp}
                  className={`border ${phase.color} ${phase.bgColor} p-6 relative group hover:scale-[1.02] transition-transform`}
                >
                  {/* Top arrow indicator */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                    <div className="w-px h-6 bg-gradient-to-t from-white/20 to-gold/40" />
                  </div>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`w-14 h-14 rounded border ${phase.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <phase.icon className={`w-6 h-6 ${phase.textColor}`} />
                    </div>
                    <div>
                      <p className={`text-xs font-mono ${phase.textColor}`}>{phase.phase}</p>
                      <h4 className="text-white/90 font-medium">{phase.title}</h4>
                    </div>
                  </div>
                  <p className="text-white/40 text-xs mb-3">{phase.subtitle}</p>
                  <div className={`inline-flex px-3 py-1 ${phase.bgColor} border ${phase.color} rounded text-xs font-mono ${phase.textColor}`}>
                    工具：{phase.input}
                  </div>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2">
              <div className="w-3 h-3 rotate-45 border border-gold/50" />
              <p className="text-white/50 text-xs font-mono tracking-wider">【黑宮】戰略層 — Strategic Layer</p>
              <div className="w-3 h-3 rotate-45 border border-gold/50" />
            </div>
          </motion.div>
        </div>

        {/* Final Convergence */}
        <motion.div 
          variants={fadeUp}
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-col items-center">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-px bg-gradient-to-r from-transparent to-gold/40" />
              <Crown className="w-8 h-8 text-gold/60" />
              <div className="w-24 h-px bg-gradient-to-l from-transparent to-gold/40" />
            </div>
            <div className="border border-gold/40 bg-gradient-to-b from-gold/10 to-transparent px-8 py-6">
              <p className="text-gold/60 text-xs font-mono tracking-wider mb-3">CONVERGENCE POINT</p>
              <p className="text-2xl md:text-3xl font-light text-white/90 mb-2">
                €<span className="text-gold font-medium">253</span> Trillion
              </p>
              <p className="text-white/40 text-xs">Reputation-Dependent Assets Under Protocol Verification</p>
              <p className="text-white/30 text-[10px] mt-2">The S&P for the Real World — We own the Signal, not the Assets</p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default StrategicFlowchart;
