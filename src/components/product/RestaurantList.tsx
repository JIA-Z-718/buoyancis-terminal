import { useLanguage } from "@/contexts/LanguageContext";
import { Star } from "lucide-react";

// --- 10.0 協議：18 家餐廳完全體數據 ---
const allRestaurants = [
  // 前 10 名 (Elite Tier)
  { id: 1, name: "Frantzén", rating: 9.9, category: "Modern Nordic", region: "Norrmalm" },
  { id: 2, name: "AIRA", rating: 9.8, category: "Contemporary", region: "Djurgården" },
  { id: 3, name: "Seafood Gastro", rating: 9.7, category: "Seafood", region: "Norrmalm" },
  { id: 4, name: "Operakällaren", rating: 9.6, category: "Classic French", region: "Norrmalm" },
  { id: 5, name: "Ekstedt", rating: 9.5, category: "Fire-cooked", region: "Östermalm" },
  { id: 6, name: "Aloë", rating: 9.5, category: "Global Fusion", region: "Älvsjö" },
  { id: 7, name: "Lilla Ego", rating: 9.4, category: "Modern Swedish", region: "Vasastan" },
  { id: 8, name: "Etoile", rating: 9.4, category: "Innovative", region: "Vasastan" },
  { id: 9, name: "Nour", rating: 9.3, category: "Nordic-Japanese", region: "Norrmalm" },
  { id: 10, name: "Adam/Albin", rating: 9.2, category: "Modern European", region: "Östermalm" },
  // 後 8 名 (Essential Tier)
  { id: 11, name: "Kajsas Fisk", rating: 8.9, category: "Seafood", region: "Hötorgshallen" },
  { id: 12, name: "Cravings Mediterranean", rating: 8.7, category: "Mediterranean", region: "Vasastan" },
  { id: 13, name: "Restaurang Cypern", rating: 8.5, category: "Cypriot", region: "Valhallavägen" },
  { id: 14, name: "Brazilia Restaurang", rating: 8.4, category: "Steakhouse", region: "Södermalm" },
  { id: 15, name: "Taste by Nordrest", rating: 8.2, category: "Modern Buffet", region: "Solna" },
  { id: 16, name: "Antu Kitchen", rating: 8.1, category: "Chilean", region: "Skanstull" },
  { id: 17, name: "Rara Himalayan", rating: 8.0, category: "Nepalese", region: "Kungsholmen" },
  { id: 18, name: "Happy Lamb Hot Pot", rating: 7.9, category: "Hot Pot", region: "Sveavägen" }
];

const RestaurantList = ({ searchQuery, filters }: { searchQuery: string; filters: any }) => {
  const { language } = useLanguage();

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

  // 根據搜尋內容過濾餐廳
  const filteredRestaurants = allRestaurants.filter(res => 
    res.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    res.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRestaurants.map((res) => (
            <div key={res.id} className="group bg-card border border-border/50 p-5 rounded-xl hover:border-[#d4af37]/50 transition-all duration-500">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground group-hover:text-[#d4af37] transition-colors">
                    {getLocalizedName(res.name)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-widest">{res.category} · {res.region}</p>
                </div>
                <div className="flex items-center gap-1.5 bg-[#d4af37]/10 px-3 py-1 rounded-full border border-[#d4af37]/20">
                  <Star className="w-3.5 h-3.5 text-[#d4af37] fill-[#d4af37]" />
                  <span className="text-sm font-bold text-[#d4af37] tabular-nums">
                    {res.rating.toFixed(1)}
                  </span>
                </div>
              </div>
              <div className="w-full h-1 bg-secondary/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#d4af37] opacity-80" 
                  style={{ width: `${res.rating * 10}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RestaurantList;