import { motion } from "framer-motion";

const MarketSection = () => {
  return (
    <section className="min-h-screen py-24 relative">
      <div className="container max-w-4xl mx-auto px-6">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-[#d4af37]/60 text-xs tracking-[0.3em] uppercase font-mono">
            Market Thesis
          </span>
          <h2 className="text-3xl md:text-4xl font-light text-white/90 mt-4">
            The S&P of the AI Age
          </h2>
          <p className="text-white/50 text-sm mt-3 font-mono">
            Targeting the 55% of global GDP that relies on Reputation, not Regulation.
          </p>
        </motion.div>

        {/* Data Points */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="space-y-6 mb-16"
        >
          {/* Target Asset Class */}
          <div className="border border-white/10 bg-black/30 p-6 md:p-8">
            <p className="text-white/40 text-xs font-mono mb-2">TARGET ASSET CLASS</p>
            <p className="text-white/80 text-lg md:text-xl">
              Global Hospitality, Real Estate & Service Assets
            </p>
            <p className="text-[#d4af37] text-3xl md:text-4xl font-light mt-4">
              €460<span className="text-lg text-[#d4af37]/60 ml-1">Trillion</span>
            </p>
          </div>

          {/* The Tax Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-red-500/20 bg-red-500/5 p-6">
              <p className="text-red-400/60 text-xs font-mono mb-2">CURRENT: TAX ON DISTRIBUTION</p>
              <p className="text-red-400/80 text-2xl font-mono">15-30%</p>
              <p className="text-white/40 text-xs mt-2">OTAs, Aggregators, Platforms</p>
            </div>
            <div className="border border-[#d4af37]/20 bg-[#d4af37]/5 p-6">
              <p className="text-[#d4af37]/60 text-xs font-mono mb-2">BUOYANCIS: TAX ON VERIFICATION</p>
              <p className="text-[#d4af37] text-2xl font-mono">0.001%</p>
              <p className="text-white/40 text-xs mt-2">Micro-fraction per truth signal</p>
            </div>
          </div>

          {/* Endgame */}
          <div className="border border-white/10 bg-black/30 p-6 md:p-8">
            <p className="text-white/40 text-xs font-mono mb-2">ENDGAME POSITIONING</p>
            <p className="text-white/90 text-xl md:text-2xl font-light">
              We don't own assets. We own the <span className="text-[#d4af37]">Signal</span>.
            </p>
            <p className="text-white/50 text-sm mt-4">
              S&P doesn't own bonds, but controls 90% of bond market ratings. SWIFT doesn't own bank funds, but controls 100% of cross-border transfers. We are building the verification layer for all Reputation-Dependent transactions.
            </p>
          </div>
        </motion.div>

        {/* Valuation Logic */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border border-[#d4af37]/20 bg-gradient-to-b from-[#d4af37]/5 to-transparent p-8 md:p-12"
        >
          <p className="text-[#d4af37]/60 text-xs tracking-[0.3em] uppercase font-mono mb-8">
            Expected Value Calculation
          </p>
          
          <div className="text-center space-y-4">
            <p className="text-white/60 text-lg">
              Reputation-Dependent Assets: <span className="text-white">€253T</span>
            </p>
            <p className="text-white/30 text-xs">(55% of Global Wealth — Real Estate, Hospitality, Services, SMB)</p>
            <p className="text-white/40">×</p>
            <p className="text-white/60 text-lg">
              Success Probability: <span className="text-white">0.001%</span>
            </p>
            <div className="w-24 h-px bg-white/20 mx-auto my-6" />
            <p className="text-3xl md:text-4xl text-[#d4af37] font-light">
              = $3B
            </p>
            <p className="text-white/30 text-sm font-mono">(Present Valuation)</p>
          </div>

          <p className="text-center text-white/50 text-sm mt-8 max-w-md mx-auto">
            If you believe the probability of success exceeds 0.001%, this asset is mispriced.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default MarketSection;
