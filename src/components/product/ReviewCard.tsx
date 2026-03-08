import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export const RestaurantCard = ({ restaurant, index }: { restaurant: any; index: number }) => {
  const [mass, setMass] = useState(restaurant.initial_gravity_mass);
  const isApex = restaurant.tier === 'Apex';

  useEffect(() => {
    const timer = setInterval(() => {
      setMass(prev => prev + (Math.random() * 0.01 - 0.005));
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      className="relative group p-[1px] rounded-lg overflow-hidden"
    >
      {/* 悬停时的边框流光效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 opacity-40 group-hover:from-amber-500/40 group-hover:to-amber-500/10 transition-all duration-700" />
      
      <div className="relative bg-[#080808] p-6 rounded-lg h-full flex flex-col justify-between backdrop-blur-3xl">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[8px] tracking-[0.4em] text-zinc-600 font-bold uppercase mb-2 block">
              {restaurant.cuisine} // {restaurant.tier}
            </span>
            <h3 className="text-xl font-medium text-zinc-100 tracking-tight leading-none mb-1">
              {restaurant.name}
            </h3>
            <p className="text-zinc-700 text-[10px] tracking-widest uppercase">{restaurant.name_cn}</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-mono font-extralight tracking-tighter ${isApex ? 'text-amber-500' : 'text-zinc-400'}`}>
              {mass.toFixed(2)}
            </div>
          </div>
        </div>

        {/* 财务稳健性微缩图 */}
        <div className="mt-8 pt-6 border-t border-white/5 flex items-end justify-between">
          <div className="space-y-2">
            <div className="text-[7px] text-zinc-800 uppercase tracking-widest font-black">System Solvency</div>
            <div className="flex gap-[2px]">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-3 w-[2px] transition-all duration-700 ${
                    i < (restaurant.solvency * 5) ? 'bg-amber-500/60' : 'bg-zinc-900'
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="text-[9px] font-mono text-zinc-800 tracking-tighter">
            STHLM_{restaurant.id.padStart(3, '0')}
          </div>
        </div>
      </div>
    </motion.div>
  );
};