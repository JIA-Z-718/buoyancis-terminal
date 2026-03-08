import { useEffect, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import type { Filters } from "@/pages/Index";
import heroImg from "@/assets/hero-stockholm.jpg";

interface SearchHeroProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
}

const SCORE_OPTIONS = [0, 3.0, 3.5, 4.0, 4.5];

const SearchHero = ({ searchQuery, onSearchChange, filters, onFiltersChange }: SearchHeroProps) => {
  const { t } = useLanguage();
  const [showFilters, setShowFilters] = useState(false);
  const [cuisines, setCuisines] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    const fetchOptions = async () => {
      const [{ data: c }, { data: r }] = await Promise.all([
        supabase.from("restaurants").select("cuisine").not("cuisine", "is", null),
        supabase.from("restaurants").select("region"),
      ]);
      const uniqueCuisines = [...new Set((c || []).map((x: any) => x.cuisine).filter(Boolean))].sort() as string[];
      const uniqueRegions = [...new Set((r || []).map((x: any) => x.region).filter(Boolean))].sort() as string[];
      setCuisines(uniqueCuisines);
      setRegions(uniqueRegions);
    };
    fetchOptions();
  }, []);

  const hasActiveFilters = filters.cuisine || filters.region || filters.minScore > 0;

  const clearFilters = () => {
    onFiltersChange({ cuisine: "", region: "", minScore: 0 });
  };

  return (
    <section className="relative pt-14 overflow-hidden">
      {/* Background image with blur overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImg}
          alt=""
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/60 to-background" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center px-4 sm:px-6 py-20 sm:py-28">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
          {t("hero.title")}
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-muted-foreground font-medium">
          {t("hero.subtitle")}
        </p>

        {/* Search bar */}
        <div className="mt-10 relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("hero.search.placeholder")}
            className="w-full pl-12 pr-12 py-4 text-base bg-card border border-border rounded-2xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 shadow-lg shadow-foreground/5 transition-all"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
            aria-label="Toggle filters"
          >
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Filter pills */}
        {showFilters && (
          <div className="mt-4 max-w-xl mx-auto flex flex-wrap items-center gap-2 justify-center">
            <select
              value={filters.cuisine}
              onChange={(e) => onFiltersChange({ ...filters, cuisine: e.target.value })}
              className="px-3 py-2 text-sm bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
            >
              <option value="">{t("filter.cuisine")}: {t("filter.all")}</option>
              {cuisines.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              value={filters.region}
              onChange={(e) => onFiltersChange({ ...filters, region: e.target.value })}
              className="px-3 py-2 text-sm bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
            >
              <option value="">{t("filter.region")}: {t("filter.all")}</option>
              {regions.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>

            <select
              value={filters.minScore}
              onChange={(e) => onFiltersChange({ ...filters, minScore: Number(e.target.value) })}
              className="px-3 py-2 text-sm bg-card border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-sm"
            >
              {SCORE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s === 0 ? `${t("filter.score")}: ${t("filter.all")}` : `≥ ${s.toFixed(1)}`}
                </option>
              ))}
            </select>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3 h-3" />
                {t("filter.clear")}
              </button>
            )}
          </div>
        )}

        <p className="mt-4 text-xs text-muted-foreground/70 font-medium">
          {t("hero.powered")}
        </p>
      </div>
    </section>
  );
};

export default SearchHero;
