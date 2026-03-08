import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface Guardian {
  id: string;
  name: string;
  title: string;
  color: string;
  philosophy: string;
  alignment: string;
}

const guardians: Guardian[] = [
  {
    id: "laozi",
    name: "老子",
    title: "Laozi",
    color: "#4A90D9",
    philosophy: "無為 (Wu Wei) — Action through non-action",
    alignment: "Donnie's mentorship flows like water: it doesn't force, it guides. The best advice comes without pressure.",
  },
  {
    id: "confucius",
    name: "孔子",
    title: "Confucius",
    color: "#F5F5DC",
    philosophy: "禮 (Li) — The power of ritual and relationship",
    alignment: "Every coffee with Donnie is a ritual. The relationship is the protocol—trust compounds over shared time.",
  },
  {
    id: "li-ka-shing",
    name: "李嘉誠",
    title: "Li Ka-shing",
    color: "#FFB347",
    philosophy: "守業 (Shou Ye) — Guard what you build",
    alignment: "Donnie protects vision from dilution. A mentor's job is to shield the founder from bad advice disguised as good.",
  },
  {
    id: "einstein",
    name: "爱因斯坦",
    title: "Einstein",
    color: "#87CEEB",
    philosophy: "Gedankenexperiment — The thought experiment",
    alignment: "Before every pivot, Donnie runs the 'what if' simulation. Mentorship is hypothesis testing for your life.",
  },
  {
    id: "xi",
    name: "习近平",
    title: "Xi Jinping",
    color: "#DC143C",
    philosophy: "大秩序 (Da Zhixu) — Grand Order",
    alignment: "Chaos is a ladder—but only if you have a framework. Donnie provides the structure for ambition to scale.",
  },
];

interface GuardianConsultantsProps {
  isOpen: boolean;
  onClose: () => void;
  milestoneTitle: string;
}

const GuardianConsultants = ({ isOpen, onClose, milestoneTitle }: GuardianConsultantsProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed right-0 top-0 h-full w-full max-w-lg bg-[#0A0A0A] border-l border-[#D4AF37]/20 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-[#D4AF37]/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[#D4AF37]/50 text-xs tracking-widest uppercase block mb-1">
                    Guardian Consultants
                  </span>
                  <h3 className="font-serif text-xl text-white">
                    {milestoneTitle}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]/60 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Guardians */}
            <div className="p-6 space-y-4">
              {guardians.map((guardian, index) => (
                <motion.div
                  key={guardian.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-all duration-300"
                >
                  {/* Guardian header */}
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center font-serif text-lg"
                      style={{
                        backgroundColor: `${guardian.color}20`,
                        color: guardian.color,
                        boxShadow: `0 0 20px ${guardian.color}30`,
                      }}
                    >
                      {guardian.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-white font-medium">{guardian.title}</h4>
                      <span className="text-white/40 text-sm">{guardian.name}</span>
                    </div>
                  </div>

                  {/* Philosophy */}
                  <div className="mb-3">
                    <span className="text-[#D4AF37]/60 text-xs tracking-wider uppercase">
                      Philosophy
                    </span>
                    <p className="text-white/80 text-sm mt-1 italic">
                      {guardian.philosophy}
                    </p>
                  </div>

                  {/* Alignment */}
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-[#D4AF37]/60 text-xs tracking-wider uppercase">
                      Alignment with Donnie
                    </span>
                    <p className="text-white/60 text-sm mt-1 leading-relaxed">
                      {guardian.alignment}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[#D4AF37]/10">
              <p className="text-white/30 text-xs text-center font-mono">
                "Five perspectives. One truth. The mentor synthesizes."
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default GuardianConsultants;
