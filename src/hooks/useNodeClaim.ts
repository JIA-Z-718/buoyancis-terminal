import { useEffect, useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface UseNodeClaimOptions {
  nodeId: string;
  claimantName: string;
  redirectAfterClaim?: string; // Optional redirect path after claiming
}

export const useNodeClaim = ({ nodeId, claimantName, redirectAfterClaim = "/main" }: UseNodeClaimOptions) => {
  const [isTracking, setIsTracking] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);

  // Track page view on mount
  useEffect(() => {
    const trackView = async () => {
      try {
        await supabase.functions.invoke("track-node-claim", {
          body: {
            node_id: nodeId,
            claimant_name: claimantName,
            action: "VIEW"
          }
        });
      } catch (error) {
        console.error("Failed to track view:", error);
      }
    };

    trackView();
  }, [nodeId, claimantName]);

  // Fire rose gold confetti
  const fireConfetti = useCallback(() => {
    const roseGoldColors = ["#d4af37", "#f5d998", "#c9a227", "#e8c872", "#ffeaa7"];
    
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      colors: roseGoldColors,
      shapes: ["star", "circle"] as confetti.Shape[],
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  // Claim node
  const claimNode = useCallback(async () => {
    if (isTracking || hasClaimed) return;
    
    setIsTracking(true);
    try {
      const { error } = await supabase.functions.invoke("track-node-claim", {
        body: {
          node_id: nodeId,
          claimant_name: claimantName,
          action: "CLAIM"
        }
      });

      if (error) throw error;

      setHasClaimed(true);
      fireConfetti();
      
      toast.success("Handshake Protocol Initiated", {
        description: "Signal Received. Welcome to the Genesis Network.",
      });

      // Redirect to main protocol interface after successful claim
      // Use window.location.assign for Genesis Gateway (no React Router context)
      setTimeout(() => {
        window.location.assign(redirectAfterClaim);
      }, 2500); // Allow time for confetti and toast to be enjoyed
    } catch (error) {
      console.error("Failed to claim node:", error);
      toast.error("Signal Interference", {
        description: "Failed to establish handshake. Please try again.",
      });
    } finally {
      setIsTracking(false);
    }
  }, [nodeId, claimantName, isTracking, hasClaimed, fireConfetti, redirectAfterClaim]);

  // Reject node
  const rejectNode = useCallback(async () => {
    if (isTracking) return;
    
    setIsTracking(true);
    try {
      await supabase.functions.invoke("track-node-claim", {
        body: {
          node_id: nodeId,
          claimant_name: claimantName,
          action: "REJECT"
        }
      });

      toast("Signal Terminated", {
        description: "The node remains available. The door is always open.",
      });
    } catch (error) {
      console.error("Failed to track rejection:", error);
    } finally {
      setIsTracking(false);
    }
  }, [nodeId, claimantName, isTracking]);

  return {
    claimNode,
    rejectNode,
    isTracking,
    hasClaimed
  };
};
