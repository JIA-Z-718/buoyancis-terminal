// 確保路徑是 @/components/layout/Navbar
import { Navbar } from "@/components/layout/Navbar"; 
import SovereignCountdown from "@/components/product/SovereignCountdown";
import SovereignControl from "@/components/product/SovereignControl";

const SovereignNode = () => {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-2 tracking-tighter">SOVEREIGN NODE</h1>
          <p className="text-[#d4af37]/60 mb-12 font-mono uppercase tracking-[0.3em] text-sm">Central Command Alpha</p>
          
          <SovereignCountdown />
          <div className="mt-20">
            <SovereignControl />
          </div>
        </div>
      </main>
    </div>
  );
};

export default SovereignNode;