import React from "react";
import { Navigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { getUnlockedNodes } from "@/lib/genesisNodes";

/** Shared loading screen for Genesis auth flows */
export const GenesisLoadingScreen = () => (
  <div
    className="fixed inset-0 bg-black flex items-center justify-center font-mono"
    style={{ minHeight: "100dvh" }}
  >
    <motion.div
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="text-slate-500 text-xs tracking-[0.3em]"
      style={{ fontFamily: "'Fira Code', monospace" }}
    >
      INITIALIZING SYSTEM...
    </motion.div>
  </div>
);

/** Requires authenticated user; redirects to Genesis login otherwise */
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <GenesisLoadingScreen />;
  if (!user) return <Navigate to="/genesis/login" replace />;

  return <>{children}</>;
};

/** Allows access if user is logged in OR has previously unlocked the node */
export const NodeRoute = ({
  children,
  nodeId,
}: {
  children: React.ReactNode;
  nodeId: string;
}) => {
  const { user, isLoading } = useAuth();

  const isUnlocked = React.useMemo(() => {
    return getUnlockedNodes().includes(nodeId);
  }, [nodeId]);

  if (isLoading) return <GenesisLoadingScreen />;
  if (!user && !isUnlocked) return <Navigate to="/genesis/login" replace />;

  return <>{children}</>;
};
