import { motion } from "framer-motion";

const AssetBackingSection = () => {
  return (
    <section className="min-h-screen py-24 relative bg-[#0a1628]">
      <div className="container max-w-4xl mx-auto px-6 relative z-10">
        {/* Heading */}
        <div className="mb-16">
          <span className="text-cyan-400/60 text-xs tracking-[0.3em] uppercase font-light">
            Economic Foundation
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-light text-white mt-4 tracking-tight">
            The <span className="text-cyan-400">Verification Layer</span>
          </h2>
        </div>

        {/* Main thesis */}
        <div className="mb-16">
          <p className="text-white text-2xl md:text-3xl font-light leading-relaxed">
            We are the S&P for the Real World.
          </p>
          <p className="text-white/60 text-xl md:text-2xl font-light leading-relaxed mt-4">
            We don't own assets. We own the <span className="text-cyan-400">Signal</span> that allows them to transact.
          </p>
          <p className="text-white/40 text-base font-light leading-relaxed mt-4">
            Targeting the 55% of global GDP that relies on Reputation, not Regulation.
          </p>
        </div>

        {/* Asset class distinction */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {/* Financial Assets - Not our domain */}
          <motion.div
            className="border border-red-500/20 bg-red-500/[0.02] p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-red-400/60 text-xs tracking-wider uppercase font-light mb-4">
              Financial Assets (45%)
            </p>
            <p className="text-red-400/80 text-2xl font-light mb-2">
              Not Our Domain
            </p>
            <p className="text-white/30 text-sm font-light">
              Stocks, Bonds, Crypto — verified by Math, SEC, Blockchain
            </p>
          </motion.div>

          {/* Reputation Assets - Our territory */}
          <motion.div
            className="border border-cyan-400/30 bg-cyan-400/[0.02] p-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <p className="text-cyan-400/60 text-xs tracking-wider uppercase font-light mb-4">
              Reputation-Dependent Assets (55%)
            </p>
            <p className="text-cyan-400 text-2xl font-light mb-2">
              €253 Trillion — Our Territory
            </p>
            <p className="text-white/30 text-sm font-light">
              Real Estate, Hospitality, Services, SMB — currently verified by fake Google reviews
            </p>
          </motion.div>
        </div>

        {/* Analogy section */}
        <div className="mb-16 border border-white/10 bg-white/[0.02] p-6 md:p-8">
          <p className="text-white/40 text-xs tracking-wider uppercase font-light mb-4">
            The Precedent
          </p>
          <div className="space-y-4 text-white/60 text-sm font-light">
            <p>
              <span className="text-cyan-400">S&P/Moody's</span> don't own bonds, but control 90% of bond market ratings.
            </p>
            <p>
              <span className="text-cyan-400">SWIFT</span> doesn't own bank funds, but controls 100% of cross-border transfers.
            </p>
            <p className="text-white/80 pt-4 border-t border-white/10">
              We are building the <span className="text-cyan-400">S&P for the Real World</span>. We don't own hotels or real estate. We own the Signal that allows them to transact.
            </p>
          </div>
        </div>

        {/* Defense statement */}
        <div className="border border-cyan-400/20 bg-cyan-400/5 p-8 md:p-12">
          <p className="text-white/60 text-lg font-light leading-relaxed mb-6">
            By tying reputation to physical/economic reality,
          </p>
          <p className="text-white text-xl md:text-2xl font-light leading-relaxed">
            we make it <span className="text-cyan-400">expensive to lie</span>.
          </p>
          <p className="text-white/40 text-lg font-light mt-6">
            This is the ultimate defense against AI hallucinations.
          </p>
        </div>
      </div>
    </section>
  );
};

export default AssetBackingSection;
