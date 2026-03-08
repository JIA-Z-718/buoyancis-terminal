import { motion } from "framer-motion";
import { Dna } from "lucide-react";
import goldenDropBg from "@/assets/rickard-golden-drop.jpg";

const RickardHeroSection = () => {
  return (
    <section className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: `url(${goldenDropBg})` }}
      />
      
      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />
      
      {/* Warm gradient accent */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-amber-950/10 to-black" />
      
      {/* Golden droplet ripple effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Central ripples */}
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border border-amber-500/20 rounded-full"
            style={{
              width: `${200 + i * 150}px`,
              height: `${200 + i * 150}px`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              delay: i * 0.8,
            }}
          />
        ))}
        
        {/* Floating golden particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-amber-400/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        {/* Pre-header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-3 mb-12"
        >
          <Dna className="w-4 h-4 text-amber-400" />
          <span className="font-mono text-amber-400/70 text-sm tracking-widest">
            GENETIC SEQUENCE: NODE #003 // RICKARD ÖSTE
          </span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl md:text-5xl lg:text-6xl font-light text-white leading-tight mb-6"
        >
          "You disrupted the <span className="text-amber-400">Cow</span>.
          <br />
          I am disrupting the <span className="text-amber-300">Algorithm</span>."
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-amber-500/60 mb-16 font-light"
        >
          Different Industries. Same War.
        </motion.p>

        {/* Body Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-2xl mx-auto space-y-6 text-white/70 leading-relaxed text-lg"
        >
          <p>
            30 years ago, you looked at the dairy industry and saw a lie that everyone 
            accepted as truth. You used <span className="text-amber-400 font-medium">Science</span> (Enzymes) 
            to break down the old structure and create something purer.
          </p>
          <p>
            Today, I look at the Information Industry and see the same lie. I am using 
            <span className="text-amber-300 font-medium"> Physics</span> (Gravity) to break down the noise 
            and extract the signal.
          </p>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-20"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-amber-500/40 text-sm"
          >
            ↓
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default RickardHeroSection;
