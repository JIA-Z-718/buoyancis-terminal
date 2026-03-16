import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Terminal, ShieldCheck, Trash2, History, Lock } from "lucide-react";

const SovereignControl = () => {
  // 🔒 身份验证状态
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [authError, setAuthError] = useState("");

  // 🎛️ 控制台状态 (适配百分制)
  const [restaurantId, setRestaurantId] = useState("1");
  const [score, setScore] = useState("99"); // 百分制默认高分
  const [weight, setWeight] = useState("9.9");
  const [reviewer, setReviewer] = useState("Jia Zhang");
  const [status, setStatus] = useState("");
  const [recentReviews, setRecentReviews] = useState<any[]>([]);

  // 获​​取最近操作纪录
  const fetchRecent = async () => {
    const { data } = await supabase
      .from("reviews")
      .select("*, restaurants(name)")
      .order("created_at", { ascending: false })
      .limit(5);
    if (data) setRecentReviews(data);
  };

  useEffect(() => { 
    if (isUnlocked) fetchRecent(); 
  }, [isUnlocked]);

  // 🔒 解锁逻辑
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // 你的专属密码：2036
    if (passcode === "2036") {
      setIsUnlocked(true);
      setAuthError("");
    } else {
      setAuthError("AUTHORIZATION FAILED. INVALID SIGNATURE.");
      setPasscode("");
    }
  };

  const handleUpdate = async () => {
    setStatus("Executing Protocol...");
    await supabase.from("reviews").insert([
      { 
        restaurant_id: parseInt(restaurantId), 
        reviewer_name: reviewer, 
        score: parseFloat(score), 
        trust_weight: parseFloat(weight) 
      }
    ]);
    setStatus("Success.");
    fetchRecent();
    setTimeout(() => window.location.reload(), 1000);
  };

  const handleRevoke = async (id: number) => {
    setStatus("Revoking Authority...");
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (!error) {
      await fetchRecent();
      setStatus("Action Revoked. System Calibrating...");
      setTimeout(() => {
        window.location.href = window.location.origin + '/sovereign-node';
      }, 1500);
    }
  };

  // 🛑 未解锁时的 UI (黑金数字锁)
  if (!isUnlocked) {
    return (
      <div className="mt-20 p-8 bg-black border border-[#d4af37]/30 rounded-2xl max-w-md mx-auto shadow-[0_0_50px_rgba(212,175,55,0.1)] text-center">
        <Lock className="w-8 h-8 text-[#d4af37] mx-auto mb-4 opacity-80" />
        <h2 className="text-[#d4af37] font-mono tracking-[0.2em] text-lg uppercase mb-2">Sovereign Access</h2>
        <p className="text-white/50 text-[10px] mb-6 tracking-widest uppercase">Restricted Command Node</p>
        
        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="ENTER PROTOCOL PIN"
            className="w-full bg-black border border-[#d4af37]/20 p-3 text-center text-[#d4af37] tracking-[0.5em] focus:border-[#d4af37] outline-none transition-all placeholder:tracking-widest placeholder:text-[10px]"
          />
          <button type="submit" className="w-full bg-[#d4af37] text-black font-bold py-3 rounded hover:bg-[#b8962d] transition-colors text-xs tracking-[0.2em] uppercase">
            Verify Identity
          </button>
        </form>
        {authError && <p className="text-red-500 text-xs mt-4 font-mono animate-pulse">{authError}</p>}
      </div>
    );
  }

  // ✅ 解锁后的 UI (原控制台)
  return (
    <div className="mt-20 p-8 bg-black border border-[#d4af37]/30 rounded-2xl max-w-2xl mx-auto shadow-[0_0_50px_rgba(212,175,55,0.1)] transition-all duration-500 animate-in fade-in zoom-in-95">
      <div className="flex items-center gap-3 mb-8 border-b border-[#d4af37]/20 pb-4">
        <Terminal className="text-[#d4af37] w-6 h-6" />
        <h2 className="text-[#d4af37] font-mono tracking-[0.2em] text-lg uppercase">Sovereign Control</h2>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <input type="number" placeholder="ID" value={restaurantId} onChange={(e)=>setRestaurantId(e.target.value)} className="bg-black border border-[#d4af37]/20 p-3 text-white" />
          <input type="number" placeholder="Weight (Max 9.9)" value={weight} onChange={(e)=>setWeight(e.target.value)} className="bg-black border border-[#d4af37]/20 p-3 text-[#d4af37]" />
        </div>
        <input type="number" step="1" max="100" placeholder="Target Score (0-100)" value={score} onChange={(e)=>setScore(e.target.value)} className="w-full bg-black border border-[#d4af37]/20 p-3 text-white" />
        <input type="text" placeholder="Authority Signature" value={reviewer} onChange={(e)=>setReviewer(e.target.value)} className="w-full bg-black border border-[#d4af37]/20 p-3 text-white italic" />
        
        <button onClick={handleUpdate} className="w-full bg-[#d4af37] text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 hover:opacity-90">
          <ShieldCheck className="w-5 h-5" /> AUTHORIZE UPDATE
        </button>

        {status && <div className="text-[#d4af37] text-xs font-mono text-center animate-pulse">{status}</div>}

        <div className="mt-8 pt-6 border-t border-[#d4af37]/10">
          <div className="flex items-center gap-2 mb-4 text-[#d4af37]/60 text-[10px] tracking-widest uppercase">
            <History className="w-3 h-3" /> Recent Authority Log
          </div>
          <div className="space-y-3">
            {recentReviews.map((rev) => (
              <div key={rev.id} className="flex justify-between items-center bg-white/5 p-3 rounded border border-white/5">
                <div className="text-xs">
                  <span className="text-[#d4af37] font-bold">{rev.restaurants?.name}</span>
                  <span className="text-white/40 mx-2">by</span>
                  <span className="text-white/80">{rev.reviewer_name}</span>
                  <span className="ml-3 px-2 py-0.5 bg-[#d4af37]/20 text-[#d4af37] rounded">{rev.score}</span>
                </div>
                <button onClick={() => handleRevoke(rev.id)} className="text-red-400 hover:text-red-500 transition-colors p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SovereignControl;