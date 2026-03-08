import SriramHeroSection from "@/components/sriram/SriramHeroSection";
import VerificationLayerSection from "@/components/sriram/VerificationLayerSection";
import LocalTruthSection from "@/components/sriram/LocalTruthSection";
import AssetBackingSection from "@/components/sriram/AssetBackingSection";
import SriramHandshakeSection from "@/components/sriram/SriramHandshakeSection";

const SriramNode = () => {
  return (
    <div className="bg-[#0a1628] text-white min-h-screen">
      {/* Subtle architectural overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}
      />
      
      <SriramHeroSection />
      <VerificationLayerSection />
      <LocalTruthSection />
      <AssetBackingSection />
      <SriramHandshakeSection />
    </div>
  );
};

export default SriramNode;
