import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { FlaskConical, Code, Megaphone, Check, HelpCircle } from "lucide-react";

const CrazyLogicSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const nodes = [
    {
      icon: FlaskConical,
      title: "THE SCIENCE",
      description: "Backed by the Founder of Oatly",
      node: "Node #003",
      status: "secured",
    },
    {
      icon: Code,
      title: "THE LOGIC",
      description: "Audited by Prof. Montelius",
      node: "Node #010",
      status: "secured",
    },
    {
      icon: Megaphone,
      title: "THE STORY",
      description: "Amplified by Donnie SC",
      node: "Node #011",
      status: "pending",
    },
  ];

  return (
    <section ref={ref} className="py-32 bg-gradient-to-b from-black via-orange-950/5 to-black relative overflow-hidden">
      {/* Animated background lines */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent"
            style={{
              width: '200%',
              left: '-50%',
              top: `${20 + i * 15}%`,
            }}
            animate={{
              x: ['-50%', '0%'],
            }}
            transition={{
              duration: 20 + i * 5,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-16"
        >
          <span className="text-orange-400/50 text-sm tracking-widest uppercase mb-4 block">
            The Method to the Madness
          </span>
          <h2 className="text-4xl md:text-5xl text-white font-bold">
            Why this Moonshot <span className="text-orange-400">Won't Crash</span>
          </h2>
        </motion.div>

        {/* Node Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {nodes.map((node, index) => (
            <motion.div
              key={node.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.15 }}
              className={`
                relative p-6 border rounded-xl
                ${node.status === 'pending' 
                  ? 'border-orange-500/50 bg-orange-500/5' 
                  : 'border-white/10 bg-white/[0.02]'}
              `}
            >
              {/* Status indicator */}
              <div className={`
                absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center
                ${node.status === 'pending' 
                  ? 'bg-orange-500/20 text-orange-400' 
                  : 'bg-green-500/20 text-green-400'}
              `}>
                {node.status === 'pending' ? (
                  <HelpCircle className="w-4 h-4" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </div>

              {/* Icon */}
              <div className={`
                w-14 h-14 rounded-lg flex items-center justify-center mb-4
                ${node.status === 'pending' 
                  ? 'bg-gradient-to-br from-orange-500 to-amber-500' 
                  : 'bg-white/10'}
              `}>
                <node.icon className={`w-7 h-7 ${node.status === 'pending' ? 'text-black' : 'text-white/60'}`} />
              </div>

              {/* Title */}
              <div className="text-white/40 text-xs tracking-widest mb-2">
                {node.title}
              </div>

              {/* Description */}
              <p className={`text-lg font-medium mb-3 ${node.status === 'pending' ? 'text-orange-400' : 'text-white'}`}>
                {node.description}
              </p>

              {/* Node ID */}
              <div className={`
                inline-block text-xs font-mono px-3 py-1 rounded-full
                ${node.status === 'pending' 
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' 
                  : 'bg-white/5 text-white/40'}
              `}>
                {node.node}
                {node.status === 'pending' && '?'}
              </div>

              {/* Pending glow */}
              {node.status === 'pending' && (
                <motion.div
                  className="absolute inset-0 border-2 border-orange-500/30 rounded-xl"
                  animate={{
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          ))}
        </div>

        {/* Bottom Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <div className="inline-block bg-gradient-to-r from-orange-500/10 via-orange-500/20 to-orange-500/10 border border-orange-500/30 rounded-2xl p-8">
            <p className="text-white text-xl mb-4">
              I have the <span className="text-orange-400 font-bold">Science</span>.
              I have the <span className="text-orange-400 font-bold">Code</span>.
            </p>
            <p className="text-2xl md:text-3xl text-orange-400 font-bold">
              I am missing the Megaphone.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CrazyLogicSection;
