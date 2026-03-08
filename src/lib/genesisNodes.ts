// Shared utility functions for Genesis node access management

const UNLOCKED_NODES_KEY = "genesis_unlocked_nodes";

export const isGenesisSubdomain = (): boolean => {
  try {
    return window.location.hostname.startsWith("genesis.");
  } catch {
    return false;
  }
};

export const getUnlockedNodes = (): string[] => {
  try {
    const stored = localStorage.getItem(UNLOCKED_NODES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

export const saveUnlockedNode = (nodeId: string): void => {
  try {
    const current = getUnlockedNodes();
    if (!current.includes(nodeId)) {
      localStorage.setItem(UNLOCKED_NODES_KEY, JSON.stringify([...current, nodeId]));
    }
  } catch {
    // Ignore storage errors
  }
};
