import { useState } from "react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Terminal, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNodeClaim } from "@/hooks/useNodeClaim";

const AuditRequestSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [isInitializing, setIsInitializing] = useState(false);

  const { claimNode, rejectNode, hasClaimed } = useNodeClaim({
    nodeId: "010",
    claimantName: "Johan Montelius",
    redirectAfterClaim: "/main" // Redirect to Vernissage Z / World Map after claiming
  });

  const handleStartAudit = async () => {
    if (hasClaimed) return;
    setIsInitializing(true);
    
    // Simulate initialization sequence
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success("Audit session initialized", {
      description: "Node #010 verification in progress...",
    });
    
    // Claim the node (this will fire confetti and redirect to /main)
    await claimNode();
    
    setIsInitializing(false);
  };

  const handleReturn = async () => {
    await rejectNode();
    toast.info("Session archived", {
      description: "Node #010 remains unclaimed.",
    });
    window.history.back();
  };

  return (
    <section ref={ref} className="py-32 bg-black relative min-h-screen flex items-center">
      {/* Grid Background */}
      <div 
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34, 197, 94, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="max-w-3xl mx-auto px-6 relative z-10 w-full">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          className="text-center mb-12"
        >
          <span className="font-mono text-green-500/50 text-xs tracking-widest">
            // SECTION 04
          </span>
          <h2 className="font-mono text-2xl md:text-3xl text-white mt-4">
            Request for Audit: <span className="text-green-400">Node #010</span>
          </h2>
        </motion.div>

        {/* Terminal Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-zinc-950 border border-green-500/30 overflow-hidden"
        >
          {/* Terminal Header */}
          <div className="bg-zinc-900 px-4 py-2 flex items-center gap-2 border-b border-green-500/20">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
            <span className="ml-4 font-mono text-xs text-green-500/50">audit_request.log</span>
          </div>

          {/* Content */}
          <div className="p-8">
            <div className="font-mono text-white/70 space-y-4 mb-8">
              <p className="leading-relaxed">
                This is not a request for funding.
              </p>
              <p className="leading-relaxed text-green-400">
                It is a request for Rigorous Logic.
              </p>
              <p className="leading-relaxed text-white/50">
                We are building the verification layer for <span className="text-green-400">€460T</span> of assets.
              </p>
              <p className="leading-relaxed">
                We cannot afford a race condition in the truth engine.
              </p>
            </div>

            {/* CTA */}
            <div className="pt-6 border-t border-green-500/20">
              <p className="font-mono text-lg text-green-400 text-center mb-8">
                Come break our code.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleStartAudit}
                  disabled={isInitializing || hasClaimed}
                  className="bg-green-500 hover:bg-green-400 text-black font-mono text-sm px-8 py-6 rounded-none transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                >
                  {isInitializing ? (
                    <motion.div className="flex items-center gap-2">
                      <motion.span
                        animate={{ opacity: [1, 0.3, 1] }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                      >
                        INITIALIZING...
                      </motion.span>
                    </motion.div>
                  ) : hasClaimed ? (
                    <span className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      NODE CLAIMED
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Terminal className="w-4 h-4" />
                      START AUDIT (Claim Node)
                    </span>
                  )}
                </Button>

                <Button
                  onClick={handleReturn}
                  variant="outline"
                  disabled={hasClaimed}
                  className="border-green-500/30 text-green-500/70 hover:text-green-400 hover:border-green-500/50 hover:bg-green-500/5 font-mono text-sm px-8 py-6 rounded-none transition-all duration-300"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  RETURN TO LECTURE
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="font-mono text-green-500/30 text-xs">
            NODE #010 // LOGIC AUDIT // KTH DISTRIBUTED SYSTEMS
          </div>
          <div className="font-mono text-green-500/20 text-xs mt-2">
            genesis.buoyancis.com/node-010
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AuditRequestSection;
