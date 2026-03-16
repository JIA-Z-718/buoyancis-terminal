import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Star, Loader2, ChevronDown, AlertTriangle } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import TrustCurveChart from "./TrustCurveChart"; 

const supabaseUrl = 'https://ashklwdilmknamwcosvc.supabase.co';
const supabaseAnonKey = 'sb_publishable_qr0CFI-g9AENJnuiCAZtvw_kLckW9hr';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const RestaurantCard = ({ res, getLocalizedName }: { res: any, getLocalizedName: (n: string) => string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // 🟢 分數與價格邏輯
  const score = Math.round(Number(res.current_rating || 0));
  const priceLevel = res.price_level || 2; // 預設為 2 ($$)
  const priceString = "$".repeat(priceLevel);
  
  // 🔴 溢價幻覺核心演算法：收費 $$$ 或 $$$$，但分數低於 85
  const isPremiumIllusion = priceLevel >= 3 && score < 85;

  return (
    <div 
      onClick={() => setIsExpanded(!isExpanded)}
      className={`group bg-black border p-5 rounded-xl transition-all duration-300 cursor-pointer flex flex-col overflow-hidden relative
        ${isExpanded ? 'shadow-[0_0_20px_rgba(212,175,55,0.1)]' : ''}
        ${isPremiumIllusion 
          ? 'border-red-900/40 hover:border-red-600/60' 
          : 'border-[#d4af37]/20 hover:border-[#d4af37]/50'
        }
      `}
    >
      {/* 🔴 溢價警告標籤 */}
      {isPremiumIllusion && (
        <div className="absolute top-0 right-0 bg-red-950/90 border-b border-l border-red-500/50 px-3 py-1 rounded-bl-lg flex items-center gap-1 shadow-lg z-10">
          <AlertTriangle className="w-3 h-3 text-red-500" />
          <span className="text-red-400 text-[9px] font-mono font-bold tracking-widest uppercase">
            High Premium Illusion
          </span>
        </div>
      )}

      <div className="flex justify-between items-start mb-4 mt-2">
        <div>
          <h3 className={`text-lg font-bold transition-colors ${isPremiumIllusion ? 'text-white group-hover:text-red-400' : 'text-white group-hover:text-[#d4af37]'}`}>
            {getLocalizedName(res.name)}
          </h3>
          <p className="text-xs text-white/50 mt-1 uppercase tracking-widest flex items-center gap-2">
            <span>{res.category} · {res.region}</span>
            <span className="text-[#d4af37] font-bold tracking-widest">{priceString}</span>
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isPremiumIllusion ? 'bg-red-950/30 border-red-900/50' : 'bg-[#d4af37]/10 border-[#d4af37]/20'}`}>
            <Star className={`w-3.5 h-3.5 ${isPremiumIllusion ? 'text-red-500 fill-red-500' : 'text-[#d4af37] fill-[#d4af37]'}`} />
            <span className={`text-sm font-bold tabular-nums ${isPremiumIllusion ? 'text-red-500' : 'text-[#d4af37]'}`}>
              {score}
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-white/30 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>
      
      {/* 進度條 */}
      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full opacity-80 transition-all duration-1000 ease-out ${isPremiumIllusion ? 'bg-red-600' : 'bg-[#d4af37]'}`}
          style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
        />
      </div>

      {/* 隱藏的數據折線圖面板 */}
      {isExpanded && (
        <div className={`mt-4 pt-4 border-t animate-in slide-in-from-top-4 duration-300 ${isPremiumIllusion ? 'border-red-900/30' : 'border-[#d4af37]/10'}`}>
          <div className="flex justify-between items-center mb-2">
            <p className={`${isPremiumIllusion ? 'text-red-400/80' : 'text-[#d4af37]'} text-[10px] tracking-widest uppercase`}>Trust Volatility History</p>
            <p className="text-white/30 text-[9px] font-mono tracking-widest">SOVEREIGN ALGORITHM</p>
          </div>
          <TrustCurveChart restaurantId={res.id} />
        </div>
      )}
    </div>
  );
};

const RestaurantList = ({ searchQuery, filters }: { searchQuery: string; filters?: any }) => {
  const { language } = useLanguage();
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const { data, error } = await supabase
          .from('restaurants')
          .select('*')
          .order('current_rating', { ascending: false });

        if (error) throw error;
        if (data) setRestaurants(data);
      } catch (error) {
        console.error("Error fetching dynamic data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const getLocalizedName = (name: string) => {
    if (language === 'en') return name;
    const mapping: Record<string, string> = {
      "Frantzén": "弗蘭采恩 (Frantzén)",
      "AIRA": "艾拉 (AIRA)",
      "Seafood Gastro": "海鮮美食 (Seafood Gastro)",
      "Operakällaren": "歌劇院酒窖 (Operakällaren)",
      "Ekstedt": "埃克斯泰特 (Ekstedt)",
      "Aloë": "阿洛埃 (Aloë)",
      "Lilla Ego": "小自我 (Lilla Ego)",
      "Etoile": "星辰 (Etoile)",
      "Nour": "努爾 (Nour)",
      "Adam/Albin": "亞當與阿爾賓 (Adam/Albin)",
      "Kajsas Fisk": "卡伊薩海鮮 (Kajsas Fisk)",
      "Cravings Mediterranean": "地中海之味 (Cravings Mediterranean)",
      "Restaurang Cypern": "賽普勒斯餐廳 (Restaurang Cypern)",
      "Brazilia Restaurang": "巴西利亞餐廳 (Brazilia Restaurang)",
      "Taste by Nordrest": "諾德雷斯特之味 (Taste by Nordrest)",
      "Antu Kitchen": "安圖廚房 (Antu Kitchen)",
      "Rara Himalayan": "拉拉喜馬拉雅 (Rara Himalayan)",
      "Happy Lamb Hot Pot": "快樂小羊火鍋 (Happy Lamb Hot Pot)"
    };
    return mapping[name] || name;
  };

  const filteredRestaurants = restaurants.filter(res =>
    res.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="py-12 px-4 sm:px-6 min-h-[400px]">
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-[#d4af37]/60">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p className="font-mono text-sm tracking-widest uppercase">Syncing Sovereign Protocol...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRestaurants.map((res) => (
              <RestaurantCard key={res.id} res={res} getLocalizedName={getLocalizedName} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default RestaurantList;