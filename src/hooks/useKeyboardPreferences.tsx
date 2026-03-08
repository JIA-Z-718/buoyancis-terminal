import { useState, useEffect, useCallback, createContext, useContext, ReactNode, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface ShortcutDefinition {
  id: string;
  label: string;
  description: string;
  defaultKeys: string[];
  category: string;
}

export interface ShortcutMapping {
  [id: string]: string[];
}

interface KeyboardPreferencesContextType {
  shortcuts: ShortcutMapping;
  defaultShortcuts: ShortcutDefinition[];
  updateShortcut: (id: string, keys: string[]) => void;
  resetShortcut: (id: string) => void;
  resetAllShortcuts: () => void;
  getShortcutKeys: (id: string) => string[];
  isRecording: string | null;
  setIsRecording: (id: string | null) => void;
  hasConflict: (id: string, keys: string[]) => string | null;
  exportPreferences: () => string;
  importPreferences: (jsonString: string) => { success: boolean; error?: string };
  previewImport: (jsonString: string) => ImportPreviewResult;
  isSyncing: boolean;
  syncStatus: "idle" | "syncing" | "synced" | "error";
  lastSyncedAt: Date | null;
  syncHistory: SyncHistoryEntry[];
  forceSyncNow: () => Promise<boolean>;
  nextAutoSyncAt: Date | null;
  hasUnsyncedChanges: boolean;
  clearSyncHistory: () => void;
}

export interface SyncHistoryEntry {
  timestamp: Date;
  success: boolean;
  type: "auto" | "manual";
}

export interface ImportPreviewChange {
  id: string;
  label: string;
  category: string;
  currentKeys: string[];
  newKeys: string[];
  changeType: "modified" | "unchanged" | "added" | "removed";
}

export interface ImportPreviewResult {
  valid: boolean;
  error?: string;
  changes: ImportPreviewChange[];
  totalChanges: number;
  exportedAt?: string;
  version?: number;
}

const STORAGE_KEY = "keyboard-shortcuts-preferences";
const SYNC_HISTORY_STORAGE_KEY = "keyboard-shortcuts-sync-history";

// Default shortcut definitions for the admin dashboard
export const DEFAULT_ADMIN_SHORTCUTS: ShortcutDefinition[] = [
  // General
  { id: "refresh", label: "Refresh", description: "Refresh data", defaultKeys: ["r"], category: "General" },
  { id: "export", label: "Export", description: "Export to CSV", defaultKeys: ["e"], category: "General" },
  { id: "signout", label: "Sign Out", description: "Sign out of admin", defaultKeys: ["Escape"], category: "General" },
  { id: "help", label: "Help", description: "Show keyboard shortcuts", defaultKeys: ["?"], category: "General" },
  { id: "toggleSidebar", label: "Toggle Sidebar", description: "Show/hide sidebar", defaultKeys: ["Ctrl", "b"], category: "General" },
  
  // Quick Jump (number keys)
  { id: "jump1", label: "Jump to 1", description: "Go to Signups", defaultKeys: ["1"], category: "Quick Jump" },
  { id: "jump2", label: "Jump to 2", description: "Go to Cron Jobs", defaultKeys: ["2"], category: "Quick Jump" },
  { id: "jump3", label: "Jump to 3", description: "Go to Deliverability", defaultKeys: ["3"], category: "Quick Jump" },
  { id: "jump4", label: "Jump to 4", description: "Go to Bot Detection", defaultKeys: ["4"], category: "Quick Jump" },
  { id: "jump5", label: "Jump to 5", description: "Go to Email Campaigns", defaultKeys: ["5"], category: "Quick Jump" },
  { id: "jump6", label: "Jump to 6", description: "Go to Templates", defaultKeys: ["6"], category: "Quick Jump" },
  { id: "jump7", label: "Jump to 7", description: "Go to User Roles", defaultKeys: ["7"], category: "Quick Jump" },
  { id: "jump8", label: "Jump to 8", description: "Go to Data Retention", defaultKeys: ["8"], category: "Quick Jump" },
  { id: "jump9", label: "Jump to 9", description: "Go to Notifications", defaultKeys: ["9"], category: "Quick Jump" },
  
  // Navigation (G + key)
  { id: "navSignups", label: "Go to Signups", description: "Navigate to Signups", defaultKeys: ["g", "s"], category: "Navigation" },
  { id: "navCron", label: "Go to Cron", description: "Navigate to Cron Jobs", defaultKeys: ["g", "c"], category: "Navigation" },
  { id: "navDeliverability", label: "Go to Deliverability", description: "Navigate to Deliverability", defaultKeys: ["g", "d"], category: "Navigation" },
  { id: "navBots", label: "Go to Bots", description: "Navigate to Bot Detection", defaultKeys: ["g", "b"], category: "Navigation" },
  { id: "navEmail", label: "Go to Email", description: "Navigate to Email Campaigns", defaultKeys: ["g", "e"], category: "Navigation" },
  { id: "navTemplates", label: "Go to Templates", description: "Navigate to Templates", defaultKeys: ["g", "t"], category: "Navigation" },
  { id: "navUsers", label: "Go to Users", description: "Navigate to User Roles", defaultKeys: ["g", "u"], category: "Navigation" },
  { id: "navRetention", label: "Go to Retention", description: "Navigate to Data Retention", defaultKeys: ["g", "r"], category: "Navigation" },
  { id: "navNotifications", label: "Go to Notifications", description: "Navigate to Notifications", defaultKeys: ["g", "n"], category: "Navigation" },
  { id: "navSecurity", label: "Go to Security", description: "Navigate to Security", defaultKeys: ["g", "h"], category: "Navigation" },
];

const KeyboardPreferencesContext = createContext<KeyboardPreferencesContextType | null>(null);

function buildDefaultMapping(definitions: ShortcutDefinition[]): ShortcutMapping {
  return definitions.reduce((acc, def) => {
    acc[def.id] = def.defaultKeys;
    return acc;
  }, {} as ShortcutMapping);
}

export function KeyboardPreferencesProvider({ 
  children, 
  definitions = DEFAULT_ADMIN_SHORTCUTS 
}: { 
  children: ReactNode;
  definitions?: ShortcutDefinition[];
}) {
  const { user } = useAuth();
  const [shortcuts, setShortcuts] = useState<ShortcutMapping>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge with defaults to handle new shortcuts
        const defaults = buildDefaultMapping(definitions);
        return { ...defaults, ...parsed };
      }
    } catch {
      // Ignore parse errors
    }
    return buildDefaultMapping(definitions);
  });
  
  const [isRecording, setIsRecording] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "synced" | "error">("idle");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(() => {
    try {
      const stored = localStorage.getItem(SYNC_HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.lastSyncedAt) {
          return new Date(parsed.lastSyncedAt);
        }
      }
    } catch {
      // Ignore parse errors
    }
    return null;
  });
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>(() => {
    try {
      const stored = localStorage.getItem(SYNC_HISTORY_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.history && Array.isArray(parsed.history)) {
          return parsed.history.map((entry: { timestamp: string; success: boolean; type: "auto" | "manual" }) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
        }
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });
  const [nextAutoSyncAt, setNextAutoSyncAt] = useState<Date | null>(null);
  const initialLoadDone = useRef(false);
  const lastSyncedShortcuts = useRef<string | null>(null);
  const syncedTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoSyncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-sync interval: 5 minutes
  const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;

  const addSyncHistoryEntry = useCallback((success: boolean, type: "auto" | "manual") => {
    const entry: SyncHistoryEntry = { timestamp: new Date(), success, type };
    setSyncHistory(prev => [entry, ...prev].slice(0, 10)); // Keep last 10 entries
    if (success) {
      setLastSyncedAt(new Date());
    }
  }, []);

  // Persist sync history to localStorage
  useEffect(() => {
    const data = {
      history: syncHistory.map(entry => ({
        ...entry,
        timestamp: entry.timestamp.toISOString()
      })),
      lastSyncedAt: lastSyncedAt?.toISOString() || null
    };
    localStorage.setItem(SYNC_HISTORY_STORAGE_KEY, JSON.stringify(data));
  }, [syncHistory, lastSyncedAt]);

  // Load from database when user logs in
  useEffect(() => {
    if (!user || initialLoadDone.current) return;

    const loadFromDatabase = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("keyboard_shortcuts")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Failed to load keyboard shortcuts from database:", error);
          return;
        }

        if (data?.keyboard_shortcuts) {
          const dbShortcuts = data.keyboard_shortcuts as ShortcutMapping;
          const defaults = buildDefaultMapping(definitions);
          const merged = { ...defaults, ...dbShortcuts };
          setShortcuts(merged);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          lastSyncedShortcuts.current = JSON.stringify(merged);
        }
        initialLoadDone.current = true;
      } catch (err) {
        console.error("Error loading keyboard shortcuts:", err);
      }
    };

    loadFromDatabase();
  }, [user, definitions]);

  // Reset initial load flag when user logs out
  useEffect(() => {
    if (!user) {
      initialLoadDone.current = false;
      lastSyncedShortcuts.current = null;
    }
  }, [user]);

  // Save to localStorage and sync to database
  useEffect(() => {
    const shortcutsJson = JSON.stringify(shortcuts);
    localStorage.setItem(STORAGE_KEY, shortcutsJson);

    // Sync to database if user is logged in and shortcuts changed
    if (user && initialLoadDone.current && shortcutsJson !== lastSyncedShortcuts.current) {
      setIsSyncing(true);
      setSyncStatus("syncing");
      
      // Clear any existing "synced" timeout
      if (syncedTimeoutRef.current) {
        clearTimeout(syncedTimeoutRef.current);
      }
      
      const syncToDatabase = async () => {
        try {
          const { error } = await supabase
            .from("profiles")
            .update({ keyboard_shortcuts: shortcuts })
            .eq("user_id", user.id);

          if (error) {
            console.error("Failed to sync keyboard shortcuts:", error);
            setSyncStatus("error");
            addSyncHistoryEntry(false, "auto");
          } else {
            lastSyncedShortcuts.current = shortcutsJson;
            setSyncStatus("synced");
            addSyncHistoryEntry(true, "auto");
            
            // Reset to idle after 2 seconds
            syncedTimeoutRef.current = setTimeout(() => {
              setSyncStatus("idle");
            }, 2000);
          }
        } catch (err) {
          console.error("Error syncing keyboard shortcuts:", err);
          setSyncStatus("error");
        } finally {
          setIsSyncing(false);
        }
      };

      // Debounce the sync
      const timeoutId = setTimeout(syncToDatabase, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [shortcuts, user]);

  const updateShortcut = useCallback((id: string, keys: string[]) => {
    setShortcuts(prev => ({
      ...prev,
      [id]: keys
    }));
  }, []);

  const resetShortcut = useCallback((id: string) => {
    const def = definitions.find(d => d.id === id);
    if (def) {
      setShortcuts(prev => ({
        ...prev,
        [id]: def.defaultKeys
      }));
    }
  }, [definitions]);

  const resetAllShortcuts = useCallback(() => {
    setShortcuts(buildDefaultMapping(definitions));
  }, [definitions]);

  const getShortcutKeys = useCallback((id: string): string[] => {
    return shortcuts[id] || [];
  }, [shortcuts]);

  const hasConflict = useCallback((id: string, keys: string[]): string | null => {
    const keyStr = keys.join("+").toLowerCase();
    for (const [shortcutId, shortcutKeys] of Object.entries(shortcuts)) {
      if (shortcutId !== id && shortcutKeys.join("+").toLowerCase() === keyStr) {
        const def = definitions.find(d => d.id === shortcutId);
        return def?.label || shortcutId;
      }
    }
    return null;
  }, [shortcuts, definitions]);

  const exportPreferences = useCallback((): string => {
    const exportData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      shortcuts: shortcuts,
    };
    return JSON.stringify(exportData, null, 2);
  }, [shortcuts]);

  const importPreferences = useCallback((jsonString: string): { success: boolean; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Validate structure
      if (!parsed || typeof parsed !== "object") {
        return { success: false, error: "Invalid JSON structure" };
      }

      // Check for version and shortcuts
      if (!parsed.shortcuts || typeof parsed.shortcuts !== "object") {
        return { success: false, error: "Missing or invalid shortcuts data" };
      }

      // Validate each shortcut entry
      const validIds = new Set(definitions.map(d => d.id));
      const newShortcuts: ShortcutMapping = {};
      
      for (const [id, keys] of Object.entries(parsed.shortcuts)) {
        if (!validIds.has(id)) {
          // Skip unknown shortcuts (may be from different version)
          continue;
        }
        if (!Array.isArray(keys) || !keys.every(k => typeof k === "string")) {
          return { success: false, error: `Invalid keys format for shortcut "${id}"` };
        }
        newShortcuts[id] = keys as string[];
      }

      // Merge with defaults to ensure all shortcuts are present
      const defaults = buildDefaultMapping(definitions);
      setShortcuts({ ...defaults, ...newShortcuts });
      
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : "Failed to parse JSON" };
    }
  }, [definitions]);

  const previewImport = useCallback((jsonString: string): ImportPreviewResult => {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (!parsed || typeof parsed !== "object") {
        return { valid: false, error: "Invalid JSON structure", changes: [], totalChanges: 0 };
      }

      if (!parsed.shortcuts || typeof parsed.shortcuts !== "object") {
        return { valid: false, error: "Missing or invalid shortcuts data", changes: [], totalChanges: 0 };
      }

      const validIds = new Set(definitions.map(d => d.id));
      const changes: ImportPreviewChange[] = [];
      let totalChanges = 0;

      // Check each definition for changes
      for (const def of definitions) {
        const currentKeys = shortcuts[def.id] || def.defaultKeys;
        const importedKeys = parsed.shortcuts[def.id];
        
        if (importedKeys !== undefined) {
          if (!Array.isArray(importedKeys) || !importedKeys.every(k => typeof k === "string")) {
            return { 
              valid: false, 
              error: `Invalid keys format for shortcut "${def.id}"`, 
              changes: [], 
              totalChanges: 0 
            };
          }

          const keysMatch = JSON.stringify(currentKeys) === JSON.stringify(importedKeys);
          
          changes.push({
            id: def.id,
            label: def.label,
            category: def.category,
            currentKeys,
            newKeys: importedKeys,
            changeType: keysMatch ? "unchanged" : "modified",
          });

          if (!keysMatch) totalChanges++;
        } else {
          // Shortcut not in import, will use default
          changes.push({
            id: def.id,
            label: def.label,
            category: def.category,
            currentKeys,
            newKeys: def.defaultKeys,
            changeType: JSON.stringify(currentKeys) === JSON.stringify(def.defaultKeys) ? "unchanged" : "modified",
          });

          if (JSON.stringify(currentKeys) !== JSON.stringify(def.defaultKeys)) {
            totalChanges++;
          }
        }
      }

      return {
        valid: true,
        changes,
        totalChanges,
        exportedAt: parsed.exportedAt,
        version: parsed.version,
      };
    } catch (e) {
      return { 
        valid: false, 
        error: e instanceof Error ? e.message : "Failed to parse JSON", 
        changes: [], 
        totalChanges: 0 
      };
    }
  }, [definitions, shortcuts]);

  const forceSyncNow = useCallback(async (): Promise<boolean> => {
    if (!user) {
      return false;
    }

    setIsSyncing(true);
    setSyncStatus("syncing");

    // Clear any existing "synced" timeout
    if (syncedTimeoutRef.current) {
      clearTimeout(syncedTimeoutRef.current);
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ keyboard_shortcuts: shortcuts })
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to sync keyboard shortcuts:", error);
        setSyncStatus("error");
        addSyncHistoryEntry(false, "manual");
        return false;
      } else {
        lastSyncedShortcuts.current = JSON.stringify(shortcuts);
        setSyncStatus("synced");
        addSyncHistoryEntry(true, "manual");

        // Reset to idle after 2 seconds
        syncedTimeoutRef.current = setTimeout(() => {
          setSyncStatus("idle");
        }, 2000);

        return true;
      }
    } catch (err) {
      console.error("Error syncing keyboard shortcuts:", err);
      setSyncStatus("error");
      return false;
    } finally {
      setIsSyncing(false);
    }
  }, [user, shortcuts]);

  // Set up periodic auto-sync timer
  useEffect(() => {
    if (!user) {
      setNextAutoSyncAt(null);
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
        autoSyncIntervalRef.current = null;
      }
      return;
    }

    // Set initial next sync time
    setNextAutoSyncAt(new Date(Date.now() + AUTO_SYNC_INTERVAL_MS));

    // Set up interval to update next sync time and trigger verification sync
    autoSyncIntervalRef.current = setInterval(() => {
      // Update next sync time
      setNextAutoSyncAt(new Date(Date.now() + AUTO_SYNC_INTERVAL_MS));
      
      // Trigger a verification sync if there are unsaved changes
      const currentJson = JSON.stringify(shortcuts);
      if (currentJson !== lastSyncedShortcuts.current) {
        forceSyncNow();
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      if (autoSyncIntervalRef.current) {
        clearInterval(autoSyncIntervalRef.current);
        autoSyncIntervalRef.current = null;
      }
    };
  }, [user, shortcuts, forceSyncNow, AUTO_SYNC_INTERVAL_MS]);

  // Compute whether there are unsynced changes
  const hasUnsyncedChanges = user && initialLoadDone.current 
    ? JSON.stringify(shortcuts) !== lastSyncedShortcuts.current 
    : false;

  const clearSyncHistory = useCallback(() => {
    setSyncHistory([]);
  }, []);

  return (
    <KeyboardPreferencesContext.Provider value={{
      shortcuts,
      defaultShortcuts: definitions,
      updateShortcut,
      resetShortcut,
      resetAllShortcuts,
      getShortcutKeys,
      isRecording,
      setIsRecording,
      hasConflict,
      exportPreferences,
      importPreferences,
      previewImport,
      isSyncing,
      syncStatus,
      lastSyncedAt,
      syncHistory,
      forceSyncNow,
      nextAutoSyncAt,
      hasUnsyncedChanges,
      clearSyncHistory
    }}>
      {children}
    </KeyboardPreferencesContext.Provider>
  );
}

export function useKeyboardPreferences() {
  const context = useContext(KeyboardPreferencesContext);
  if (!context) {
    throw new Error("useKeyboardPreferences must be used within KeyboardPreferencesProvider");
  }
  return context;
}

// Utility to format keys for display
export function formatKeysForDisplay(keys: string[]): string {
  return keys.map(key => {
    switch (key.toLowerCase()) {
      case "escape": return "Esc";
      case "control": 
      case "ctrl": return "Ctrl";
      case "alt": return "Alt";
      case "shift": return "Shift";
      case "meta": return "⌘";
      case " ": return "Space";
      case "arrowup": return "↑";
      case "arrowdown": return "↓";
      case "arrowleft": return "←";
      case "arrowright": return "→";
      default: return key.length === 1 ? key.toUpperCase() : key;
    }
  }).join(" + ");
}

// Check if a key event matches a shortcut
export function matchesShortcut(event: KeyboardEvent, keys: string[]): boolean {
  if (keys.length === 0) return false;
  
  const modifiers = ["ctrl", "alt", "shift", "meta", "control"];
  const eventModifiers = {
    ctrl: event.ctrlKey,
    control: event.ctrlKey,
    alt: event.altKey,
    shift: event.shiftKey,
    meta: event.metaKey
  };

  const shortcutModifiers = keys.filter(k => modifiers.includes(k.toLowerCase()));
  const shortcutKey = keys.find(k => !modifiers.includes(k.toLowerCase()));

  // Check all required modifiers are pressed
  for (const mod of shortcutModifiers) {
    if (!eventModifiers[mod.toLowerCase() as keyof typeof eventModifiers]) {
      return false;
    }
  }

  // Check no extra modifiers are pressed
  for (const [mod, pressed] of Object.entries(eventModifiers)) {
    if (pressed && !shortcutModifiers.some(m => m.toLowerCase() === mod)) {
      // ctrl and control are the same
      if (mod === "control" && shortcutModifiers.some(m => m.toLowerCase() === "ctrl")) continue;
      if (mod === "ctrl" && shortcutModifiers.some(m => m.toLowerCase() === "control")) continue;
      return false;
    }
  }

  // Check the main key
  if (shortcutKey) {
    const eventKey = event.key.toLowerCase();
    const targetKey = shortcutKey.toLowerCase();
    
    // Handle special cases
    if (targetKey === "?" && (eventKey === "?" || (event.shiftKey && eventKey === "/"))) {
      return true;
    }
    
    return eventKey === targetKey;
  }

  return false;
}
