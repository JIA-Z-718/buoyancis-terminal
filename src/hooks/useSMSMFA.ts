import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackCurrentUserMFAEvent } from "@/lib/mfaEventTracking";

interface PhoneNumber {
  id: string;
  user_id: string;
  phone_number: string;
  country_code: string;
  is_verified: boolean;
  verified_at: string | null;
  created_at: string;
}

interface SMSMFAState {
  phoneNumber: PhoneNumber | null;
  isEnrolled: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSMSMFA() {
  const [state, setState] = useState<SMSMFAState>({
    phoneNumber: null,
    isEnrolled: false,
    isLoading: true,
    error: null,
  });

  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [codeExpiresAt, setCodeExpiresAt] = useState<Date | null>(null);

  // Fetch current phone number status
  const fetchPhoneStatus = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return;
      }

      const { data, error } = await supabase
        .from("user_phone_numbers")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setState({
        phoneNumber: data as PhoneNumber | null,
        isEnrolled: data?.is_verified ?? false,
        isLoading: false,
        error: null,
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch phone status";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, []);

  // Send verification code
  const sendVerificationCode = useCallback(
    async (phoneNumber: string, countryCode: string, purpose: "phone_verification" | "mfa_login" = "phone_verification") => {
      setIsSendingCode(true);
      setState((prev) => ({ ...prev, error: null }));

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Not authenticated");
        }

        const { data, error } = await supabase.functions.invoke("send-sms-code", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { phoneNumber, countryCode, purpose },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        setCodeExpiresAt(new Date(data.expiresAt));
        return { success: true };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Failed to send verification code";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      } finally {
        setIsSendingCode(false);
      }
    },
    []
  );

  // Verify code
  const verifyCode = useCallback(
    async (code: string, purpose: "phone_verification" | "mfa_login" = "phone_verification") => {
      setIsVerifyingCode(true);
      setState((prev) => ({ ...prev, error: null }));

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
          throw new Error("Not authenticated");
        }

        const { data, error } = await supabase.functions.invoke("verify-sms-code", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          body: { code, purpose },
        });

        if (error) throw error;
        if (data.error) throw new Error(data.error);

        // Track successful SMS verification
        await trackCurrentUserMFAEvent("sms", true);

        setCodeExpiresAt(null);
        await fetchPhoneStatus();
        return { success: true };
      } catch (error: unknown) {
        // Track failed SMS verification
        await trackCurrentUserMFAEvent("sms", false);
        
        const errorMessage = error instanceof Error ? error.message : "Failed to verify code";
        setState((prev) => ({ ...prev, error: errorMessage }));
        return { success: false, error: errorMessage };
      } finally {
        setIsVerifyingCode(false);
      }
    },
    [fetchPhoneStatus]
  );

  // Remove phone number (unenroll from SMS MFA)
  const removePhoneNumber = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Not authenticated");
      }

      const { error } = await supabase
        .from("user_phone_numbers")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setState({
        phoneNumber: null,
        isEnrolled: false,
        isLoading: false,
        error: null,
      });

      return { success: true };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to remove phone number";
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  useEffect(() => {
    fetchPhoneStatus();
  }, [fetchPhoneStatus]);

  return {
    ...state,
    isSendingCode,
    isVerifyingCode,
    codeExpiresAt,
    fetchPhoneStatus,
    sendVerificationCode,
    verifyCode,
    removePhoneNumber,
  };
}
