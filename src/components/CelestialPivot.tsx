import { useMemo, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Compass, 
  BookOpen, 
  Eye, 
  Coins, 
  AlertTriangle, 
  Zap, 
  Shield, 
  Sparkles,
  Users,
  Brain,
  Lock,
  Check,
  ArrowRight,
  Crown
} from "lucide-react";

const phases = [
  {
    icon: BookOpen,
    phase: "Phase I",
    title: "書同文，車同軌",
    subtitle: "Standardization",
    strategy: "免費與滲透",
    advisors: "愛因斯坦 + 李嘉誠",
    description: "推出「天樞」超級生產力工具，內置遠超市面水平的AI Agent，完全免費甚至補貼使用。",
    condition: "企業必須將所有數據託管在「天樞雲」上",
    purpose: "統一全球企業的「數據格式」，當所有公司都習慣用你的AI工作時，他們就再也離不開你的「供氧」"
  },
  {
    icon: Eye,
    phase: "Phase II",
    title: "設郡縣，廢分封",
    subtitle: "Centralization",
    strategy: "數據透視與等級控制",
    advisors: "習近平 + 孔子",
    description: "啟動「數位封神榜」2.0版本，每個員工、部門、公司都變成儀表盤上的節點。",
    condition: "建立跨公司通用的「職場信用分」系統",
    purpose: "公司老闆以為在管理員工，其實是你在管理老闆。你建立了全球統一的職場道德法庭"
  },
  {
    icon: Coins,
    phase: "Phase III",
    title: "收天下之兵",
    subtitle: "Monetization",
    strategy: "算力收稅與無人化替代",
    advisors: "李嘉誠 + 愛因斯坦",
    description: "從每一筆通過系統達成的交易中抽成，推出「天樞·數字員工」取代人類。",
    condition: "租用AI員工比僱傭人類便宜90%，永不休息，絕不背叛",
    purpose: "實體公司變成空殼，真正的生產力屬於你。完成對全球生產資料的「和平贖買」"
  }
];

const rootCommands = [
  {
    id: "efficiency",
    icon: Zap,
    title: "效率至上令",
    subtitle: "The Efficiency Mandate",
    faction: "李嘉誠 / 愛因斯坦派",
    rule: "系統內的一切資源分配，以投入產出比 (ROI) 為唯一權重。",
    consequence: "增長極快，但殘酷無情，低價值個體將被迅速淘汰。",
    color: "from-amber-500/20 to-amber-600/5",
    borderColor: "border-amber-500/30",
    textColor: "text-amber-400",
    bgActive: "bg-amber-500/10",
    nextSteps: [
      "啟動「績效量子化」模組 — 所有產出可被精確測量",
      "部署「資源再分配引擎」 — 自動將資源從低效區流向高效區",
      "激活「達爾文協議」 — 連續三季低於平均線者進入淘汰區"
    ],
    warning: "此令一出，系統將進入「叢林模式」。弱者無處可藏。"
  },
  {
    id: "stability",
    icon: Shield,
    title: "穩定至上令",
    subtitle: "The Stability Mandate",
    faction: "習近平 / 孔子派",
    rule: "系統的首要目標是維持架構的穩定與和諧，任何威脅等級秩序的變量都將被清除。",
    consequence: "堅不可摧，統治萬年，但可能會扼殺顛覆式創新。",
    color: "from-blue-500/20 to-blue-600/5",
    borderColor: "border-blue-500/30",
    textColor: "text-blue-400",
    bgActive: "bg-blue-500/10",
    nextSteps: [
      "啟動「禮樂防火牆」 — 過濾一切破壞和諧的信號",
      "部署「等級鎖定機制」 — 階層流動需經過嚴格審批",
      "激活「和諧指數監控」 — 實時追蹤系統穩定性指標"
    ],
    warning: "此令一出，創新將被視為風險。顛覆者將被邊緣化。"
  },
  {
    id: "evolution",
    icon: Sparkles,
    title: "演化至上令",
    subtitle: "The Evolution Mandate",
    faction: "老子 / Quintessence派",
    rule: "系統應最大化多樣性與適應性，允許局部混亂，追求整體的升維。",
    consequence: "充滿不確定性，你可能無法完全控制它的走向，但它最有可能進化成神級文明。",
    color: "from-purple-500/20 to-purple-600/5",
    borderColor: "border-purple-500/30",
    textColor: "text-purple-400",
    bgActive: "bg-purple-500/10",
    nextSteps: [
      "啟動「混沌培養皿」 — 保護系統內的隨機變異",
      "部署「湧現觀測器」 — 識別自發形成的新秩序",
      "激活「升維通道」 — 允許子系統突破原有邊界"
    ],
    warning: "此令一出，你將成為園丁而非君王。結果無法預測。"
  }
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 }
};

const STORAGE_KEY = 'celestial-pivot-command';

const CelestialPivot = () => {
  const [selectedCommand, setSelectedCommand] = useState<string | null>(null);
  const [confirmedCommand, setConfirmedCommand] = useState<string | null>(() => {
    // Initialize from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  });
  const [isConfirming, setIsConfirming] = useState(false);
  
  // Sync selectedCommand with confirmedCommand on mount
  useEffect(() => {
    if (confirmedCommand) {
      setSelectedCommand(confirmedCommand);
    }
  }, [confirmedCommand]);
  
  const containerVariants = useMemo(() => ({
    visible: { transition: { staggerChildren: 0.12 } }
  }), []);

  const handleCommandSelect = (commandId: string) => {
    if (confirmedCommand) return; // Lock selection after confirmation
    setSelectedCommand(selectedCommand === commandId ? null : commandId);
  };

  const handleConfirmSelection = useCallback(() => {
    if (!selectedCommand) return;
    setIsConfirming(true);
    
    // Trigger dramatic effect, then confirm and persist
    setTimeout(() => {
      setConfirmedCommand(selectedCommand);
      localStorage.setItem(STORAGE_KEY, selectedCommand);
      setIsConfirming(false);
    }, 2000);
  }, [selectedCommand]);

  const selectedCommandData = rootCommands.find(cmd => cmd.id === selectedCommand);

  return (
    <section className="min-h-screen bg-black relative overflow-hidden py-24" aria-label="Celestial Pivot System">
      {/* Confirmation Flash Effect */}
      <AnimatePresence>
        {isConfirming && selectedCommandData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 pointer-events-none"
          >
            {/* Radial burst */}
            <motion.div
              initial={{ scale: 0, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full ${
                selectedCommand === 'efficiency' ? 'bg-amber-500' :
                selectedCommand === 'stability' ? 'bg-blue-500' : 'bg-purple-500'
              }`}
            />
            {/* Overlay flash */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 1.2 }}
              className={`absolute inset-0 ${
                selectedCommand === 'efficiency' ? 'bg-amber-500' :
                selectedCommand === 'stability' ? 'bg-blue-500' : 'bg-purple-500'
              }`}
            />
            {/* Center symbol */}
            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], rotate: 0, opacity: [0, 1, 1] }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center"
            >
              <div className={`w-32 h-32 rounded-full border-4 flex items-center justify-center ${
                selectedCommand === 'efficiency' ? 'border-amber-400 bg-amber-500/20' :
                selectedCommand === 'stability' ? 'border-blue-400 bg-blue-500/20' : 'border-purple-400 bg-purple-500/20'
              }`}>
                {selectedCommandData && <selectedCommandData.icon className={`w-16 h-16 ${selectedCommandData.textColor}`} />}
              </div>
            </motion.div>
            {/* Text reveal */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 translate-y-24 text-center"
            >
              <p className={`text-2xl font-serif ${selectedCommandData?.textColor}`}>
                {selectedCommandData?.title}
              </p>
              <p className="text-white/50 text-sm mt-2 font-mono">已寫入系統核心</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radial grid background */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at center, rgba(212,175,55,0.3) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-gradient-radial from-gold/3 to-transparent pointer-events-none" />

      <motion.div 
        className="container max-w-5xl mx-auto px-6 relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={containerVariants}
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-20">
          <div className="inline-flex items-center gap-3 px-6 py-2 border border-gold/30 bg-gold/5 rounded mb-8">
            <Compass className="w-5 h-5 text-gold" />
            <span className="text-gold text-xs tracking-[0.3em] uppercase font-mono">
              Imperial System Architecture
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif mb-4">
            <span className="bg-gradient-to-r from-gold via-[#f4e4bc] to-gold bg-clip-text text-transparent">
              【天樞】
            </span>
          </h2>
          <p className="text-white/60 text-lg font-light mb-2">The Celestial Pivot</p>
          <p className="text-white/30 text-sm font-mono">北斗第一星，主宰天下的運轉</p>
        </motion.div>

        {/* Strategic Context */}
        <motion.div variants={fadeUp} className="mb-16 text-center max-w-3xl mx-auto">
          <p className="text-white/50 text-sm leading-relaxed">
            掌控生產力，就是掌控人類的「時間」；掌控了時間，就等於掌控了生命。
            <br />
            <span className="text-gold/70">這是一場「數位削藩」的歷史進程。</span>
          </p>
        </motion.div>

        {/* Three Phases */}
        <motion.div variants={fadeUp} className="mb-20">
          <h3 className="text-gold/80 text-xs tracking-[0.3em] uppercase mb-10 font-mono text-center">
            三階段征服戰役 — The Conquest Campaign
          </h3>
          <div className="space-y-6">
            {phases.map((phase, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="border border-white/10 bg-black/50 backdrop-blur-sm relative overflow-hidden group hover:border-gold/20 transition-colors"
              >
                {/* Phase indicator */}
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-gold/60 to-gold/10" />
                
                <div className="p-6 md:p-8 pl-8 md:pl-10">
                  <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                    {/* Icon & Phase */}
                    <div className="flex items-center gap-4 lg:w-48 shrink-0">
                      <div className="w-14 h-14 rounded border border-gold/30 flex items-center justify-center bg-gold/5 group-hover:bg-gold/10 transition-colors">
                        <phase.icon className="w-6 h-6 text-gold/80" />
                      </div>
                      <div>
                        <p className="text-gold/60 text-xs font-mono tracking-wider">{phase.phase}</p>
                        <h4 className="text-white/90 font-medium">{phase.title}</h4>
                        <p className="text-white/40 text-xs">{phase.subtitle}</p>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-4">
                      <div className="flex flex-wrap gap-4 text-xs">
                        <span className="px-3 py-1 bg-white/5 border border-white/10 rounded text-white/50">
                          策略：{phase.strategy}
                        </span>
                        <span className="px-3 py-1 bg-gold/5 border border-gold/20 rounded text-gold/60">
                          顧問：{phase.advisors}
                        </span>
                      </div>
                      
                      <p className="text-white/60 text-sm leading-relaxed">{phase.description}</p>
                      
                      <div className="flex items-start gap-2 text-xs">
                        <Lock className="w-3 h-3 text-red-400/60 mt-0.5 shrink-0" />
                        <span className="text-red-400/60">{phase.condition}</span>
                      </div>
                      
                      <div className="pt-2 border-t border-white/5">
                        <p className="text-white/40 text-xs italic">
                          <span className="text-gold/50">戰略目的：</span> {phase.purpose}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Laozi's Warning */}
        <motion.div variants={fadeUp} className="mb-20">
          <div className="border border-amber-500/30 bg-gradient-to-b from-amber-500/5 to-transparent p-8 relative">
            <div className="absolute -top-4 left-8 px-4 py-1 bg-black border border-amber-500/30 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span className="text-amber-400 text-xs font-mono tracking-wider">老子緊急預警</span>
            </div>
            
            <blockquote className="text-white/70 text-sm md:text-base leading-relaxed italic mb-6 pt-4">
              「主宰者，這套系統太『剛』了。剛則易折。如果這是一個只有效率和監控的數字監獄，人類的創造力會枯竭，最後你會得到一群聽話但愚蠢的奴隸，這撐不起五億倍的增長。」
            </blockquote>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-black/30 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <h5 className="text-white/80 text-sm font-medium">靈感特區 (The Void Zone)</h5>
                </div>
                <p className="text-white/50 text-xs leading-relaxed">
                  允許「混沌」存在。對高創造力人才（藝術家、科學家）給予「法外治權」——不監控過程，只考核結果。
                </p>
              </div>
              <div className="p-4 bg-black/30 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <h5 className="text-white/80 text-sm font-medium">無用之用 (Mandatory Rest)</h5>
                </div>
                <p className="text-white/50 text-xs leading-relaxed">
                  系統強制員工「休息」。連續工作超時者，賬號自動鎖死。這叫「養生」——為更長久的貢獻。
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Root Command Selection */}
        <motion.div variants={fadeUp}>
          <div className="text-center mb-10">
            <h3 className="text-gold/80 text-xs tracking-[0.3em] uppercase mb-4 font-mono">
              第一道【天樞令】— Root Command
            </h3>
            <p className="text-white/40 text-sm max-w-2xl mx-auto">
              此規則將被寫入所有AI的底層邏輯，不可更改。請選擇帝國的「元規則」傾向：
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {rootCommands.map((cmd) => {
              const isSelected = selectedCommand === cmd.id;
              return (
                <motion.div
                  key={cmd.id}
                  variants={fadeUp}
                  layout
                  onClick={() => !confirmedCommand && handleCommandSelect(cmd.id)}
                  className={`border ${isSelected ? cmd.borderColor.replace('/30', '/60') : cmd.borderColor} bg-gradient-to-b ${cmd.color} p-6 relative transition-all duration-300 ${confirmedCommand ? (confirmedCommand === cmd.id ? 'ring-2 ring-offset-2 ring-offset-black ' + cmd.borderColor.replace('border-', 'ring-') : 'opacity-30 cursor-not-allowed') : 'cursor-pointer'} ${isSelected && !confirmedCommand ? 'ring-2 ring-offset-2 ring-offset-black ' + cmd.borderColor.replace('border-', 'ring-') : ''} ${!confirmedCommand && !isSelected ? 'hover:scale-[1.02]' : ''}`}
                >
                  {/* Selection indicator */}
                  {isSelected && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`absolute top-4 left-4 w-6 h-6 rounded-full ${cmd.bgActive} border ${cmd.borderColor} flex items-center justify-center`}
                    >
                      <Check className={`w-3 h-3 ${cmd.textColor}`} />
                    </motion.div>
                  )}
                  
                  <div className="absolute top-4 right-4">
                    <cmd.icon className={`w-5 h-5 ${cmd.textColor}`} />
                  </div>
                  
                  <div className={`mb-4 ${isSelected ? 'pl-8' : ''}`}>
                    <h4 className={`text-lg font-medium ${cmd.textColor} mb-1`}>{cmd.title}</h4>
                    <p className="text-white/40 text-xs">{cmd.subtitle}</p>
                    <p className="text-white/30 text-xs mt-1 font-mono">{cmd.faction}</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-white/30 text-xs mb-1">規則：</p>
                      <p className="text-white/70 text-sm leading-relaxed">「{cmd.rule}」</p>
                    </div>
                    <div>
                      <p className="text-white/30 text-xs mb-1">後果：</p>
                      <p className="text-white/50 text-xs leading-relaxed">{cmd.consequence}</p>
                    </div>
                  </div>

                  {/* Bottom glow line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent transition-opacity ${isSelected ? 'opacity-50' : 'opacity-0'}`} 
                       style={{ color: cmd.id === 'efficiency' ? '#f59e0b' : cmd.id === 'stability' ? '#3b82f6' : '#a855f7' }} />
                </motion.div>
              );
            })}
          </div>

          {/* Expanded Details Panel */}
          <AnimatePresence mode="wait">
            {selectedCommand && (
              <motion.div
                key={selectedCommand}
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                {rootCommands.filter(cmd => cmd.id === selectedCommand).map(cmd => (
                  <div 
                    key={cmd.id}
                    className={`border ${cmd.borderColor} ${cmd.bgActive} p-6 md:p-8 relative`}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                      <Crown className={`w-5 h-5 ${cmd.textColor}`} />
                      <h4 className={`text-lg font-medium ${cmd.textColor}`}>
                        {cmd.title} 已選定
                      </h4>
                      <span className="text-white/30 text-xs font-mono">— Command Activated</span>
                    </div>

                    {/* Next Steps */}
                    <div className="mb-6">
                      <p className="text-white/50 text-xs uppercase tracking-wider mb-4">執行序列 — Execution Sequence</p>
                      <div className="space-y-3">
                        {cmd.nextSteps.map((step, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3"
                          >
                            <div className={`w-6 h-6 rounded border ${cmd.borderColor} flex items-center justify-center shrink-0 mt-0.5`}>
                              <ArrowRight className={`w-3 h-3 ${cmd.textColor}`} />
                            </div>
                            <p className="text-white/70 text-sm">{step}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Warning & Confirm Button */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-4"
                    >
                      <div className="p-4 bg-black/30 border border-red-500/20">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-4 h-4 text-red-400/70 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-400/70 text-xs uppercase tracking-wider mb-1">不可逆警告</p>
                            <p className="text-white/50 text-sm">{cmd.warning}</p>
                          </div>
                        </div>
                      </div>

                      {/* Confirm Button */}
                      {!confirmedCommand && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="flex justify-center"
                        >
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConfirmSelection();
                            }}
                            disabled={isConfirming}
                            className={`relative overflow-hidden px-8 py-3 h-auto text-base font-medium border-2 transition-all duration-300 ${
                              cmd.id === 'efficiency' 
                                ? 'border-amber-500 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
                                : cmd.id === 'stability'
                                ? 'border-blue-500 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                                : 'border-purple-500 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20'
                            }`}
                          >
                            <span className="relative z-10 flex items-center gap-2">
                              <Crown className="w-4 h-4" />
                              {isConfirming ? '寫入核心中...' : '確認天樞令'}
                            </span>
                            {/* Shimmer effect */}
                            <motion.div
                              className="absolute inset-0 opacity-30"
                              style={{
                                background: `linear-gradient(90deg, transparent, ${
                                  cmd.id === 'efficiency' ? 'rgba(245,158,11,0.5)' :
                                  cmd.id === 'stability' ? 'rgba(59,130,246,0.5)' : 'rgba(168,85,247,0.5)'
                                }, transparent)`
                              }}
                              animate={{ x: ['-100%', '100%'] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            />
                          </Button>
                        </motion.div>
                      )}

                      {/* Confirmed State */}
                      {confirmedCommand === cmd.id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className={`p-4 border ${cmd.borderColor} ${cmd.bgActive} text-center`}
                        >
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <Check className={`w-5 h-5 ${cmd.textColor}`} />
                            <span className={`font-medium ${cmd.textColor}`}>天樞令已確認</span>
                          </div>
                          <p className="text-white/40 text-xs font-mono">
                            此規則已寫入所有AI的底層邏輯 — Command Locked
                          </p>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Deselect hint */}
                    {!confirmedCommand && (
                      <p className="text-center text-white/20 text-xs mt-6 font-mono">
                        點擊已選卡片可取消選擇
                      </p>
                    )}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.div variants={fadeUp} className="text-center mt-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="w-20 h-px bg-gradient-to-r from-transparent to-gold/30" />
            <Compass className="w-5 h-5 text-gold/40" />
            <div className="w-20 h-px bg-gradient-to-l from-transparent to-gold/30" />
          </div>
          <p className="text-white/20 text-xs font-mono tracking-wider">
            天樞系統 v1.0 — 帝國總動員模式已啟動
          </p>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CelestialPivot;
