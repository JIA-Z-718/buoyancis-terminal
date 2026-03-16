console.log("BLACKPALACE SYSTEM v1.0.1 - DEPLOYED");
import { useState } from "react";
import RestaurantList from "@/components/product/RestaurantList";
import PublicSubmitModal from "@/components/product/PublicSubmitModal";
import { PenTool, ShieldCheck, Zap } from "lucide-react";


const Index = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black">
      {/* 极简高级导航栏 */}
      <nav className="p-6 flex justify-between items-center border-b border-white/5 backdrop-blur-md sticky top-0 z-40 bg-black/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#d4af37] rounded-sm flex items-center justify-center">
            <ShieldCheck className="text-black w-5 h-5" />
          </div>
          <span className="font-mono tracking-[0.3em] font-bold text-lg">BUOYANCIS</span>
        </div>
        <div className="flex gap-6 text-[10px] tracking-widest text-white/40 uppercase">
          <span className="hover:text-[#d4af37] cursor-pointer transition-colors">Sovereign Algorithm</span>
          <span className="hover:text-[#d4af37] cursor-pointer transition-colors">Pricing Data</span>
        </div>
      </nav>

      {/* 自定义 Hero 区域 - 替代缺失的 Hero 组件 */}
      <section className="pt-24 pb-12 px-6 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#d4af37]/30 bg-[#d4af37]/5 mb-8">
          <Zap className="w-3 h-3 text-[#d4af37]" />
          <span className="text-[#d4af37] text-[10px] font-mono tracking-tighter uppercase">
            Sovereign Baseline: Stockholm Q1 2026
          </span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent italic">
          Dining Gravity v2.
        </h1>
        <p className="text-white/40 max-w-xl mx-auto text-sm md:text-base leading-relaxed font-light tracking-wide">
          Real-time reputation monitoring for Stockholm's gastronomy. 
          Defying the illusion of premium pricing through the <span className="text-white font-medium">Sovereign Algorithm.</span>
        </p>
      </section>
      
      <main className="px-6">
        {/* 核心排行榜 */}
        <div className="max-w-6xl mx-auto">
          <RestaurantList searchQuery="" />
        </div>
      </main>

      {/* 🔴 公众献祭按钮 */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-8 right-8 bg-[#d4af37] text-black p-4 rounded-full shadow-[0_20px_40px_rgba(212,175,55,0.3)] hover:scale-105 active:scale-95 transition-all duration-300 z-50 flex items-center gap-2 font-bold group"
      >
        <PenTool className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        <span className="tracking-widest text-[10px]">EVALUATE</span>
      </button>

      {/* 评价弹窗 */}
      {isModalOpen && (
        <PublicSubmitModal onClose={() => setIsModalOpen(false)} />
      )}

      <footer className="py-20 border-t border-white/5 text-center mt-20">
        <p className="text-white/10 text-[9px] tracking-[0.5em] uppercase font-mono">
          &copy; 2026 BLACKPALACE AB. ESTABLISHED IN STOCKHOLM.
        </p>
      </footer>
    </div>
  );
};

export default Index;