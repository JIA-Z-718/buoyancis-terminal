import { useState } from "react";
import { createClient } from '@supabase/supabase-js';
import { BrowserRouter } from "react-router-dom"; // 🟢 必須引入
import { LanguageProvider } from "@/contexts/LanguageContext"; 
import { TooltipProvider } from "@/components/ui/tooltip"; // 🟢 通常 Lovable 需要

import ProductHeader from "@/components/product/ProductHeader";
import SearchHero from "@/components/product/SearchHero";
import AlgorithmBanner from "@/components/product/AlgorithmBanner";
import RestaurantList from "@/components/product/RestaurantList";
import ExpertLeaderboard from "@/components/product/ExpertLeaderboard";
import ReviewMockup from "@/components/product/ReviewMockup";
import ProductFooter from "@/components/product/ProductFooter";

// --- DATABASE CONFIGURATION ---
const supabaseUrl = 'https://ashklwdilmknamwcosvc.supabase.co'; 
const supabaseAnonKey = 'sb_publishable_qr0CFI-g9AENJnuiCAZtvw_kLckW9hr';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- 五位智者背景 ---
const SAGES = ["Laozi", "Confucius", "Li Ka-shing", "Einstein", "Xi Jinping"];
const SageSidebar = () => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#080a08]">
    {SAGES.map((sage, i) => (
      <div key={i} className="absolute text-[#d4af37] opacity-[0.05] font-serif text-4xl tracking-[0.8em]"
        style={{ writingMode: 'vertical-rl', textOrientation: 'upright', left: `${10 + i * 20}%`, top: i % 2 === 0 ? '10%' : '35%' }}>
        {sage}
      </div>
    ))}
  </div>
);

export interface Filters {
  cuisine: string;
  region: string;
  minScore: number;
}

const IndexContent = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({ cuisine: "", region: "", minScore: 0 });

  return (
    <div className="min-h-screen bg-[#080a08] text-white relative">
      <SageSidebar />
      <main className="relative z-10">
        <ProductHeader />
        <SearchHero searchQuery={searchQuery} onSearchChange={setSearchQuery} filters={filters} onFiltersChange={setFilters} />
        <AlgorithmBanner />
        <RestaurantList searchQuery={searchQuery} filters={filters} />
        <ExpertLeaderboard />
        <ReviewMockup />
        <ProductFooter />
      </main>
    </div>
  );
};

// 🔴 終極包裹層級：Router -> Language -> Tooltip -> Content
const Index = () => {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <TooltipProvider>
          <IndexContent />
        </TooltipProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};

export default Index;