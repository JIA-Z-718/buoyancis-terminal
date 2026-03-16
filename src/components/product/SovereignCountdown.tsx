import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

const SovereignCountdown = () => {
  const { language } = useLanguage();
  // 目標日期：2036年1月1日 00:00:00
  const targetDate = new Date("2036-01-01T00:00:00").getTime();
  
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="py-20 px-6 bg-[#080a08] border-y border-[#d4af37]/10 relative overflow-hidden">
      {/* 背景裝飾：10億克朗水印 */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
        <span className="text-[20vw] font-bold text-[#d4af37]">1B SEK</span>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <h2 className="text-[#d4af37] text-sm tracking-[0.4em] uppercase mb-12 font-medium">
          {language === 'zh' ? "距離 10 億克朗願景達成" : "COUNTDOWN TO 1,000,000,000 SEK"}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
          {[
            { label: language === 'zh' ? "天" : "DAYS", value: timeLeft.days },
            { label: language === 'zh' ? "時" : "HOURS", value: timeLeft.hours },
            { label: language === 'zh' ? "分" : "MINS", value: timeLeft.minutes },
            { label: language === 'zh' ? "秒" : "SECS", value: timeLeft.seconds }
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-5xl md:text-7xl font-light text-white tabular-nums tracking-tighter">
                {String(item.value).padStart(2, '0')}
              </span>
              <span className="text-[10px] text-[#d4af37]/60 tracking-[0.2em] mt-4 uppercase">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-16 text-[#d4af37]/40 text-xs italic tracking-widest font-serif">
          {language === 'zh' 
            ? "“不急，到那時我也才 40 歲，依然年輕。”" 
            : "“No rush. I'll be 40 then, still young.”"}
        </p>
      </div>
    </section>
  );
};

export default SovereignCountdown;