import { motion } from "framer-motion";
import { useEffect, useState } from "react";

const MarcHeroSection = () => {
  const [loaded, setLoaded] = useState(false);
  const [glitchActive, setGlitchActive] = useState(false);

  useEffect(() => {
    setLoaded(true);
    // Periodic glitch effect
    const glitchInterval = setInterval(() => {
      setGlitchActive(true);
      setTimeout(() => setGlitchActive(false), 150);
    }, 4000);
    return () => clearInterval(glitchInterval);
  }, []);

  return (
    <section className="min-h-screen flex flex-col justify-center relative overflow-hidden bg-[#000000]">
      {/* Deep void gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#000000] via-[#020202] to-[#000000]" />
      
      {/* Binary debris being sucked in */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute text-[8px] font-mono text-emerald-500/30 whitespace-nowrap"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, (50 - Math.random() * 100) * 5],
              y: [0, (50 - Math.random() * 100) * 5],
              opacity: [0.3, 0],
              scale: [1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
            }}
          >
            {Math.random() > 0.5 ? '01101' : '10010'}
          </motion.div>
        ))}
      </div>

      {/* Central rose gold beam */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-[200%] bg-gradient-to-t from-transparent via-[#d4af37]/20 to-transparent blur-sm" />

      <div className="container max-w-4xl mx-auto px-6 relative z-10">
        {/* Pre-header - instant display */}
        <div className={`mb-12 transition-opacity duration-0 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-3 px-4 py-2 border border-emerald-500/40 bg-emerald-500/5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span className="text-emerald-400 text-xs tracking-[0.25em] uppercase font-mono">
              Root Access: Node #000 // Marc Andreessen
            </span>
          </div>
        </div>

        {/* Headlines - terminal style instant display */}
        <div className={`space-y-4 transition-opacity duration-0 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-mono font-bold text-white tracking-tight">
            Software Ate The World.
          </h1>

          <h2 
            className={`text-4xl md:text-6xl lg:text-7xl font-mono font-bold tracking-tight ${glitchActive ? 'translate-x-1' : ''}`}
            style={{
              background: glitchActive 
                ? 'linear-gradient(90deg, #d4af37, #ff0040, #d4af37)' 
                : 'linear-gradient(90deg, #d4af37, #f5d998, #d4af37)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: glitchActive ? '2px 0 #00ff00, -2px 0 #ff0040' : 'none',
            }}
          >
            Now, Entropy Is Eating Software.
          </h2>
        </div>

        {/* Body Text - instant */}
        <div className={`mt-16 max-w-2xl transition-opacity duration-0 ${loaded ? 'opacity-100' : 'opacity-0'}`}>
          <p className="text-emerald-400/70 text-lg md:text-xl leading-relaxed font-mono">
            The browser gave us access. The platform gave us voice.
          </p>
          <p className="text-emerald-400/70 text-lg md:text-xl leading-relaxed font-mono mt-4">
            But Generative AI has given us <span className="text-red-400">infinite noise</span>.
          </p>
          <p className="text-white/80 text-lg md:text-xl leading-relaxed font-mono mt-8">
            The internet you architected is drowning in synthetic sludge. 
            The old trust mechanisms <span className="text-white/40">(Stars, Likes, Links)</span> have{" "}
            <span className="text-emerald-400">zero mass</span>. 
            They cannot hold the weight of reality.
          </p>
        </div>

        {/* Terminal cursor */}
        <div className="mt-12 flex items-center gap-2 font-mono text-emerald-400/60">
          <span>$</span>
          <span className="animate-pulse">_</span>
        </div>
      </div>
    </section>
  );
};

export default MarcHeroSection;
