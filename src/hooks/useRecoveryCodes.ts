import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { trackMFAVerificationEvent } from "@/lib/mfaEventTracking";

const RECOVERY_CODE_COUNT = 10;

const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;
// Send warning when 2 or fewer attempts remain
const WARNING_THRESHOLD = 2;

interface RecoveryCodeState {
  codes: string[];
  unusedCount: number;
  isLoading: boolean;
  error: string | null;
  rateLimited: boolean;
  retryAfterSeconds: number;
  attemptsInWindow: number;
  remainingAttempts: number;
}

export function useRecoveryCodes() {
  const { user } = useAuth();
  const [state, setState] = useState<RecoveryCodeState>({
    codes: [],
    unusedCount: 0,
    isLoading: false,
    error: null,
    rateLimited: false,
    retryAfterSeconds: 0,
    attemptsInWindow: 0,
    remainingAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT,
  });

  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  
  // Track if warning has been sent this session to avoid spam
  const warningSentRef = useRef(false);

  // Fetch the count of unused recovery codes
  const fetchUnusedCount = useCallback(async () => {
    if (!user) return;

    try {
      const { count, error } = await supabase
        .from("mfa_recovery_codes")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("used_at", null);

      if (error) throw error;

      setState(prev => ({ ...prev, unusedCount: count || 0 }));
    } catch (err: any) {
      console.error("Error fetching recovery code count:", err);
    }
  }, [user]);

  // Generate new recovery codes
  const generateRecoveryCodes = useCallback(async (): Promise<{ success: boolean; codes?: string[]; error?: string }> => {
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase.functions.invoke("generate-recovery-codes");
      if (error) throw error;

      const newCodes = (data as any)?.codes as string[] | undefined;
      if (!newCodes || !Array.isArray(newCodes) || newCodes.length === 0) {
        throw new Error("Failed to generate recovery codes");
      }

      setGeneratedCodes(newCodes);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        unusedCount: RECOVERY_CODE_COUNT,
        codes: newCodes 
      }));

      return { success: true, codes: newCodes };
    } catch (err: any) {
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err.message || "Failed to generate recovery codes" 
      }));
      return { success: false, error: err.message };
    }
  }, [user]);

  // Check rate limit before verification attempt and update state with attempt info
  const checkRateLimit = useCallback(async (): Promise<{ allowed: boolean; retryAfterSeconds: number; attemptsInWindow: number }> => {
    if (!user) return { allowed: false, retryAfterSeconds: 0, attemptsInWindow: 0 };

    try {
      const { data, error } = await supabase
        .rpc("check_recovery_code_rate_limit", { p_user_id: user.id });

      if (error) {
        console.error("Rate limit check error:", error);
        return { allowed: true, retryAfterSeconds: 0, attemptsInWindow: 0 }; // Fail open for usability
      }

      const result = data?.[0];
      const attemptsInWindow = result?.attempts_in_window ?? 0;
      const remainingAttempts = Math.max(0, MAX_ATTEMPTS_BEFORE_LOCKOUT - attemptsInWindow);
      
      // Update state with attempt information
      setState(prev => ({ 
        ...prev, 
        attemptsInWindow,
        remainingAttempts,
      }));

      return {
        allowed: result?.allowed ?? true,
        retryAfterSeconds: result?.retry_after_seconds ?? 0,
        attemptsInWindow,
      };
    } catch (err) {
      console.error("Rate limit check failed:", err);
      return { allowed: true, retryAfterSeconds: 0, attemptsInWindow: 0 };
    }
  }, [user]);

  // Record a verification attempt
  const recordAttempt = useCallback(async (success: boolean): Promise<void> => {
    if (!user) return;

    try {
      await supabase.rpc("record_recovery_code_attempt", {
        p_user_id: user.id,
        p_success: success,
      });
    } catch (err) {
      console.error("Failed to record attempt:", err);
    }
  }, [user]);

  // Send lockout warning email when approaching threshold
  const sendLockoutWarning = useCallback(async (attemptsUsed: number, remainingAttempts: number): Promise<void> => {
    if (!user || warningSentRef.current) return;
    
    // Only send warning when at or below threshold
    if (remainingAttempts > WARNING_THRESHOLD) return;

    try {
      warningSentRef.current = true;
      
      await supabase.functions.invoke("notify-recovery-lockout-warning", {
        body: {
          attemptsUsed,
          maxAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT,
          remainingAttempts,
        },
      });
      
      console.log("Lockout warning notification sent");
    } catch (err) {
      console.error("Failed to send lockout warning:", err);
      // Reset flag to allow retry on next failure
      warningSentRef.current = false;
    }
  }, [user]);

  // Send lockout notification when user is locked out
  const sendLockoutNotification = useCallback(async (retryAfterSeconds: number): Promise<void> => {
    if (!user) return;

    try {
      const retryAfterMinutes = Math.ceil(retryAfterSeconds / 60);
      
      // Send notification to the locked-out user
      await supabase.functions.invoke("notify-recovery-lockout", {
        body: {
          retryAfterMinutes,
        },
      });
      
      // Also notify admins about the lockout
      await supabase.functions.invoke("notify-admin-recovery-lockout", {
        body: {
          userId: user.id,
          userEmail: user.email || "Unknown",
          failedAttempts: MAX_ATTEMPTS_BEFORE_LOCKOUT,
          lockoutMinutes: retryAfterMinutes,
        },
      });
      
      console.log("Lockout notifications sent (user and admin)");
    } catch (err) {
      console.error("Failed to send lockout notification:", err);
    }
  }, [user]);

  // Verify a recovery code with rate limiting
  const verifyRecoveryCode = useCallback(async (code: string): Promise<{ success: boolean; error?: string; rateLimited?: boolean; retryAfterSeconds?: number; remainingAttempts?: number }> => {
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    setState(prev => ({ ...prev, isLoading: true, error: null, rateLimited: false }));

    // Check rate limit first
    const rateLimit = await checkRateLimit();
    if (!rateLimit.allowed) {
      // Send lockout notification email
      sendLockoutNotification(rateLimit.retryAfterSeconds);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        rateLimited: true,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
        attemptsInWindow: rateLimit.attemptsInWindow,
        remainingAttempts: 0,
        error: `Too many attempts. Please try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minute(s).`
      }));
      return { 
        success: false, 
        error: `Too many attempts. Please try again in ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minute(s).`,
        rateLimited: true,
        retryAfterSeconds: rateLimit.retryAfterSeconds,
        remainingAttempts: 0
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke("verify-recovery-code", {
        body: { code },
      });
      if (error) throw error;

      if (!(data as any)?.success) {
        // Record failed attempt
        await recordAttempt(false);
        // Use the attempts from rate limit check + 1 for the failed attempt
        const newAttemptsInWindow = rateLimit.attemptsInWindow + 1;
        const newRemainingAttempts = Math.max(0, MAX_ATTEMPTS_BEFORE_LOCKOUT - newAttemptsInWindow);

        // Send lockout warning if approaching threshold
        await sendLockoutWarning(newAttemptsInWindow, newRemainingAttempts);

        setState(prev => ({
          ...prev,
          isLoading: false,
          attemptsInWindow: newAttemptsInWindow,
          remainingAttempts: newRemainingAttempts,
        }));
        return {
          success: false,
          error: "Invalid or already used recovery code",
          remainingAttempts: newRemainingAttempts,
        };
      }

      // Record successful attempt
      await recordAttempt(true);

      // Track successful recovery code verification
      await trackMFAVerificationEvent({
        userId: user.id,
        method: "recovery_code",
        success: true,
      });

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        unusedCount: Math.max(0, prev.unusedCount - 1),
        rateLimited: false,
        retryAfterSeconds: 0
      }));

      return { success: true };
    } catch (err: any) {
      // Record failed attempt on error
      await recordAttempt(false);
      
      // Track failed recovery code verification
      await trackMFAVerificationEvent({
        userId: user.id,
        method: "recovery_code",
        success: false,
      });
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: err.message || "Failed to verify recovery code" 
      }));
      return { success: false, error: err.message };
    }
  }, [user, checkRateLimit, recordAttempt, sendLockoutWarning, sendLockoutNotification]);

  // Clear displayed codes (after user has saved them)
  const clearDisplayedCodes = useCallback(() => {
    setGeneratedCodes([]);
    setState(prev => ({ ...prev, codes: [] }));
  }, []);

  return {
    ...state,
    generatedCodes,
    fetchUnusedCount,
    generateRecoveryCodes,
    verifyRecoveryCode,
    clearDisplayedCodes,
  };
}
