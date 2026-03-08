import { motion, useInView } from "framer-motion";
import { useRef, useState, useCallback } from "react";
import { Users } from "lucide-react";
import WisdomPulse from "./WisdomPulse";
import GuardianConsultants from "./GuardianConsultants";

interface Milestone {
  id: string;
  year: string;
  title: string;
  subtitle: string;
  quote: string;
  category: "STRATEGY" | "PHILOSOPHY" | "EXECUTION" | "VISION";
}

const milestones: Milestone[] = [
  {
    id: "1",
    year: "2019",
    title: "The First Bet",
    subtitle: "When no one else saw it",
    quote: "I don't invest in ideas. I invest in the person who won't let the idea die.",
    category: "PHILOSOPHY",
  },
  {
    id: "2",
    year: "2020",
    title: "The Pivot Year",
    subtitle: "Chaos as curriculum",
    quote: "The pandemic didn't stop you—it gave you an alibi to build in silence.",
    category: "STRATEGY",
  },
  {
    id: "3",
    year: "2021",
    title: "The Network Effect",
    subtitle: "Doors that opened doors",
    quote: "Every introduction I make is a bet on your ability to not waste their time.",
    category: "EXECUTION",
  },
  {
    id: "4",
    year: "2023",
    title: "The Patience Protocol",
    subtitle: "When to accelerate, when to wait",
    quote: "The market isn't ready. But when it is, you will be the only one who's been preparing.",
    category: "STRATEGY",
  },
  {
    id: "5",
    year: "2024",
    title: "The Genesis Moment",
    subtitle: "Node #011 activated",
    quote: "You don't need my permission anymore. You need to become the mentor you were waiting for.",
    category: "VISION",
  },
];

const categoryColors: Record<Milestone["category"], string> = {
  STRATEGY: "#D4AF37",
  PHILOSOPHY: "#87CEEB",
  EXECUTION: "#90EE90",
  VISION: "#DDA0DD",
};

const MentorVaultDialogue = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  
  const [hoveredMilestone, setHoveredMilestone] = useState<string | null>(null);
  const [pulseActive, setPulseActive] = useState(false);
  const [pulsePosition, setPulsePosition] = useState({ x: 0, y: 0 });
  const [consultantsOpen, setConsultantsOpen] = useState(false);
  const [selectedMilestone, setSelectedMilestone] = useState<Milestone | null>(null);

  const handleHover = useCallback((e: React.MouseEvent, milestoneId: string | null) => {
    if (milestoneId) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setPulsePosition({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setPulseActive(true);
      setHoveredMilestone(milestoneId);
    } else {
      setHoveredMilestone(null);
    }
  }, []);

  const handleConsultantsClick = (milestone: Milestone) => {
    setSelectedMilestone(milestone);
    setConsultantsOpen(true);
  };

  return (
    <section ref={ref} className="py-32 bg-[#0A0A0A] relative overflow-hidden">
      {/* Wisdom Pulse Effect */}
      <WisdomPulse
        isActive={pulseActive}
        sourceX={pulsePosition.x}
        sourceY={pulsePosition.y}
      />

      {/* Guardian Consultants Panel */}
      <GuardianConsultants
        isOpen={consultantsOpen}
        onClose={() => setConsultantsOpen(false)}
        milestoneTitle={selectedMilestone?.title || ""}
      />

      {/* Subtle texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vertical golden line */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={isInView ? { scaleY: 1 } : {}}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#D4AF37]/30 to-transparent origin-top"
      />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        {/* Section Header - Monocle/Economist aesthetic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="h-px w-12 bg-[#D4AF37]/40" />
            <span className="font-mono text-[#D4AF37]/60 text-xs tracking-[0.3em] uppercase">
              The Mentor's Vault
            </span>
            <div className="h-px w-12 bg-[#D4AF37]/40" />
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">
            Five Years of <span className="italic text-[#D4AF37]">Dialogue</span>
          </h2>
          <p className="text-white/40 font-serif text-lg max-w-xl mx-auto">
            Each conversation a coordinate. Each advice a trajectory correction.
          </p>
        </motion.div>

        {/* Milestone Cards */}
        <div className="space-y-8">
          {milestones.map((milestone, index) => (
            <motion.div
              key={milestone.id}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.2 + index * 0.15 }}
              onMouseEnter={(e) => handleHover(e, milestone.id)}
              onMouseLeave={() => {
                setHoveredMilestone(null);
                setPulseActive(false);
              }}
              className={`
                group relative p-8 border transition-all duration-500 cursor-pointer
                ${hoveredMilestone === milestone.id 
                  ? "border-[#D4AF37]/40 bg-[#D4AF37]/[0.03]" 
                  : "border-white/5 bg-white/[0.01]"}
              `}
              style={{
                marginLeft: index % 2 === 0 ? "0" : "auto",
                marginRight: index % 2 === 0 ? "auto" : "0",
                maxWidth: "85%",
              }}
            >
              {/* Year badge */}
              <div className="absolute -left-4 top-8 flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-mono"
                  style={{ 
                    borderColor: categoryColors[milestone.category],
                    color: categoryColors[milestone.category],
                  }}
                >
                  {milestone.year.slice(-2)}
                </div>
              </div>

              {/* Content */}
              <div className="ml-8">
                {/* Category */}
                <span 
                  className="text-xs tracking-[0.2em] font-mono"
                  style={{ color: categoryColors[milestone.category] }}
                >
                  {milestone.category}
                </span>

                {/* Title */}
                <h3 className="font-serif text-2xl text-white mt-2 mb-1 group-hover:text-[#D4AF37] transition-colors">
                  {milestone.title}
                </h3>

                {/* Subtitle */}
                <p className="text-white/40 text-sm italic mb-4">
                  {milestone.subtitle}
                </p>

                {/* Quote */}
                <blockquote className="relative pl-4 border-l-2 border-[#D4AF37]/30">
                  <p className="font-serif text-white/70 text-lg leading-relaxed italic">
                    "{milestone.quote}"
                  </p>
                </blockquote>

                {/* Guardian Consultants Button */}
                <motion.button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConsultantsClick(milestone);
                  }}
                  className="mt-6 flex items-center gap-2 text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors text-sm"
                  whileHover={{ x: 5 }}
                >
                  <Users className="w-4 h-4" />
                  <span className="font-mono text-xs tracking-wider">
                    VIEW GUARDIAN PERSPECTIVES →
                  </span>
                </motion.button>
              </div>

              {/* Hover glow */}
              {hoveredMilestone === milestone.id && (
                <motion.div
                  layoutId="milestone-glow"
                  className="absolute inset-0 -z-10"
                  style={{
                    background: `radial-gradient(ellipse at center, ${categoryColors[milestone.category]}10 0%, transparent 70%)`,
                  }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom flourish */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 1.2 }}
          className="mt-24 text-center"
        >
          <div className="inline-flex items-center gap-4">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-[#D4AF37]/40" />
            <span className="text-[#D4AF37]/30 font-serif text-sm italic">
              "The best mentors make themselves obsolete."
            </span>
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-[#D4AF37]/40" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MentorVaultDialogue;
