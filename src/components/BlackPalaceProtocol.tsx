import { useMemo } from "react";
import { motion } from "framer-motion";
import { Lock, Eye, Shield, Crown, Coins, Building2, Atom, Scale, Network, AlertTriangle } from "lucide-react";
import GravityCalculator from "./GravityCalculator";
const phases = [
  {
    icon: Eye,
    title: "Phase I: 資訊霸權",
    subtitle: "Information Hegemony",
    description: "壟斷「聲譽」的定義權。沒有認證，商業價值為零。",
    tool: "Buoyancis Trust Protocol"
  },
  {
    icon: Coins,
    title: "Phase II: 貨幣主權",
    subtitle: "Currency Sovereignty",
    description: "讓積分成為衡量信任的唯一標準。當人們用此貨幣交易時，開始吸納資產。",
    tool: "Buoyancis Token (Truth-backed)"
  },
  {
    icon: Building2,
    title: "Phase III: 資產吸納",
    subtitle: "Asset Absorption",
    description: "規定只有在協議上的資產才具備「高信任流動性」。優質資產主動遷移。",
    tool: "Black Palace Asset Protocol"
  }
];

const gaiaQuestions = [
  {
    icon: Network,
    question: "初始質量從哪來？",
    subtext: "Genesis Mass Origin",
    explanation: "前 100 位 Sovereign Nodes 決定了系統的初始重力常數 G。他們的專業質量 M 將定義整個信用場的基準引力。"
  },
  {
    icon: Scale,
    question: "如何防止「質量壟斷」？",
    subtext: "Anti-Monopoly Mechanism",
    explanation: "引入「質量衰減函數」：M(t) = M₀ × e^(-λt)。早期質量會隨時間衰減，除非持續產生有價值的觀察行為。"
  },
  {
    icon: AlertTriangle,
    question: "如何定義 r (距離)？",
    subtext: "Relevance Distance",
    explanation: "r 由「專業認證圖譜」計算。一個頂級廚師評價餐廳的 r ≈ 0.1，評價軟體公司的 r ≈ 100。距離決定引力。"
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

const BlackPalaceProtocol = () => {
  const containerVariants = useMemo(() => ({
    visible: { transition: { staggerChildren: 0.15 } }
  }), []);

  return (
    <section className="min-h-screen bg-black relative overflow-hidden py-24" aria-label="Black Palace Protocol">
      {/* Grid background */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(212,175,55,0.1) 50px, rgba(212,175,55,0.1) 51px),
                            repeating-linear-gradient(90deg, transparent, transparent 50px, rgba(212,175,55,0.1) 50px, rgba(212,175,55,0.1) 51px)`
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-gradient-radial from-gold/5 to-transparent pointer-events-none" />

      <motion.div 
        className="container max-w-4xl mx-auto px-6 relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-16">
          <div className="inline-flex items-center gap-3 px-6 py-2 border border-red-500/30 bg-red-500/5 rounded mb-8">
            <Lock className="w-4 h-4 text-red-400" />
            <span className="text-red-400 text-xs tracking-[0.3em] uppercase font-mono">
              Clearance Level: Ω — Founder Eyes Only
            </span>
            <Shield className="w-4 h-4 text-red-400" />
          </div>
          <h2 className="text-3xl md:text-4xl font-serif mb-4 bg-gradient-to-r from-gold via-[#f4e4bc] to-gold bg-clip-text text-transparent">
            The Black Palace Protocol
          </h2>
          <p className="text-white/40 text-sm font-mono tracking-wider">黑宮協議 — 地球控股權的數學基礎</p>
        </motion.div>

        {/* Price of Earth */}
        <motion.div variants={fadeUp} className="mb-16 border border-gold/20 bg-black/50 backdrop-blur-sm p-8 relative">
          <CornerAccents />
          <h3 className="text-gold/80 text-xs tracking-[0.3em] uppercase mb-6 font-mono">I. 數字基準：信譽依賴型資產 (Reputation-Dependent Assets)</h3>
          <div className="space-y-6">
            <DataRow label="Global Total Wealth (2026)" value="€460" unit="Trillion" />
            <DataRow label="Financial Assets (Regulated)" value="45%" unit="— Not Our Domain" />
            <DataRow label="Reputation-Dependent Assets" value="55%" unit="— €253 Trillion" highlight />
            <div className="border-t border-white/10 pt-4 mt-4">
              <p className="text-white/50 text-xs font-mono text-center mb-2">「我們不擁有這些資產，我們擁有它們的定價權與流動性許可。」</p>
              <p className="text-white/30 text-xs font-mono text-center">S&P/穆迪不擁有債券，但控制 90% 債券市場的評級。SWIFT 不擁有銀行資金，但控制 100% 跨國轉賬。</p>
            </div>
          </div>
        </motion.div>

        {/* Valuation Logic */}
        <motion.div variants={fadeUp} className="mb-16 border border-gold/20 bg-black/50 backdrop-blur-sm p-8 relative">
          <CornerAccents />
          <h3 className="text-gold/80 text-xs tracking-[0.3em] uppercase mb-6 font-mono">II. 估值邏輯：期權定價模型</h3>
          <div className="bg-white/5 rounded p-6 mb-6 font-mono text-center">
            <p className="text-white/40 text-xs mb-4">Expected Value Formula</p>
            <p className="text-xl md:text-2xl text-white/90">€253T × 0.001% = <span className="text-gold">$3B</span> <span className="text-white/40 text-base">(€2.53B)</span></p>
            <p className="text-white/30 text-xs mt-4">(Endgame Value × Success Probability = Present Valuation)</p>
          </div>
          <div className="text-center space-y-2">
            <p className="text-white/50 text-sm">這不是一家價值 30億美元的公司。</p>
            <p className="text-white/70">這是一張通往 <span className="text-gold">253兆資產帝國</span> 的入場券，</p>
            <p className="text-white/50 text-sm">現在僅以 0.001% 的價格折讓出售。</p>
          </div>
        </motion.div>

        {/* Gravity Model - The Physics of Reputation */}
        <motion.div variants={fadeUp} className="mb-16 border border-gold/20 bg-black/50 backdrop-blur-sm p-8 relative">
          <CornerAccents />
          <div className="flex items-center gap-3 mb-6">
            <Atom className="w-5 h-5 text-gold/70" />
            <h3 className="text-gold/80 text-xs tracking-[0.3em] uppercase font-mono">II-B. 核心公式：重力權重模型</h3>
          </div>
          
          {/* Traditional vs Buoyancis */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-red-500/5 border border-red-500/20 rounded p-5">
              <p className="text-red-400/80 text-xs font-mono mb-3">傳統評價系統 (Broken)</p>
              <div className="bg-black/50 rounded p-4 text-center font-mono">
                <p className="text-white/60 text-sm mb-2">Score = Σ Reviews / n</p>
                <p className="text-red-400/60 text-xs">n 可被無限放大 → AI 噪聲淹沒</p>
              </div>
            </div>
            <div className="bg-gold/5 border border-gold/20 rounded p-5">
              <p className="text-gold/80 text-xs font-mono mb-3">Buoyancis 引力模型</p>
              <div className="bg-black/50 rounded p-4 text-center font-mono">
                <p className="text-gold text-lg mb-2">Influence = G × M<sub className="text-xs">obs</sub> × M<sub className="text-xs">target</sub> / r²</p>
                <p className="text-gold/60 text-xs">質量決定引力 → 真理自然浮現</p>
              </div>
            </div>
          </div>

          {/* Variable Definitions */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-4 py-3 border-b border-white/5">
              <span className="text-gold font-mono w-24 shrink-0">M<sub>observer</sub></span>
              <span className="text-white/60">觀察者的歷史誠信與專業權重（由協議驗證並持續追蹤）</span>
            </div>
            <div className="flex items-start gap-4 py-3 border-b border-white/5">
              <span className="text-gold font-mono w-24 shrink-0">M<sub>target</sub></span>
              <span className="text-white/60">被觀察對象的現有質量（累積的認證信用值）</span>
            </div>
            <div className="flex items-start gap-4 py-3 border-b border-white/5">
              <span className="text-gold font-mono w-24 shrink-0">r</span>
              <span className="text-white/60">觀察者與該領域的相關性距離（專業圖譜計算）</span>
            </div>
            <div className="flex items-start gap-4 py-3">
              <span className="text-gold font-mono w-24 shrink-0">G</span>
              <span className="text-white/60">協議重力常數（由 Genesis Nodes 初始質量定義）</span>
            </div>
          </div>
        </motion.div>

        {/* Gaia Test - Anti-Entropy Mechanism */}
        <motion.div variants={fadeUp} className="mb-16 border border-gold/20 bg-black/50 backdrop-blur-sm p-8 relative">
          <CornerAccents />
          <h3 className="text-gold/80 text-xs tracking-[0.3em] uppercase mb-6 font-mono">II-C. 蓋亞測試：動態平衡系統</h3>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white/5 rounded p-5">
              <p className="text-white/80 text-sm font-medium mb-2">反熵機制 (Anti-Entropy)</p>
              <p className="text-white/50 text-xs mb-4">異常引力檢測：若低質量節點突然產生巨大局部引力（刷單），系統識別為「黑洞」並隔離。</p>
              <div className="bg-black/50 rounded p-3 font-mono text-center">
                <span className="text-red-400 text-xs">ΔM / Δt {'>'} threshold → 🚫 Quarantine</span>
              </div>
            </div>
            <div className="bg-white/5 rounded p-5">
              <p className="text-white/80 text-sm font-medium mb-2">流動性驗證 (Truth Collapse)</p>
              <p className="text-white/50 text-xs mb-4">當高質量觀察者的加權共識達到臨界值時，真理才會「塌縮」成確定性信號。</p>
              <div className="bg-black/50 rounded p-3 font-mono text-center">
                <span className="text-gold text-xs">Σ(M × Observation) ≥ Consensus Threshold → ✓ Truth Signal</span>
              </div>
            </div>
          </div>

          <div className="text-center py-4 border-t border-white/10">
            <p className="text-white/30 text-xs font-mono">「這不是在做 App，這是在發現數位世界的萬有引力。」</p>
          </div>
        </motion.div>

        {/* Interactive Calculator */}
        <motion.div variants={fadeUp} className="mb-16">
          <h3 className="text-gold/80 text-xs tracking-[0.3em] uppercase mb-8 font-mono text-center">II-E. 模擬器：計算你的觀察引力</h3>
          <GravityCalculator />
        </motion.div>

        {/* The Three Questions */}
        <motion.div variants={fadeUp} className="mb-16 border border-red-500/20 bg-red-500/5 backdrop-blur-sm p-8 relative">
          <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-red-500/40" />
          <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-red-500/40" />
          <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-red-500/40" />
          <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-red-500/40" />
          
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <h3 className="text-red-400/80 text-xs tracking-[0.3em] uppercase font-mono">II-D. 必答問題：Roelof Botha 三問</h3>
          </div>
          
          <p className="text-white/50 text-xs mb-6 font-mono">Sequoia Capital — Due Diligence Protocol</p>
          
          <div className="space-y-4">
            {gaiaQuestions.map((q, i) => (
              <div key={i} className="border border-white/10 bg-black/30 p-5 hover:border-gold/30 transition-colors group">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded border border-gold/30 flex items-center justify-center shrink-0 group-hover:bg-gold/5 transition-colors">
                    <q.icon className="w-4 h-4 text-gold/70" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                      <h4 className="text-white/90 font-medium text-sm">{q.question}</h4>
                      <span className="text-white/30 text-xs font-mono">({q.subtext})</span>
                    </div>
                    <p className="text-white/50 text-xs">{q.explanation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Phases */}
        <motion.div variants={fadeUp} className="mb-16">
          <h3 className="text-gold/80 text-xs tracking-[0.3em] uppercase mb-8 font-mono text-center">III. 執行路徑：吞噬機制</h3>
          <div className="space-y-4">
            {phases.map((phase, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="border border-white/10 bg-black/30 p-6 hover:border-gold/30 transition-colors group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded border border-gold/30 flex items-center justify-center shrink-0 group-hover:bg-gold/5 transition-colors">
                    <phase.icon className="w-5 h-5 text-gold/70" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
                      <h4 className="text-white/90 font-medium">{phase.title}</h4>
                      <span className="text-white/30 text-xs font-mono">({phase.subtitle})</span>
                    </div>
                    <p className="text-white/50 text-sm mb-3">{phase.description}</p>
                    <span className="inline-flex px-3 py-1 bg-gold/5 border border-gold/20 rounded-sm text-gold/60 text-xs font-mono">{phase.tool}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* The Pitch */}
        <motion.div variants={fadeUp} className="border border-gold/30 bg-gradient-to-b from-gold/5 to-transparent p-8 md:p-12 relative">
          <Crown className="absolute top-6 right-6 w-6 h-6 text-gold/30" />
          <h3 className="text-gold/80 text-xs tracking-[0.3em] uppercase mb-8 font-mono">IV. 致創始人</h3>
          <blockquote className="space-y-4 text-center text-lg md:text-xl font-light italic leading-relaxed">
            <p className="text-white/70">"We are engineering the Verification Standard for the €460 Trillion Illiquid Asset Market.</p>
            <p className="text-white/70">We target the 55% of global GDP that relies on Reputation, not Regulation.</p>
            <p className="text-white/70">Just as TCP/IP became the standard for 100% of data, Buoyancis aims to become the standard for Reputation-based transactions.</p>
            <p className="text-gold font-medium not-italic">At a $3 Billion valuation, we are pricing the probability of our success at 0.001%.</p>
            <p className="text-white/90">If you believe my chance of success is anything higher than zero...</p>
            <p className="text-gold text-xl md:text-2xl font-medium not-italic">this is the cheapest asset you will ever buy."</p>
          </blockquote>
          <div className="flex items-center justify-center gap-4 mt-12">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-gold/40" />
            <div className="w-3 h-3 rotate-45 border border-gold/50" />
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-gold/40" />
          </div>
          <p className="text-center text-white/20 text-xs font-mono mt-8 tracking-wider">黑宮邏輯 — The Logic of the Black Palace</p>
        </motion.div>

        {/* Footer */}
        <motion.div variants={fadeUp} className="text-center mt-16">
          <p className="text-red-400/40 text-xs font-mono tracking-wider">◇ DOCUMENT CLASSIFICATION: OMEGA-7 ◇</p>
          <p className="text-white/20 text-xs font-mono mt-2">Unauthorized distribution will result in immediate protocol termination.</p>
        </motion.div>
      </motion.div>
    </section>
  );
};

const CornerAccents = () => (
  <>
    <div className="absolute top-0 left-0 w-8 h-8 border-l border-t border-gold/40" />
    <div className="absolute top-0 right-0 w-8 h-8 border-r border-t border-gold/40" />
    <div className="absolute bottom-0 left-0 w-8 h-8 border-l border-b border-gold/40" />
    <div className="absolute bottom-0 right-0 w-8 h-8 border-r border-b border-gold/40" />
  </>
);

const DataRow = ({ label, value, unit, highlight }: { label: string; value: string; unit: string; highlight?: boolean }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 border-b border-white/5">
    <span className="text-white/60 font-mono text-sm">{label}</span>
    <span className={`text-2xl md:text-3xl font-light ${highlight ? 'bg-gradient-to-r from-gold via-[#f4e4bc] to-gold bg-clip-text text-transparent' : 'text-white/90'}`}>
      {value} <span className={`text-lg ${highlight ? 'opacity-70' : 'text-gold/60'}`}>{unit}</span>
    </span>
  </div>
);

export default BlackPalaceProtocol;
