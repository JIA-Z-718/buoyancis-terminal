/**
 * Utility for tracking MFA verification events to the database
 */

import { supabase } from "@/integrations/supabase/client";

export type MFAMethod = "totp" | "passkey" | "recovery_code" | "sms";

interface TrackMFAEventOptions {
  userId: string;
  method: MFAMethod;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Track an MFA verification event to the database
 */
export async function trackMFAVerificationEvent({
  userId,
  method,
  success,
  ipAddress,
  userAgent,
}: TrackMFAEventOptions): Promise<void> {
  try {
    const { error } = await supabase
      .from("mfa_verification_events")
      .insert({
        user_id: userId,
        method,
        success,
        ip_address: ipAddress || null,
        user_agent: userAgent || navigator.userAgent || null,
      });

    if (error) {
      console.error("Failed to track MFA verification event:", error);
    }
  } catch (err) {
    console.error("Error tracking MFA verification event:", err);
  }
}

/**
 * Get the current user's ID and track an MFA event
 * This is a convenience function that fetches the current session
 */
export async function trackCurrentUserMFAEvent(
  method: MFAMethod,
  success: boolean
): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.warn("Cannot track MFA event: no authenticated user");
      return;
    }

    await trackMFAVerificationEvent({
      userId: session.user.id,
      method,
      success,
      userAgent: navigator.userAgent,
    });
  } catch (err) {
    console.error("Error tracking MFA event for current user:", err);
  }
}
