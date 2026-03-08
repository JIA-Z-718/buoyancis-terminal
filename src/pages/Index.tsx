import { useState } from "react";
import ProductHeader from "@/components/product/ProductHeader";
import SearchHero from "@/components/product/SearchHero";
import AlgorithmBanner from "@/components/product/AlgorithmBanner";
import RestaurantList from "@/components/product/RestaurantList";
import ExpertLeaderboard from "@/components/product/ExpertLeaderboard";
import ReviewMockup from "@/components/product/ReviewMockup";
import ProductFooter from "@/components/product/ProductFooter";

export interface Filters {
  cuisine: string;
  region: string;
  minScore: number;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({ cuisine: "", region: "", minScore: 0 });

  return (
    <div className="min-h-screen bg-background">
      <ProductHeader />
      <main>
        <SearchHero searchQuery={searchQuery} onSearchChange={setSearchQuery} filters={filters} onFiltersChange={setFilters} />
        <AlgorithmBanner />
        <RestaurantList searchQuery={searchQuery} filters={filters} />
        <ExpertLeaderboard />
        <ReviewMockup />
      </main>
      <ProductFooter />
    </div>
  );
};

export default Index;
