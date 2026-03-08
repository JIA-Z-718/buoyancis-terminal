import React, { useState, useEffect, createContext, useContext, ReactNode, useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAdminVerified: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  // Server-side admin verification via edge function
  const verifyAdminStatus = useCallback(async (currentSession: Session | null) => {
    if (!currentSession?.access_token) {
      setIsAdmin(false);
      setIsAdminVerified(true);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("verify-admin", {
        headers: {
          Authorization: `Bearer ${currentSession.access_token}`,
        },
      });

      if (error) {
        console.error("Admin verification error:", error);
        // Fail closed: do not grant admin access if server verification fails
        setIsAdmin(false);
        setIsAdminVerified(true);
        return;
      }

      setIsAdmin(data?.isAdmin === true);
      setIsAdminVerified(true);
    } catch (err) {
      console.error("Admin verification failed:", err);
      // Fail closed: do not grant admin access if server verification fails
      setIsAdmin(false);
      setIsAdminVerified(true);
    }
  }, []);

  // Public method to refresh admin status
  const refreshAdminStatus = useCallback(async () => {
    setIsAdminVerified(false);
    await verifyAdminStatus(session);
  }, [session, verifyAdminStatus]);

  useEffect(() => {
    // Get initial session first
    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setIsLoading(false);
      
      if (initialSession?.user) {
        verifyAdminStatus(initialSession);
      } else {
        setIsAdminVerified(true);
      }
    });

    // Then set up listener for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        setIsLoading(false);
        
        if (newSession?.user) {
          // Use setTimeout to avoid potential auth state race conditions
          setTimeout(() => verifyAdminStatus(newSession), 0);
        } else {
          setIsAdmin(false);
          setIsAdminVerified(true);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [verifyAdminStatus]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAdmin,
        isAdminVerified,
        signIn,
        signUp,
        signOut,
        refreshAdminStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
