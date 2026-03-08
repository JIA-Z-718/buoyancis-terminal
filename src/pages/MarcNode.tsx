import MarcHeroSection from "@/components/marc/MarcHeroSection";
import EaccThesisSection from "@/components/marc/EaccThesisSection";
import MechanismSection from "@/components/marc/MechanismSection";
import EndgameSection from "@/components/marc/EndgameSection";
import MarcHandshakeSection from "@/components/marc/MarcHandshakeSection";

const MarcNode = () => {
  return (
    <div className="bg-[#000000] text-white font-mono min-h-screen">
      {/* CRT scanline effect */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(34,197,94,0.3) 2px, rgba(34,197,94,0.3) 4px)`
        }}
      />
      
      <MarcHeroSection />
      <EaccThesisSection />
      <MechanismSection />
      <EndgameSection />
      <MarcHandshakeSection />
    </div>
  );
};

export default MarcNode;
