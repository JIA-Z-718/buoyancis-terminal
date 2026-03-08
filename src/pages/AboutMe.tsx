import { useEffect } from "react";
import { motion } from "framer-motion";

const totems = [
  {
    name: "Laozi (The Architect)",
    quote: '"Nature does not hurry, yet everything is accomplished."',
    label: "Translation to Tech:",
    translation: "Graceful Error Handling & Asynchronous Systems.",
  },
  {
    name: "Confucius (The Coder)",
    quote: '"The mechanic, who wishes to do his work well, must first sharpen his tools."',
    label: "Translation to Tech:",
    translation: "Dev Environment Optimization & Clean Code.",
  },
  {
    name: "Li Ka-shing (The Worker)",
    quote: '"Vision is perhaps our greatest strength... it has kept us alive to the power and continuity of thought."',
    label: "Translation to Tech:",
    translation: "Relentless Iteration & High-Throughput Execution.",
  },
  {
    name: "Einstein (The Optimizer)",
    quote: '"Everything should be made as simple as possible, but not simpler."',
    label: "Translation to Tech:",
    translation: "Algorithmic Efficiency & Embracing O(n log n).",
  },
  {
    name: "Xi Jinping (The Leader)",
    quote: '"Empty talk harms the country, while hard work makes it flourish." (空谈误国，实干兴邦)',
    label: "Translation to Tech:",
    translation: "Execution-Oriented & Result-Driven Development.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 0.15 * i, duration: 0.5, ease: "easeOut" as const },
  }),
};

const AboutMe = () => {
  useEffect(() => {
    document.title = "Buoyancis — About Me";
    window.scrollTo(0, 0);

    // Deep navy background override
    document.body.style.backgroundColor = "#0a192f";
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0a192f", color: "#ccd6f6" }}>
      <div className="max-w-[1000px] mx-auto px-5 py-6">
        {/* ── About Section ── */}
        <section className="py-[100px]">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-bold mb-6"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              color: "#ccd6f6",
            }}
          >
            Harmonizing Chaos through Code.
          </motion.h1>

          {[
            <>
              Great software is found in the balance between the abstract and the concrete.
            </>,
            <>
              My approach to engineering draws inspiration from a unique convergence of disciplines: the structural order of{" "}
              <Hl>Confucianism</Hl>, the fluid adaptability of <Hl>Daoism</Hl>, and the rigorous logic of{" "}
              <Hl>Einsteinian physics</Hl>.
            </>,
            <>
              As a developer, I apply this hybrid mindset to build foundations, not just features. I believe in the{" "}
              <Hl>Li Ka-shing</Hl> spirit of relentless diligence combined with the strategic vision required to govern
              complex systems.
            </>,
            <>
              From analyzing sorting algorithms down to the CPU instruction level to envisioning large-scale
              architectures, I am continually searching for the <Hl>"Buoyancy"</Hl>—the force that lifts performance
              above the heavy drag of inefficiency. I am ready to turn ambitious visions into grounded reality with
              mathematical precision and unrelenting execution.
            </>,
          ].map((content, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.12, duration: 0.5 }}
              className="text-lg mb-6 max-w-[800px] leading-relaxed"
              style={{ color: "#8892b0" }}
            >
              {content}
            </motion.p>
          ))}
        </section>

        {/* ── Guiding Principles Section ── */}
        <section className="py-[100px]">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[2rem] font-bold mb-8 flex items-center gap-5"
            style={{ color: "#ccd6f6", fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}
          >
            My Guiding Principles
            <span className="flex-1 h-px opacity-50" style={{ backgroundColor: "#8892b0" }} />
          </motion.h2>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-[25px]">
            {totems.map((t, i) => (
              <motion.div
                key={t.name}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={cardVariants}
                whileHover={{ y: -5 }}
                className="p-8 rounded-lg border border-transparent transition-shadow duration-300"
                style={{
                  backgroundColor: "#112240",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "#64ffda";
                  (e.currentTarget as HTMLDivElement).style.boxShadow =
                    "0 10px 30px -15px rgba(2, 12, 27, 0.7)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = "transparent";
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
                }}
              >
                <h3
                  className="text-[1.2rem] font-bold mb-4"
                  style={{ color: "#64ffda" }}
                >
                  {t.name}
                </h3>

                <blockquote
                  className="italic mb-6 pl-4 text-[0.95rem] leading-relaxed"
                  style={{
                    borderLeft: "3px solid #8892b0",
                    color: "#ccd6f6",
                  }}
                >
                  {t.quote}
                </blockquote>

                <div className="text-[0.9rem]" style={{ color: "#8892b0" }}>
                  {t.label}
                  <span
                    className="block mt-2 font-semibold"
                    style={{ color: "#ccd6f6" }}
                  >
                    {t.translation}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

/** Accent-colored inline span */
const Hl = ({ children }: { children: React.ReactNode }) => (
  <span className="font-bold" style={{ color: "#64ffda" }}>
    {children}
  </span>
);

export default AboutMe;
