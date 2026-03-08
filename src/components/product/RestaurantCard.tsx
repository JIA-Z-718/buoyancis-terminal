import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const RestaurantCard = ({ restaurant, index }: { restaurant: any; index: number }) => {
  const [mass, setMass] = useState(restaurant.initial_gravity_mass);
  const isApex = restaurant.tier === 'Apex';

  useEffect(() => {
    const timer = setInterval(() => {
      setMass(prev => prev + (Math.random() * 0.01 - 0.005));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: index * 0.05 }} className="relative group p-[1px] rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all duration-500">
      <div className="relative bg-[#080808] p-6 rounded-lg h-full flex flex-col justify-between border border-white/5 group-hover:border-amber-500/30 transition-colors">
        <div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[7px] tracking-[0.4em] text-zinc-600 font-black uppercase italic">Audit_Node_0{restaurant.id}</span>
            <div className={`text-xl font-mono tracking-tighter ${isApex ? 'text-amber-500' : 'text-zinc-500'}`}>
              {mass.toFixed(2)}
            </div>
          </div>
          <h3 className="text-lg font-bold text-zinc-100 mb-1">{restaurant.name}</h3>
          <p className="text-zinc-700 text-[9px] tracking-widest uppercase">{restaurant.name_cn}</p>
        </div>

        <div className="mt-12 pt-4 border-t border-white/5 flex items-end justify-between">
          <div className="space-y-1.5">
            <div className="text-[6px] text-zinc-800 uppercase tracking-widest font-black">Financial_Solvency</div>
            <div className="flex gap-[1px]">
              {[...Array(5)].map((_, i) => (
                <div key={i} className={`h-2.5 w-[1px] ${i < (restaurant.solvency * 5) ? 'bg-amber-600' : 'bg-zinc-900'}`} />
              ))}
            </div>
          </div>
          <span className="text-[8px] text-zinc-800 font-mono tracking-tighter uppercase">{restaurant.cuisine}</span>
        </div>
      </div>
    </motion.div>
  );
};