import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Music, CreditCard, Shield } from "lucide-react";

const StockholmNarrativeSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const towers = [
    {
      icon: Music,
      label: "MUSIC",
      company: "Spotify",
      status: "SOLVED",
      color: "from-green-500 to-green-400",
      delay: 0,
    },
    {
      icon: CreditCard,
      label: "PAYMENTS",
      company: "Klarna",
      status: "SOLVED",
      color: "from-pink-500 to-pink-400",
      delay: 0.2,
    },
    {
      icon: Shield,
      label: "TRUTH",
      company: "Buoyancis",
      status: "BUILDING",
      color: "from-orange-500 to-amber-400",
      delay: 0.4,
      isActive: true,
    },
  ];

  return (
    <section ref={ref} className="py-32 bg-black relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(rgba(251, 146, 60, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(251, 146, 60, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-20"
        >
          <span className="text-orange-400/50 text-sm tracking-widest uppercase mb-4 block">
            The Legacy
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl text-white font-bold">
            The Stockholm <span className="text-orange-400">Trinity</span>
          </h2>
        </motion.div>

        {/* Trinity Towers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {towers.map((tower, index) => (
            <motion.div
              key={tower.label}
              initial={{ opacity: 0, y: 50 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: tower.delay }}
              className={`relative group ${tower.isActive ? 'md:-mt-8' : ''}`}
            >
              {/* Tower Base */}
              <div className={`
                relative bg-gradient-to-b ${tower.color} p-1 rounded-t-lg
                ${tower.isActive ? 'animate-pulse' : ''}
              `}>
                <div className="bg-black/90 p-8 text-center">
                  {/* Icon */}
                  <div className={`
                    w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center
                    bg-gradient-to-br ${tower.color}
                  `}>
                    <tower.icon className="w-8 h-8 text-black" />
                  </div>
                  
                  {/* Label */}
                  <div className="text-white/40 text-xs tracking-widest mb-2">
                    {tower.label}
                  </div>
                  
                  {/* Company */}
                  <div className="text-white text-2xl font-bold mb-4">
                    {tower.company}
                  </div>
                  
                  {/* Status */}
                  <div className={`
                    inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono
                    ${tower.isActive 
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50' 
                      : 'bg-white/5 text-white/40'}
                  `}>
                    {tower.isActive && (
                      <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    )}
                    {tower.status}
                  </div>
                </div>
              </div>

              {/* Tower Height Indicator */}
              <div className={`
                h-${tower.isActive ? '40' : '24'} bg-gradient-to-b ${tower.color} opacity-20
                mx-4 rounded-b-lg
              `} style={{ height: tower.isActive ? '160px' : '96px' }} />

              {/* Active tower glow */}
              {tower.isActive && (
                <motion.div
                  className="absolute -inset-4 bg-orange-500/10 blur-2xl rounded-full -z-10"
                  animate={{
                    opacity: [0.3, 0.6, 0.3],
                    scale: [0.95, 1.05, 0.95],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.8 }}
          className="text-center max-w-3xl mx-auto space-y-6"
        >
          <p className="text-white/60 text-lg leading-relaxed">
            The world looks to Silicon Valley for AI.
            <br />
            But the world looks to <span className="text-orange-400 font-semibold">Stockholm</span> for Trust and Governance.
          </p>
          <p className="text-2xl text-white font-bold">
            This is the next defining export of Sweden.
          </p>
          <p className="text-orange-400 text-xl font-medium">
            Do you want to watch it happen, or do you want to <span className="underline">light the fuse</span>?
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default StockholmNarrativeSection;
