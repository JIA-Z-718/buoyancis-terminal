import { useEffect } from "react";
import RickardHeroSection from "@/components/rickard/RickardHeroSection";
import ParallelSection from "@/components/rickard/ParallelSection";
import MolecularTransformation from "@/components/rickard/MolecularTransformation";
import ScienceSection from "@/components/rickard/ScienceSection";
import RickardHandshakeSection from "@/components/rickard/RickardHandshakeSection";
import LabAmbientSound from "@/components/rickard/LabAmbientSound";

const RickardNode = () => {
  useEffect(() => {
    // Set page title
    document.title = "Node #003 | Scientific Integrity | Buoyancis Genesis";
    
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      <RickardHeroSection />
      <ParallelSection />
      <MolecularTransformation />
      <ScienceSection />
      <RickardHandshakeSection />
      
      {/* Lab ambient sound toggle */}
      <LabAmbientSound />
    </div>
  );
};

export default RickardNode;
