import { useEffect } from "react";
import CodeRainBackground from "@/components/donnie/CodeRainBackground";
import ArchitectHero from "@/components/donnie/ArchitectHero";
import ToolPhilosophySection from "@/components/donnie/ToolPhilosophySection";
import ArchitectHandshake from "@/components/donnie/ArchitectHandshake";

const DonnieNode = () => {
  useEffect(() => {
    // Set page title
    document.title = "Node #011 | The Architect of Tools | Buoyancis Genesis";
    
    // Scroll to top on mount
    window.scrollTo(0, 0);
    
    // Force dark background
    document.body.style.backgroundColor = "#0A0A0A";
    
    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] relative">
      <CodeRainBackground />
      <ArchitectHero />
      <ToolPhilosophySection />
      <ArchitectHandshake />
    </div>
  );
};

export default DonnieNode;
