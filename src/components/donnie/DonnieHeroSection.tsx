import { motion } from "framer-motion";
import { Rocket } from "lucide-react";

const DonnieHeroSection = () => {
  return (
    <section className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black">
      {/* Deep space gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-orange-950/10 to-black" />
      
      {/* Rocket exhaust particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Central glow */}
        <motion.div
          className="absolute left-1/2 bottom-0 -translate-x-1/2 w-[400px] h-[600px] bg-gradient-to-t from-orange-500/30 via-orange-400/10 to-transparent blur-3xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scaleY: [1, 1.1, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
          }}
        />
        
        {/* Rising particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-1 h-1 rounded-full bg-orange-400"
            style={{
              left: `${40 + Math.random() * 20}%`,
              bottom: `${Math.random() * 30}%`,
            }}
            animate={{
              y: [0, -200 - Math.random() * 400],
              opacity: [0.8, 0],
              scale: [1, 0.3],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
        
        {/* Speed lines */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`line-${i}`}
            className="absolute w-px h-32 bg-gradient-to-b from-transparent via-orange-400/50 to-transparent"
            style={{
              left: `${20 + i * 8}%`,
              top: `${Math.random() * 50}%`,
            }}
            animate={{
              y: [0, 200],
              opacity: [0, 0.5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
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
          <Rocket className="w-4 h-4 text-orange-400" />
          <span className="font-mono text-orange-400/70 text-sm tracking-widest">
            LAUNCH SEQUENCE: NODE #011 // DONNIE SC LYGONIS
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-4xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6"
        >
          登月不需要所有人的<span className="text-orange-400">同意</span>，
          <br />
          只需要足夠的<span className="text-white">推進力</span>。
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xl md:text-2xl text-orange-500/80 mb-8 font-medium italic"
        >
          "The Moon doesn't need consensus. It needs <span className="text-white">Thrust</span>."
        </motion.p>

        {/* Action line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-lg text-white/50 mb-16"
        >
          Stop incubating toys. Start incubating <span className="text-orange-400">Sovereignty</span>.
        </motion.p>

        {/* Body Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="max-w-2xl mx-auto space-y-6 text-white/70 leading-relaxed"
        >
          <p className="text-lg">
            You see <span className="text-orange-400 font-bold">1,000 pitch decks</span> a year.
          </p>
          <p>
            99% of them are "Tinder for Dogs" or "Better Calendars."
            <br />
            They are <span className="text-white/40">safe</span>. They are <span className="text-white/40">cute</span>. They are <span className="text-orange-400">Noise</span>.
          </p>
          <p className="text-xl text-white font-medium pt-4">
            Buoyancis is not an App.
            <br />
            It is the <span className="text-orange-400">Immune System</span> for the Global Economy.
          </p>
          <p className="text-2xl text-orange-400 font-bold pt-4">
            We are hunting a €3 Billion Endgame.
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
            transition={{ duration: 1.5, repeat: Infinity }}
            className="text-orange-500/60 text-2xl"
          >
            ↓
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default DonnieHeroSection;
