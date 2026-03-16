import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";

const TrustCurveChart = ({ restaurantId }: { restaurantId: number }) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      // 獲取歷史評分
      const { data: reviews } = await supabase
        .from("reviews")
        .select("score, created_at")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: true });

      if (reviews) {
        // 計算累積加權平均（簡化版：按時間點顯示分數波動）
        const chartData = reviews.map((r, index) => ({
          name: new Date(r.created_at).toLocaleDateString(),
          score: r.score,
        }));
        setData(chartData);
      }
    };
    fetchData();
  }, [restaurantId]);

  if (data.length === 0) return <div className="text-white/20 text-xs p-4">Initializing Neural Link...</div>;

  return (
    <div className="h-40 w-full mt-4 bg-black/40 rounded-lg p-2 border border-[#d4af37]/10">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line 
            type="monotone" 
            dataKey="score" 
            stroke="#d4af37" 
            strokeWidth={2} 
            dot={{ fill: '#d4af37', r: 2 }} 
            animationDuration={2000}
          />
          <YAxis domain={[0, 100]} hide />
          <XAxis dataKey="name" hide />
          <Tooltip 
            contentStyle={{ backgroundColor: '#000', border: '1px solid #d4af37', fontSize: '10px' }}
            itemStyle={{ color: '#d4af37' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrustCurveChart;