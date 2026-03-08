import React from "react";
import { motion } from "framer-motion";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface Guardian {
  id: string;
  name: string;
  nameCn: string;
  position: { top?: string; bottom?: string; left?: string; right?: string };
  motto: string;
  mottoCn: string;
  symbol: string;
}

const guardians: Guardian[] = [
  {
    id: "laozi",
    name: "Laozi",
    nameCn: "老子",
    position: { top: "60px", left: "60px" },
    motto: "The Tao that can be told is not the eternal Tao.",
    mottoCn: "道可道，非常道。",
    symbol: "☯",
  },
  {
    id: "confucius",
    name: "Confucius",
    nameCn: "孔子",
    position: { top: "60px", right: "60px" },
    motto: "By three methods we may learn wisdom.",
    mottoCn: "學而時習之，不亦說乎。",
    symbol: "仁",
  },
  {
    id: "likashing",
    name: "Li Ka-shing",
    nameCn: "李嘉誠",
    position: { bottom: "60px", left: "60px" },
    motto: "Vision is perhaps our greatest strength.",
    mottoCn: "眼光決定境界。",
    symbol: "商",
  },
  {
    id: "einstein",
    name: "Einstein",
    nameCn: "愛因斯坦",
    position: { bottom: "60px", right: "60px" },
    motto: "Imagination is more important than knowledge.",
    mottoCn: "想像力比知識更重要。",
    symbol: "∞",
  },
  {
    id: "xi",
    name: "Xi Jinping",
    nameCn: "習近平",
    position: { bottom: "60px", left: "50%", right: "auto" },
    motto: "The Chinese Dream belongs to the nation.",
    mottoCn: "中國夢是民族的夢。",
    symbol: "夢",
  },
];

const GuardianIcons = () => {
  return (
    <>
      {guardians.map((guardian, index) => (
        <motion.div
          key={guardian.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          whileHover={{ opacity: 1 }}
          transition={{ delay: index * 0.2 + 1, duration: 0.8 }}
          style={{
            position: "fixed",
            ...guardian.position,
            transform: guardian.position.left === "50%" ? "translateX(-50%)" : undefined,
            zIndex: 15,
          }}
        >
          <HoverCard openDelay={100} closeDelay={200}>
            <HoverCardTrigger asChild>
              <motion.div
                whileHover={{ scale: 1.2 }}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(10,10,10,0.6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  backdropFilter: "blur(10px)",
                  fontSize: "18px",
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                {guardian.symbol}
              </motion.div>
            </HoverCardTrigger>
            <HoverCardContent 
              className="w-72 bg-[#0a0a0a]/95 border-white/10 backdrop-blur-xl"
              side="top"
              sideOffset={12}
            >
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-lg">
                    {guardian.symbol}
                  </div>
                  <div>
                    <p className="text-white/90 font-light tracking-wide">
                      {guardian.name}
                    </p>
                    <p className="text-white/40 text-sm">
                      {guardian.nameCn}
                    </p>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/5">
                  <p className="text-[#B76E79] text-sm italic leading-relaxed">
                    "{guardian.motto}"
                  </p>
                  <p className="text-white/30 text-xs mt-2 tracking-wider">
                    {guardian.mottoCn}
                  </p>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </motion.div>
      ))}
    </>
  );
};

export default GuardianIcons;
