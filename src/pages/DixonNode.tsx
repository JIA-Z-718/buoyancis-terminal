import { useEffect } from "react";
import DixonHeroSection from "@/components/dixon/DixonHeroSection";
import TokenomicsSection from "@/components/dixon/TokenomicsSection";
import ArchitectureSection from "@/components/dixon/ArchitectureSection";
import DixonHandshakeSection from "@/components/dixon/DixonHandshakeSection";

const DixonNode = () => {
  useEffect(() => {
    // Set page title
    document.title = "Node #002 | Protocol Architecture | Buoyancis Genesis";
    
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <DixonHeroSection />
      <TokenomicsSection />
      <ArchitectureSection />
      <DixonHandshakeSection />
    </div>
  );
};

export default DixonNode;
