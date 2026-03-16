import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ashklwdilmknamwcosvc.supabase.co';
const supabaseAnonKey = 'sb_publishable_qr0CFI-g9AENJnuiCAZtvw_kLckW9hr';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const PublicSubmitModal = ({ onClose }: { onClose: () => void }) => {
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    restaurantId: "",
    reviewerName: "",
    score: 80
  });

  useEffect(() => {
    const fetchRestaurants = async () => {
      const { data } = await supabase.from('restaurants').select('id, name').order('name');
      if (data) setRestaurants(data);
    };
    fetchRestaurants();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // 🔴 核心邏輯：強制將普通大眾的 trust_weight 鎖死在 1.0
    const { error } = await supabase.from('reviews').insert([
      {
        restaurant_id: formData.restaurantId,
        reviewer_name: formData.reviewerName || "Anonymous Critic",
        score: Number(formData.score),
        trust_weight: 1.0 
      }
    ]);

    if (!error) {
      alert("Evaluation Accepted. The Sovereign Algorithm has assigned your input a gravity weight of 1.0. System calibrating...");
      window.location.reload(); // 重新整理以觸發主權算法重新計算
    }
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="bg-black border border-[#d4af37]/30 p-8 rounded-2xl max-w-md w-full relative shadow-[0_0_50px_rgba(212,175,55,0.15)]">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-[#d4af37]">
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-[#d4af37] font-mono tracking-[0.3em] uppercase text-xl mb-6">Submit Evaluation</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-2">Select Establishment</label>
            <select 
              required
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-[#d4af37]/50 outline-none"
              onChange={(e) => setFormData({...formData, restaurantId: e.target.value})}
            >
              <option value="">Select a restaurant...</option>
              {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-2">Reviewer Identity</label>
            <input 
              type="text"
              placeholder="Your Name"
              className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white focus:border-[#d4af37]/50 outline-none"
              onChange={(e) => setFormData({...formData, reviewerName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-[10px] text-white/40 uppercase tracking-widest mb-2">Score (0-100): {formData.score}</label>
            <input 
              type="range" min="0" max="100" value={formData.score}
              className="w-full accent-[#d4af37]"
              onChange={(e) => setFormData({...formData, score: parseInt(e.target.value)})}
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-[#d4af37] text-black font-bold py-4 rounded-lg hover:bg-[#b8962d] transition-colors flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "TRANSMIT DATA"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicSubmitModal;