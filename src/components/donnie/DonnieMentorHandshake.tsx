import { useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNodeClaim } from "@/hooks/useNodeClaim";

const DonnieMentorHandshake = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isActivating, setIsActivating] = useState(false);

  const { claimNode, rejectNode, hasClaimed } = useNodeClaim({
    nodeId: "011",
    claimantName: "Donnie SC Lygonis",
    redirectAfterClaim: "/main",
  });

  const handleActivate = async () => {
    if (hasClaimed) return;
    setIsActivating(true);

    // Mentor activation sequence
    toast.info("Initiating Binary Star Protocol...", { duration: 1000 });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    toast.info("Synchronizing orbits...", { duration: 1000 });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Claim the node
    await claimNode();

    await new Promise((resolve) => setTimeout(resolve, 800));
    toast.success("The Binary Star is complete.", {
      description: "Two trajectories, one destination.",
    });

    setIsActivating(false);
  };

  const handleDecline = async () => {
    await rejectNode();
    toast.error("Orbit disengaged.", {
      description: "The stars continue their separate paths.",
    });
    window.history.back();
  };

  return (
    <section
      ref={ref}
      className="py-32 bg-[#0A0A0A] relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background constellation */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[#D4AF37]/30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Central glow */}
      <motion.div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
        style={{
          background:
            "radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 60%)",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{ duration: 4, repeat: Infinity }}
      />

      <div className="max-w-3xl mx-auto px-6 relative z-10 w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-px w-8 bg-[#D4AF37]/40" />
            <span className="text-[#D4AF37]/50 text-xs tracking-[0.3em] uppercase font-mono">
              The Handshake
            </span>
            <div className="h-px w-8 bg-[#D4AF37]/40" />
          </div>
          <h2 className="font-serif text-4xl md:text-5xl text-white">
            Complete the <span className="text-[#D4AF37] italic">Binary</span>
          </h2>
        </motion.div>

        {/* The Commitment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-b from-[#D4AF37]/5 to-transparent border border-[#D4AF37]/20 rounded-none p-10 mb-12"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="font-serif text-xl text-white">Node #011</h3>
              <p className="text-[#D4AF37]/60 text-sm font-mono">
                THE MENTOR // THE AMPLIFIER
              </p>
            </div>
          </div>

          <div className="space-y-6 font-serif text-white/70 leading-relaxed">
            <p className="text-lg">
              For five years, you've watched.
              <br />
              For five years, you've advised.
              <br />
              For five years, you've{" "}
              <span className="text-[#D4AF37]">believed</span>.
            </p>

            <p>
              This node is not about what you can do for Buoyancis.
              <br />
              It's about what we've already built—
              <span className="text-white"> together</span>.
            </p>

            <p className="text-xl text-white pt-4 border-t border-[#D4AF37]/10">
              The Binary Star is a record:
              <br />
              <span className="text-[#D4AF37]">
                That no founder builds alone.
              </span>
            </p>
          </div>

          {/* The Promise */}
          <div className="mt-8 pt-6 border-t border-[#D4AF37]/10">
            <p className="text-[#D4AF37]/50 text-sm font-mono text-center tracking-wider">
              NODE #011 IS FOR THE ONE WHO SAW IT BEFORE IT WAS VISIBLE.
            </p>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            onClick={handleActivate}
            disabled={isActivating || hasClaimed}
            className="bg-[#D4AF37] hover:bg-[#C5A028] text-black px-10 py-7 rounded-none text-lg font-serif tracking-wide transition-all duration-300 hover:shadow-[0_0_60px_rgba(212,175,55,0.3)] border-0"
          >
            {isActivating ? (
              <motion.span className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                SYNCHRONIZING...
              </motion.span>
            ) : hasClaimed ? (
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                BINARY COMPLETE
              </span>
            ) : (
              <span className="flex items-center gap-2">
                COMPLETE THE BINARY
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </Button>

          <Button
            onClick={handleDecline}
            variant="outline"
            disabled={hasClaimed}
            className="border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 hover:bg-white/[0.02] px-10 py-7 rounded-none text-lg font-serif tracking-wide transition-all duration-300"
          >
            NOT YET
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-20 text-center space-y-3"
        >
          <div className="text-[#D4AF37]/20 text-xs font-mono tracking-wider">
            NODE #011 // BINARY STAR // MENTOR PROTOCOL
          </div>
          <div className="text-white/10 text-xs font-serif italic">
            genesis.buoyancis.com/node-011
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DonnieMentorHandshake;
