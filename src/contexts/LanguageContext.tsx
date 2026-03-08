import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "cn";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Header
    "nav.home": "Home",
    "nav.how": "How It Works",
    "nav.about": "About",
    "nav.login": "Sign In",
    "nav.signup": "Sign Up",

    // Hero
    "hero.title": "Find Restaurants You Can Actually Trust.",
    "hero.subtitle": "Reviews weighted by local experts, not bots.",
    "hero.search.placeholder": "Search restaurants, cuisines, neighborhoods...",
    "hero.cta": "Explore All",
    "hero.powered": "Powered by the Buoyancis Trust Protocol",

    // Restaurant cards
    "card.reviews": "reviews",
    "card.verified": "verified",
    "card.localExpert": "Local Expert",
    "card.buoyancisScore": "Buoyancis Score",
    "card.traditionalScore": "Traditional Avg",
    "card.viewDetails": "View Details",

    // Featured section
    "featured.title": "Featured in Stockholm",
    "featured.subtitle": "Restaurants verified by local experts with the highest trust scores.",

    // How it works
    "how.title": "How It Works",
    "how.step1.title": "Real Reviews Only",
    "how.step1.desc": "Every review is weighted by the reviewer's verified history, local expertise, and consistency — not just star count.",
    "how.step2.title": "Bot Filtering",
    "how.step2.desc": "Our protocol detects and suppresses fake reviews, paid promotions, and coordinated manipulation automatically.",
    "how.step3.title": "Time Decay",
    "how.step3.desc": "Recent experiences matter more. A great meal last week counts more than a five-star review from 2019.",

    // Footer
    "footer.tagline": "Engineered in Stockholm. Anchored in Truth.",
    "footer.privacy": "Privacy",
    "footer.terms": "Terms",
    "footer.blog": "Blog",

    // Detail page
    "detail.back": "← Back",
    "detail.allReviews": "All Reviews",
    "detail.trustComparison": "Trust Score Comparison",
    "detail.traditional": "Traditional Average",
    "detail.calibrated": "Buoyancis Calibrated",
    "detail.inflated": "inflated by traditional platforms",
    "detail.reviewerTier": "Tier",
    "detail.weight": "Weight",
    "detail.verified": "Verified",
    "detail.localExpert": "Local Expert",
    "detail.helpful": "Helpful",
    "detail.noReviews": "No reviews yet.",

    // Review form
    "review.title": "Write a Review",
    "review.yourRating": "Your rating:",
    "review.placeholder": "Share your experience at this restaurant...",
    "review.submit": "Submit Review",
    "review.success": "Review submitted successfully!",
    "review.error": "Failed to submit review. Please try again.",
    "review.ratingRequired": "Please select a rating.",
    "review.contentMin": "Review must be at least 10 characters.",
    "review.contentMax": "Review must be under 2000 characters.",
    "review.loginPrompt": "Sign in to share your review and build your trust profile.",
    "detail.tierLabels.1": "New User",
    "detail.tierLabels.2": "Regular",
    "detail.tierLabels.3": "Trusted",
    "detail.tierLabels.4": "Expert",
    "detail.tierLabels.5": "Authority",

    // Filters
    "filter.cuisine": "Cuisine",
    "filter.region": "Region",
    "filter.score": "Min Score",
    "filter.all": "All",
    "filter.clear": "Clear Filters",

    // Algorithm banner
    "algo.badge": "How Our Scoring Works",
    "algo.title": "Three Pillars of Trust",
    "algo.verified.title": "Verified Users",
    "algo.verified.desc": "Every reviewer is verified through our trust protocol, ensuring authentic dining experiences.",
    "algo.verified.stat": "fake reviews filtered",
    "algo.expert.title": "Local Food Experts",
    "algo.expert.desc": "Seasoned local reviewers carry up to 5x weight, calibrating scores with real expertise.",
    "algo.expert.stat": "expert weight multiplier",
    "algo.decay.title": "Time Decay Algorithms",
    "algo.decay.desc": "Recent reviews matter more. A great meal last week outweighs a five-star review from 2019.",
    "algo.decay.stat": "decay half-life",

    // Card momentum
    "card.momentum.rising": "Rising",
    "card.momentum.declining": "Declining",
    "card.momentum.stable": "Stable",

    // Expert leaderboard
    "expert.title": "Top Local Experts This Week",
    "expert.subtitle": "Stockholm's most influential food voices",

    // Review mockup
    "mockup.title": "Transparent Reviews",
    "mockup.subtitle": "Every review shows the reviewer's weight and exact timestamp.",
    "mockup.review": "Outstanding tasting menu that evolves with the season. The fermented carrot dish was a revelation — perfectly balanced acidity with umami depth. Service was impeccable, deeply knowledgeable about natural wines.",
    "mockup.highImpact": "High Impact Review",

    // Language
    "lang.switch": "中文",
  },
  cn: {
    "nav.home": "首頁",
    "nav.how": "運作方式",
    "nav.about": "關於",
    "nav.login": "登入",
    "nav.signup": "註冊",

    "hero.title": "找到你可以真正信任的餐廳。",
    "hero.subtitle": "由本地專家加權點評，而非機器人。",
    "hero.search.placeholder": "搜尋餐廳、菜系、街區⋯",
    "hero.cta": "探索全部",
    "hero.powered": "由 Buoyancis 信任協議驅動",

    "card.reviews": "則評論",
    "card.verified": "則已驗證",
    "card.localExpert": "本地專家",
    "card.buoyancisScore": "Buoyancis 評分",
    "card.traditionalScore": "傳統平均分",
    "card.viewDetails": "查看詳情",

    "featured.title": "斯德哥爾摩精選",
    "featured.subtitle": "經本地專家驗證、信任評分最高的餐廳。",

    "how.title": "運作方式",
    "how.step1.title": "只有真實評論",
    "how.step1.desc": "每則評論都根據評論者的驗證歷史、本地專長和一致性進行加權——而非僅依靠星級數量。",
    "how.step2.title": "機器人過濾",
    "how.step2.desc": "我們的協議自動偵測並抑制虛假評論、付費推廣和協調性操縱。",
    "how.step3.title": "時間衰減",
    "how.step3.desc": "近期體驗更重要。上週的一頓好餐比 2019 年的五星評論更有份量。",

    "footer.tagline": "瑞典斯德哥爾摩工程打造。以真理為錨。",
    "footer.privacy": "隱私政策",
    "footer.terms": "服務條款",
    "footer.blog": "部落格",

    "detail.back": "← 返回",
    "detail.allReviews": "所有評論",
    "detail.trustComparison": "信任評分對比",
    "detail.traditional": "傳統平均分",
    "detail.calibrated": "Buoyancis 校準分",
    "detail.inflated": "被傳統平台虛增",
    "detail.reviewerTier": "等級",
    "detail.weight": "權重",
    "detail.verified": "已驗證",
    "detail.localExpert": "本地專家",
    "detail.helpful": "有用",
    "detail.noReviews": "暫無評論。",

    // Review form
    "review.title": "撰寫評論",
    "review.yourRating": "你的評分：",
    "review.placeholder": "分享你在這家餐廳的用餐體驗⋯",
    "review.submit": "提交評論",
    "review.success": "評論提交成功！",
    "review.error": "提交評論失敗，請重試。",
    "review.ratingRequired": "請選擇評分。",
    "review.contentMin": "評論至少需要 10 個字元。",
    "review.contentMax": "評論不得超過 2000 個字元。",
    "review.loginPrompt": "登入以分享你的評論並建立你的信任檔案。",
    "detail.tierLabels.1": "新用戶",
    "detail.tierLabels.2": "常客",
    "detail.tierLabels.3": "受信任",
    "detail.tierLabels.4": "專家",
    "detail.tierLabels.5": "權威",

    // Filters
    "filter.cuisine": "菜系",
    "filter.region": "區域",
    "filter.score": "最低評分",
    "filter.all": "全部",
    "filter.clear": "清除篩選",

    // Algorithm banner
    "algo.badge": "我們的評分方式",
    "algo.title": "信任三大支柱",
    "algo.verified.title": "已驗證用戶",
    "algo.verified.desc": "每位評論者均通過信任協議驗證，確保真實的用餐體驗。",
    "algo.verified.stat": "虛假評論被過濾",
    "algo.expert.title": "本地美食專家",
    "algo.expert.desc": "資深本地評論者權重高達 5 倍，以真實專業校準評分。",
    "algo.expert.stat": "專家權重倍數",
    "algo.decay.title": "時間衰減算法",
    "algo.decay.desc": "近期評論更重要。上週的好餐勝過 2019 年的五星評論。",
    "algo.decay.stat": "衰減半衰期",

    // Card momentum
    "card.momentum.rising": "上升",
    "card.momentum.declining": "下降",
    "card.momentum.stable": "穩定",

    // Expert leaderboard
    "expert.title": "本週頂尖本地專家",
    "expert.subtitle": "斯德哥爾摩最具影響力的美食聲音",

    // Review mockup
    "mockup.title": "透明評論",
    "mockup.subtitle": "每則評論都展示評論者的權重和精確時間戳。",
    "mockup.review": "出色的品嚐菜單隨季節而變化。發酵胡蘿蔔菜是一個啟示——酸度與鮮味深度完美平衡。服務無可挑剔，對天然葡萄酒有深入了解。",
    "mockup.highImpact": "高影響力評論",

    "lang.switch": "EN",
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem("buoyancis-lang");
    if (saved === "en" || saved === "cn") return saved;
    const browserLang = navigator.language || "";
    return browserLang.startsWith("zh") ? "cn" : "en";
  });

  const setLang = (l: Language) => {
    setLangState(l);
    localStorage.setItem("buoyancis-lang", l);
  };

  const t = (key: string) => translations[lang][key] || key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
