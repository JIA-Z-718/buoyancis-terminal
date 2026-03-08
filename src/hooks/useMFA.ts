import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackCurrentUserMFAEvent } from "@/lib/mfaEventTracking";
import type { Factor, AuthenticatorAssuranceLevels } from "@supabase/supabase-js";

interface MFAState {
  factors: Factor[];
  isEnrolled: boolean;
  currentLevel: AuthenticatorAssuranceLevels | null;
  nextLevel: AuthenticatorAssuranceLevels | null;
  isLoading: boolean;
  error: string | null;
}

interface EnrollmentData {
  factorId: string;
  qrCode: string;
  secret: string;
}

export function useMFA() {
  const [state, setState] = useState<MFAState>({
    factors: [],
    isEnrolled: false,
    currentLevel: null,
    nextLevel: null,
    isLoading: true,
    error: null,
  });

  const [enrollmentData, setEnrollmentData] = useState<EnrollmentData | null>(null);

  // Fetch MFA factors and AAL levels
  const fetchMFAStatus = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get factors
      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) {
        throw factorsError;
      }

      // Get AAL levels
      const { data: aalData, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalError) {
        throw aalError;
      }

      const verifiedFactors = factorsData.totp.filter(
        (f) => f.status === "verified"
      );

      setState({
        factors: factorsData.totp,
        isEnrolled: verifiedFactors.length > 0,
        currentLevel: aalData.currentLevel,
        nextLevel: aalData.nextLevel,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to fetch MFA status",
      }));
    }
  }, []);

  // Start enrollment process
  const startEnrollment = useCallback(async (friendlyName: string = "Authenticator App") => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    setEnrollmentData(null);

    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName,
      });

      if (error) {
        throw error;
      }

      setEnrollmentData({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });

      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: true, data };
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to start enrollment",
      }));
      return { success: false, error: error.message };
    }
  }, []);

  // Verify enrollment with TOTP code
  const verifyEnrollment = useCallback(
    async (code: string) => {
      if (!enrollmentData) {
        return { success: false, error: "No enrollment in progress" };
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Challenge the factor
        const { data: challengeData, error: challengeError } =
          await supabase.auth.mfa.challenge({
            factorId: enrollmentData.factorId,
          });

        if (challengeError) {
          throw challengeError;
        }

        // Verify the code
        const { data: verifyData, error: verifyError } =
          await supabase.auth.mfa.verify({
            factorId: enrollmentData.factorId,
            challengeId: challengeData.id,
            code,
          });

        if (verifyError) {
          throw verifyError;
        }

        setEnrollmentData(null);
        await fetchMFAStatus();
        
        // Track successful TOTP enrollment verification
        await trackCurrentUserMFAEvent("totp", true);
        
        return { success: true };
      } catch (error: any) {
        // Track failed TOTP enrollment verification
        await trackCurrentUserMFAEvent("totp", false);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Verification failed",
        }));
        return { success: false, error: error.message };
      }
    },
    [enrollmentData, fetchMFAStatus]
  );

  // Cancel enrollment
  const cancelEnrollment = useCallback(async () => {
    if (enrollmentData) {
      // Unenroll the pending factor
      await supabase.auth.mfa.unenroll({ factorId: enrollmentData.factorId });
      setEnrollmentData(null);
    }
  }, [enrollmentData]);

  // Unenroll a factor
  const unenroll = useCallback(
    async (factorId: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const { error } = await supabase.auth.mfa.unenroll({ factorId });

        if (error) {
          throw error;
        }

        await fetchMFAStatus();
        return { success: true };
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error.message || "Failed to remove MFA",
        }));
        return { success: false, error: error.message };
      }
    },
    [fetchMFAStatus]
  );

  // Verify MFA during login
  const verifyMFA = useCallback(async (code: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get verified factors
      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) {
        throw factorsError;
      }

      const verifiedFactor = factorsData.totp.find(
        (f) => f.status === "verified"
      );

      if (!verifiedFactor) {
        throw new Error("No verified MFA factor found");
      }

      // Challenge
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({
          factorId: verifiedFactor.id,
        });

      if (challengeError) {
        throw challengeError;
      }

      // Verify
      const { data: verifyData, error: verifyError } =
        await supabase.auth.mfa.verify({
          factorId: verifiedFactor.id,
          challengeId: challengeData.id,
          code,
        });

      if (verifyError) {
        throw verifyError;
      }

      await fetchMFAStatus();
      
      // Track successful TOTP verification
      await trackCurrentUserMFAEvent("totp", true);
      
      return { success: true };
    } catch (error: any) {
      // Track failed TOTP verification
      await trackCurrentUserMFAEvent("totp", false);
      
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "MFA verification failed",
      }));
      return { success: false, error: error.message };
    }
  }, [fetchMFAStatus]);

  // Check if MFA verification is required
  const requiresMFAVerification = state.currentLevel === "aal1" && 
    state.nextLevel === "aal2" && 
    state.isEnrolled;

  useEffect(() => {
    fetchMFAStatus();
  }, [fetchMFAStatus]);

  return {
    ...state,
    enrollmentData,
    requiresMFAVerification,
    fetchMFAStatus,
    startEnrollment,
    verifyEnrollment,
    cancelEnrollment,
    unenroll,
    verifyMFA,
  };
}
