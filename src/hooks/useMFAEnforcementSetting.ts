import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseMFAEnforcementSettingReturn {
  isMFARequired: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch the MFA enforcement setting.
 * Returns whether MFA is required for admin access.
 */
export function useMFAEnforcementSetting(): UseMFAEnforcementSettingReturn {
  const [isMFARequired, setIsMFARequired] = useState(true); // Default to required for safety
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSetting = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("mfa_settings")
        .select("setting_value")
        .eq("setting_key", "mfa_required_for_admin")
        .single();

      if (fetchError) {
        // If we can't fetch the setting, default to required for security
        console.error("Error fetching MFA enforcement setting:", fetchError);
        setError(fetchError.message);
        setIsMFARequired(true);
        return;
      }

      setIsMFARequired(data?.setting_value ?? true);
    } catch (err) {
      console.error("Error in useMFAEnforcementSetting:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      setIsMFARequired(true); // Default to required for security
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSetting();
  }, []);

  return {
    isMFARequired,
    isLoading,
    error,
    refetch: fetchSetting,
  };
}
