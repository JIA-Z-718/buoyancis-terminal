import { useState, useCallback } from "react";

interface MFATestModeState {
  isTestMode: boolean;
  isEnrolled: boolean;
  currentLevel: "aal1" | "aal2";
  enrollmentData: {
    factorId: string;
    qrCode: string;
    secret: string;
  } | null;
}

const DEMO_QR_CODE = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiB2aWV3Qm94PSIwIDAgMjAwIDIwMCI+PHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmZmYiLz48ZyBmaWxsPSIjMDAwIj48cmVjdCB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIvPjxyZWN0IHg9IjgwIiB5PSIyMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIi8+PHJlY3QgeD0iMTQwIiB5PSIyMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIi8+PHJlY3QgeD0iMjAiIHk9IjgwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz48cmVjdCB4PSI2MCIgeT0iODAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIvPjxyZWN0IHg9IjEwMCIgeT0iODAiIHdpZHRoPSI0MCIgaGVpZ2h0PSIyMCIvPjxyZWN0IHg9IjE2MCIgeT0iODAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIvPjxyZWN0IHg9IjIwIiB5PSIxNDAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIvPjxyZWN0IHg9IjgwIiB5PSIxNDAiIHdpZHRoPSIyMCIgaGVpZ2h0PSI0MCIvPjxyZWN0IHg9IjEyMCIgeT0iMTQwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiLz48cmVjdCB4PSIxNjAiIHk9IjE0MCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIi8+PC9nPjwvc3ZnPg==";
const DEMO_SECRET = "JBSWY3DPEHPK3PXP";
const DEMO_FACTOR_ID = "test-factor-id-12345";
const TEST_VERIFICATION_CODE = "123456";

/**
 * Hook for MFA test mode - development only
 * Simulates MFA enrollment and verification without real Supabase MFA
 */
export function useMFATestMode() {
  const [state, setState] = useState<MFATestModeState>({
    isTestMode: false,
    isEnrolled: false,
    currentLevel: "aal1",
    enrollmentData: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enableTestMode = useCallback(() => {
    setState((prev) => ({ ...prev, isTestMode: true }));
  }, []);

  const disableTestMode = useCallback(() => {
    setState({
      isTestMode: false,
      isEnrolled: false,
      currentLevel: "aal1",
      enrollmentData: null,
    });
  }, []);

  const startEnrollment = useCallback(async (_friendlyName?: string) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    setState((prev) => ({
      ...prev,
      enrollmentData: {
        factorId: DEMO_FACTOR_ID,
        qrCode: DEMO_QR_CODE,
        secret: DEMO_SECRET,
      },
    }));
    
    setIsLoading(false);
    return { success: true, error: undefined as string | undefined };
  }, []);

  const verifyEnrollment = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 600));
    
    if (code !== TEST_VERIFICATION_CODE) {
      const errorMsg = "Invalid verification code. Use 123456 for test mode.";
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
    
    setState((prev) => ({
      ...prev,
      isEnrolled: true,
      currentLevel: "aal2" as const,
      enrollmentData: null,
    }));
    
    setIsLoading(false);
    return { success: true, error: undefined as string | undefined };
  }, []);

  const verifyMFA = useCallback(async (code: string) => {
    setIsLoading(true);
    setError(null);
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    if (code !== TEST_VERIFICATION_CODE) {
      const errorMsg = "Invalid code. Use 123456 for test mode.";
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
    
    setState((prev) => ({
      ...prev,
      currentLevel: "aal2" as const,
    }));
    
    setIsLoading(false);
    return { success: true, error: undefined as string | undefined };
  }, []);

  const unenroll = useCallback(async (_factorId: string) => {
    setIsLoading(true);
    
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    setState((prev) => ({
      ...prev,
      isEnrolled: false,
      currentLevel: "aal1" as const,
    }));
    
    setIsLoading(false);
    return { success: true, error: undefined as string | undefined };
  }, []);

  const cancelEnrollment = useCallback(() => {
    setState((prev) => ({
      ...prev,
      enrollmentData: null,
    }));
  }, []);

  return {
    ...state,
    isLoading,
    error,
    factors: state.isEnrolled ? [{ id: DEMO_FACTOR_ID, status: "verified" }] : [],
    nextLevel: state.isEnrolled && state.currentLevel === "aal1" ? "aal2" : null,
    requiresMFAVerification: state.isEnrolled && state.currentLevel === "aal1",
    enableTestMode,
    disableTestMode,
    startEnrollment,
    verifyEnrollment,
    verifyMFA,
    unenroll,
    cancelEnrollment,
    fetchMFAStatus: () => Promise.resolve(),
    TEST_VERIFICATION_CODE,
  };
}

export const isDevelopment = import.meta.env.DEV;
