import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Rocket, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNodeClaim } from "@/hooks/useNodeClaim";

const DonnieHandshakeSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isIgniting, setIsIgniting] = useState(false);
  
  const { claimNode, rejectNode, hasClaimed } = useNodeClaim({
    nodeId: "011",
    claimantName: "Donnie SC Lygonis",
    redirectAfterClaim: "/main" // Redirect to Vernissage Z / World Map after claiming
  });

  const handleIgnite = async () => {
    if (hasClaimed) return;
    setIsIgniting(true);
    
    // Countdown sequence
    for (let i = 3; i > 0; i--) {
      toast.info(`T-${i}...`, { duration: 800 });
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    // Claim the node (this will fire confetti and show success toast)
    await claimNode();
    
    await new Promise(resolve => setTimeout(resolve, 800));
    toast.info("Welcome to the Moonshot, Donnie.", {
      description: "The Stockholm Trinity is complete.",
    });
    
    setIsIgniting(false);
  };

  const handleSafe = async () => {
    await rejectNode();
    toast.error("Mission aborted.", {
      description: "The pitch deck pile awaits.",
    });
    window.history.back();
  };

  return (
    <section ref={ref} className="py-32 bg-black relative min-h-screen flex items-center overflow-hidden">
      {/* Rocket launch effect background */}
      <div className="absolute inset-0">
        {/* Central flame glow */}
        <motion.div
          className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[600px] h-[800px]"
          style={{
            background: 'radial-gradient(ellipse at center bottom, rgba(251, 146, 60, 0.2) 0%, transparent 70%)',
          }}
          animate={{
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        
        {/* Rising particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-orange-400"
            style={{
              left: `${45 + Math.random() * 10}%`,
              bottom: '10%',
            }}
            animate={{
              y: [0, -500 - Math.random() * 300],
              opacity: [1, 0],
              scale: [1, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          />
        ))}
      </div>

      <div className="max-w-3xl mx-auto px-6 relative z-10 w-full">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center mb-12"
        >
          <span className="text-orange-400/50 text-sm tracking-widest uppercase">
            The Final Node
          </span>
          <h2 className="text-4xl md:text-5xl text-white mt-4 font-bold">
            Your Role: <span className="text-orange-400">The Ignition Key</span>
          </h2>
        </motion.div>

        {/* Role Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-950/40 to-black border border-orange-500/30 rounded-2xl p-8 mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Rocket className="w-7 h-7 text-black" />
            </div>
            <div>
              <h3 className="text-white font-bold text-xl">Node #011</h3>
              <p className="text-orange-400/60 text-sm">The Amplifier</p>
            </div>
          </div>

          <div className="space-y-4 text-white/70 leading-relaxed">
            <p>
              I don't need you to <span className="text-white/40">write code</span>.
            </p>
            <p className="text-lg">
              I need you to do what you do best:
            </p>
            <p className="text-xl text-orange-400 font-bold">
              Make the Impossible sound Inevitable.
            </p>
            <p className="pt-4">
              I need you to put this protocol in front of <span className="text-white font-semibold">Daniel Ek</span>, 
              <span className="text-white font-semibold"> Niklas Zennström</span>, 
              and the <span className="text-white font-semibold">King</span> if necessary.
            </p>
          </div>

          {/* The Promise */}
          <div className="mt-8 pt-6 border-t border-orange-500/20">
            <div className="flex items-center gap-3 text-orange-400/80">
              <Shield className="w-5 h-5" />
              <span className="text-sm font-mono">
                NODE #011 IS FOR THE BELIEVER WHO MAKES OTHERS BELIEVE.
              </span>
            </div>
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
            onClick={handleIgnite}
            disabled={isIgniting || hasClaimed}
            className="bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-500 hover:to-amber-400 text-black px-10 py-7 rounded-xl text-lg font-bold transition-all duration-300 hover:shadow-[0_0_60px_rgba(251,146,60,0.4)] border-0"
          >
            {isIgniting ? (
              <motion.div className="flex items-center gap-2">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
                >
                  <Rocket className="w-5 h-5" />
                </motion.div>
                <span>IGNITING...</span>
              </motion.div>
            ) : hasClaimed ? (
              <span className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                NODE CLAIMED
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                IGNITE THE ROCKET
                <ArrowRight className="w-5 h-5" />
              </span>
            )}
          </Button>

          <Button
            onClick={handleSafe}
            variant="outline"
            disabled={hasClaimed}
            className="border-white/20 text-white/50 hover:text-white/80 hover:border-white/40 hover:bg-white/5 px-10 py-7 rounded-xl text-lg transition-all duration-300"
          >
            PLAY IT SAFE
          </Button>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-20 text-center"
        >
          <div className="text-orange-500/30 text-xs font-mono tracking-wider">
            NODE #011 // THE AMPLIFIER // MOONSHOT DIVISION
          </div>
          <div className="text-orange-500/20 text-xs mt-2">
            genesis.buoyancis.com/node-011
          </div>
          <div className="text-orange-500/10 text-xs mt-4 italic">
            "The difference between impossible and inevitable is one believer."
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DonnieHandshakeSection;
