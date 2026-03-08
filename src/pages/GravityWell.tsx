import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Terminal, Eye, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface NodeClaim {
  id: string;
  node_id: string;
  claimant_name: string;
  ip_address: string | null;
  user_agent: string | null;
  status: "VIEWED" | "CLAIMED" | "REJECTED";
  claimed_at: string;
  updated_at: string;
}

const GravityWell = () => {
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [claims, setClaims] = useState<NodeClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Gravity Well | Node Claims Monitor";
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      navigate("/auth/login");
    }
  }, [user, isAdmin, authLoading, navigate]);

  const fetchClaims = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from("node_claims")
        .select("*")
        .order("claimed_at", { ascending: false });

      if (fetchError) throw fetchError;
      
      // Type assertion since we know the structure
      setClaims((data as unknown as NodeClaim[]) || []);
    } catch (err: any) {
      console.error("Error fetching claims:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && isAdmin) {
      fetchClaims();
      
      // Set up realtime subscription
      const channel = supabase
        .channel("node_claims_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "node_claims"
          },
          () => {
            fetchClaims();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isAdmin]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "CLAIMED":
        return "text-emerald-400";
      case "VIEWED":
        return "text-yellow-400";
      case "REJECTED":
        return "text-red-400";
      default:
        return "text-white/60";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "CLAIMED":
        return <CheckCircle className="w-4 h-4" />;
      case "VIEWED":
        return <Eye className="w-4 h-4" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-emerald-400 font-mono animate-pulse">AUTHENTICATING...</div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      {/* Scanline overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]"
        style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,0,0.1) 2px, rgba(0,255,0,0.1) 4px)`
        }}
      />
      
      <div className="container max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Terminal className="w-8 h-8 text-emerald-400" />
            <div>
              <h1 className="text-2xl font-bold text-emerald-400">GRAVITY WELL</h1>
              <p className="text-white/40 text-sm">Node Claims Monitoring System</p>
            </div>
          </div>
          
          <button
            onClick={fetchClaims}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            REFRESH
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="border border-emerald-500/30 bg-emerald-500/5 p-4">
            <div className="text-emerald-400 text-3xl font-bold">
              {claims.filter(c => c.status === "CLAIMED").length}
            </div>
            <div className="text-white/40 text-sm">CLAIMED</div>
          </div>
          <div className="border border-yellow-500/30 bg-yellow-500/5 p-4">
            <div className="text-yellow-400 text-3xl font-bold">
              {claims.filter(c => c.status === "VIEWED").length}
            </div>
            <div className="text-white/40 text-sm">VIEWED</div>
          </div>
          <div className="border border-red-500/30 bg-red-500/5 p-4">
            <div className="text-red-400 text-3xl font-bold">
              {claims.filter(c => c.status === "REJECTED").length}
            </div>
            <div className="text-white/40 text-sm">REJECTED</div>
          </div>
        </div>

        {/* Terminal Feed */}
        <div className="border border-emerald-500/30 bg-black">
          <div className="border-b border-emerald-500/30 px-4 py-2 flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-sm">LIVE FEED</span>
          </div>
          
          <div className="p-4 max-h-[600px] overflow-y-auto">
            {error && (
              <div className="text-red-400 mb-4">ERROR: {error}</div>
            )}
            
            {loading && claims.length === 0 ? (
              <div className="text-emerald-400 animate-pulse">LOADING SIGNAL DATA...</div>
            ) : claims.length === 0 ? (
              <div className="text-white/40">NO SIGNALS DETECTED</div>
            ) : (
              <div className="space-y-2">
                {claims.map((claim, index) => (
                  <div 
                    key={claim.id}
                    className={`flex items-start gap-4 p-3 border-l-2 ${
                      claim.status === "CLAIMED" 
                        ? "border-emerald-500 bg-emerald-500/5" 
                        : claim.status === "REJECTED"
                        ? "border-red-500 bg-red-500/5"
                        : "border-yellow-500 bg-yellow-500/5"
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className={getStatusColor(claim.status)}>
                      {getStatusIcon(claim.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-bold">{claim.claimant_name}</span>
                        <span className="text-white/40">→</span>
                        <span className="text-[#d4af37]">NODE #{claim.node_id}</span>
                        <span className={`px-2 py-0.5 text-xs ${getStatusColor(claim.status)} border ${
                          claim.status === "CLAIMED" 
                            ? "border-emerald-500/50" 
                            : claim.status === "REJECTED"
                            ? "border-red-500/50"
                            : "border-yellow-500/50"
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                      
                      <div className="text-white/30 text-xs mt-1 flex items-center gap-4 flex-wrap">
                        <span>{format(new Date(claim.claimed_at), "yyyy-MM-dd HH:mm:ss")}</span>
                        {claim.ip_address && (
                          <span>IP: {claim.ip_address}</span>
                        )}
                      </div>
                      
                      {claim.user_agent && (
                        <div className="text-white/20 text-xs mt-1 truncate max-w-md">
                          {claim.user_agent}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <div className="text-white/20 text-xs font-mono">
            BUOYANCIS PROTOCOL // GRAVITY WELL v1.0 // CLASSIFIED
          </div>
        </div>
      </div>
    </div>
  );
};

export default GravityWell;
