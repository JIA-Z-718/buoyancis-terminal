import HeroSection from "@/components/roelof/HeroSection";
import ThesisSection from "@/components/roelof/ThesisSection";
import PhysicsSection from "@/components/roelof/PhysicsSection";
import GaiaTestSection from "@/components/roelof/GaiaTestSection";
import MarketSection from "@/components/roelof/MarketSection";
import CTASection from "@/components/roelof/CTASection";

const RoelofNode = () => {
  return (
    <div className="bg-black text-white font-mono min-h-screen">
      {/* Scanline overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)`
        }}
      />
      
      <HeroSection />
      <ThesisSection />
      <PhysicsSection />
      <GaiaTestSection />
      <MarketSection />
      <CTASection />
    </div>
  );
};

export default RoelofNode;
