import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform, AnimatePresence, useSpring } from 'framer-motion';
import { Shield, Activity, Fingerprint, X, Cloud, Globe, Lock, ChevronRight } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// --- DATABASE CONFIGURATION ---
const supabaseUrl = 'https://ashklwdilmknamwcosvc.supabase.co'; // ⚠️ 請確保這裡填寫正確
const supabaseAnonKey = 'sb_publishable_qr0CFI-g9AENJnuiCAZtvw_kLckW9hr';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SAGES = ["Laozi", "Confucius", "Li Ka-shing", "Einstein", "Xi Jinping"];

const RESTAURANTS = [
  { id: 1, name: "Frantzén", score: "9.8", type: "3 Michelin Stars // 3 Michelinstjärnor" },
  { id: 2, name: "AIRA", score: "9.6", type: "2 Michelin Stars // 2 Michelinstjärnor" },
  { id: 3, name: "Seafood Gastro", score: "9.4", type: "Premium Seafood // Premiumfisk" },
  { id: 4, name: "Operakällaren", score: "9.3", type: "Royal Classic // Kunglig Klassiker" },
  { id: 5, name: "Ekstedt", score: "9.1", type: "Wood-Fired // Vedeldat" },
  { id: 6, name: "Aloë", score: "8.9", type: "Modern Innovation // Modern Innovation" },
  { id: 7, name: "Lilla Ego", score: "8.8", type: "Local Favorite // Lokal Favorit" },
  { id: 8, name: "Etoile", score: "8.7", type: "Avant-Garde // Avantgarde" },
  { id: 9, name: "Nour", score: "8.6", type: "Nordic Fusion // Nordisk Fusion" },
  { id: 10, name: "Adam/Albin", score: "8.5", type: "Ultimate Experience // Ultimat Upplevelse" }
];

export default function App() {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isBooting, setIsBooting] = useState(true);
  const [isRegistered, setIsRegistered] = useState(false);
  const [email, setEmail] = useState("");
  const [weather, setWeather] = useState("2°C");
  const [forex, setForex] = useState("0.682");
  
  const mouseX = useSpring(0, { stiffness: 50, damping: 20 });
  const mouseY = useSpring(0, { stiffness: 50, damping: 20 });

  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (e.beta && e.gamma) {
        mouseX.set(e.gamma * 1.5); 
        mouseY.set(e.beta * 1.5);  
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }

    const timer = setTimeout(() => setIsBooting(false), 2200);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [mouseX, mouseY]);

  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== 'undefined' && window.navigator.vibrate) {
      window.navigator.vibrate(pattern);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) {
      try {
        const { error } = await supabase.from('registrations').insert([{ email }]);
        if (!error) {
          triggerHaptic([30, 50, 30]);
          setIsRegistered(true);
        } else {
          console.error("Database Error:", error.message);
          alert("Connection Error // Anslutningsfel");
        }
      } catch (err) {
        console.error("System Error:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#080a08] text-gray-300 font-sans overflow-hidden flex flex-col relative">
      <style>{`
        html, body { background-color: #080a08; overscroll-behavior-y: none; }
        ::-webkit-scrollbar { display: none; }
        .sage-text { writing-mode: vertical-rl; text-orientation: upright; }
      `}</style>

      {/* Booting */}
      <AnimatePresence>
        {isBooting && (
          <motion.div exit={{ opacity: 0, scale: 1.5, filter: "blur(20px)" }} className="fixed inset-0 z-[100] bg-[#080a08] flex flex-col items-center justify-center">
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
              <Fingerprint className="text-[#d4af37]" size={60} />
            </motion.div>
            <p className="text-[#d4af37] font-mono text-[10px] mt-8 tracking-[0.6em] uppercase">System Ignition // Systemstart</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Registration */}
      <AnimatePresence>
        {!isBooting && !isRegistered && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 bg-[#080a08] flex items-center justify-center p-6">
            <div className="max-w-sm w-full border border-white/10 p-8 rounded-2xl bg-[#101410]">
              <Lock className="text-[#d4af37] mx-auto mb-6" size={32} />
              <h2 className="text-2xl font-light text-white text-center tracking-widest mb-2">ACCESS REQUIRED</h2>
              <p className="text-center text-[#d4af37]/60 font-mono text-[10px] tracking-[0.2em] mb-8">BEHÖRIGHET KRÄVS</p>
              <form onSubmit={handleRegister} className="space-y-6">
                <input 
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email // E-post" 
                  className="w-full bg-transparent border-b border-white/20 pb-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#d4af37] font-mono text-xs tracking-widest"
                />
                <button type="submit" className="w-full flex items-center justify-center gap-2 bg-[#d4af37] text-black py-3 rounded-sm font-bold tracking-widest text-xs uppercase">
                  Initialize <ChevronRight size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Sages */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {SAGES.map((sage, i) => {
          const isSelected = selectedId !== null;
          return (
            <motion.div
              key={i}
              animate={{
                x: isSelected ? (Math.cos((i * 72 - 90) * (Math.PI / 180)) * 180) : mouseX.get() * (i * 0.2 + 0.5),
                y: isSelected ? (Math.sin((i * 72 - 90) * (Math.PI / 180)) * 180) : mouseY.get() * (i * 0.2 + 0.5),
                left: isSelected ? "50%" : `${15 + (i * 18)}%`,
                top: isSelected ? "40%" : "25%",
                opacity: isSelected ? 0.8 : 0.05,
                scale: isSelected ? 1.3 : 1,
                rotate: isSelected ? 720 : 0
              }}
              className="absolute sage-text font-serif text-4xl tracking-[0.6em] text-[#d4af37]"
            >
              {sage}
            </motion.div>
          );
        })}
      </div>

      {/* Main UI */}
      {isRegistered && (
        <>
          <header className="relative z-20 pt-10 pb-4 px-6 bg-[#080a08]/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-md mx-auto flex justify-between items-center text-[10px] font-mono tracking-widest text-gray-500 uppercase">
              <div>STHLM: {weather}</div>
              <div className="text-white font-bold tracking-[0.8em]">BUOYANCIS</div>
              <div>FX: {forex}</div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto z-10 px-6 pt-6 pb-24">
            <div className="max-w-md mx-auto space-y-3">
              {RESTAURANTS.map((res) => (
                <div key={res.id} onClick={() => { setSelectedId(res.id); triggerHaptic(40); }} className="p-5 rounded-xl border border-white/5 bg-white/[0.02] flex justify-between items-center cursor-pointer">
                  <div>
                    <span className="text-white/90 text-sm block">{res.name}</span>
                    <span className="text-[#d4af37]/50 text-[9px] tracking-[0.2em] uppercase mt-1 block">{res.type}</span>
                  </div>
                  <span className="text-[#d4af37] text-lg font-mono">{res.score}</span>
                </div>
              ))}
            </div>
          </main>
        </>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedId !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-[#080a08]/98 flex items-center justify-center p-8 backdrop-blur-md">
            <div className="max-w-md w-full relative">
              <button onClick={() => setSelectedId(null)} className="absolute -top-16 right-0 text-[#d4af37] border border-[#d4af37]/30 p-2 rounded-full"><X size={18} /></button>
              <p className="text-[#d4af37] font-mono text-[10px] mb-3 tracking-[0.4em]">TARGET SECURED // MÅL SÄKRAT</p>
              <h3 className="text-4xl font-light text-white mb-8">{RESTAURANTS.find(r => r.id === selectedId)?.name}</h3>
              <div className="space-y-5 font-mono text-[11px] text-[#d4af37]/70 tracking-[0.2em] border-t border-white/10 pt-8 uppercase">
                <div className="flex justify-between"><span>INDEX SCORE</span><span>{RESTAURANTS.find(r => r.id === selectedId)?.score}</span></div>
                <p>COORD: 59°20'N 18°04'E (STOCKHOLM GRID)</p>
                <div className="border-t border-[#d4af37]/20 pt-5 mt-5">
                  <p className="text-white">ULTIMATE GOAL: 1,000,000,000 SEK SOVEREIGNTY // 1 MILJARD SEK</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}