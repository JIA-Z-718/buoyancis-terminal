import YiRenHeroSection from "@/components/yiren/YiRenHeroSection";
import CulturalBridgeSection from "@/components/yiren/CulturalBridgeSection";
import IntuitiveAuditSection from "@/components/yiren/IntuitiveAuditSection";
import MemorySphere from "@/components/yiren/MemorySphere";
import PrivateGallery from "@/components/yiren/PrivateGallery";
import LegacySection from "@/components/yiren/LegacySection";
import YiRenHandshakeSection from "@/components/yiren/YiRenHandshakeSection";

const YiRenNode = () => {
  return (
    <div className="bg-[#000000] text-white min-h-screen">
      {/* Subtle jade-gold gradient overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
        style={{
          backgroundImage: `radial-gradient(ellipse at 30% 30%, rgba(52,211,153,0.2) 0%, transparent 50%),
                           radial-gradient(ellipse at 70% 70%, rgba(212,175,55,0.15) 0%, transparent 50%)`
        }}
      />
      
      <YiRenHeroSection />
      <CulturalBridgeSection />
      <IntuitiveAuditSection />
      <MemorySphere 
        stationNumber="01" 
        stationTitle="THE ORIGIN" 
      />
      <PrivateGallery />
      <LegacySection />
      <YiRenHandshakeSection />
    </div>
  );
};

export default YiRenNode;
