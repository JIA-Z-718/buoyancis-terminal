import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackCurrentUserMFAEvent } from "@/lib/mfaEventTracking";

interface PasskeyCredential {
  id: string;
  credential_id: string;
  friendly_name: string | null;
  device_type: string | null;
  created_at: string;
  last_used_at: string | null;
}

interface PasskeyState {
  passkeys: PasskeyCredential[];
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
}

// Check if WebAuthn is supported
function isWebAuthnSupported(): boolean {
  return !!(
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential === "function"
  );
}

// Convert base64url to ArrayBuffer
function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const binaryString = atob(base64 + padding);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert ArrayBuffer to base64url
function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function usePasskey() {
  const [state, setState] = useState<PasskeyState>({
    passkeys: [],
    isLoading: true,
    error: null,
    isSupported: isWebAuthnSupported(),
  });

  // Fetch existing passkeys for the user
  const fetchPasskeys = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { data, error } = await supabase
        .from("passkey_credentials")
        .select("id, credential_id, friendly_name, device_type, created_at, last_used_at")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setState((prev) => ({
        ...prev,
        passkeys: data || [],
        isLoading: false,
      }));
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to fetch passkeys",
      }));
    }
  }, []);

  // Register a new passkey
  const registerPasskey = useCallback(async (friendlyName: string = "Passkey") => {
    if (!state.isSupported) {
      return { success: false, error: "WebAuthn is not supported in this browser" };
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      // Step 1: Get registration options from the server
      const { data: options, error: optionsError } = await supabase.functions.invoke(
        "passkey-register",
        {
          body: { step: "options" },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (optionsError) throw optionsError;

      // Convert options for the browser API
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge: base64urlToArrayBuffer(options.challenge),
        rp: options.rp,
        user: {
          id: base64urlToArrayBuffer(options.user.id),
          name: options.user.name,
          displayName: options.user.displayName,
        },
        pubKeyCredParams: options.pubKeyCredParams,
        timeout: options.timeout,
        attestation: options.attestation,
        authenticatorSelection: options.authenticatorSelection,
        excludeCredentials: options.excludeCredentials?.map((c: any) => ({
          type: c.type,
          id: base64urlToArrayBuffer(c.id),
        })),
      };

      // Step 2: Create the credential using the browser API
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to create credential");
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Step 3: Send the credential to the server for verification
      const credentialForServer = {
        id: credential.id,
        rawId: arrayBufferToBase64url(credential.rawId),
        type: credential.type,
        authenticatorAttachment: (credential as any).authenticatorAttachment,
        response: {
          clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
          attestationObject: arrayBufferToBase64url(response.attestationObject),
          transports: response.getTransports?.() || [],
        },
      };

      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke(
        "passkey-register",
        {
          body: { step: "verify", credential: credentialForServer, friendlyName },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (verifyError) throw verifyError;

      if (!verifyResult.success) {
        throw new Error(verifyResult.error || "Registration failed");
      }

      // Refresh the passkeys list
      await fetchPasskeys();

      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: true };
    } catch (error: any) {
      const errorMessage = error.name === "NotAllowedError"
        ? "Passkey registration was cancelled"
        : error.message || "Failed to register passkey";

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [state.isSupported, fetchPasskeys]);

  // Authenticate with a passkey
  const authenticateWithPasskey = useCallback(async () => {
    if (!state.isSupported) {
      return { success: false, error: "WebAuthn is not supported in this browser" };
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      // Step 1: Get authentication options from the server
      const { data: options, error: optionsError } = await supabase.functions.invoke(
        "passkey-authenticate",
        {
          body: { step: "options" },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (optionsError) throw optionsError;

      if (options.error) {
        throw new Error(options.error);
      }

      // Convert options for the browser API
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge: base64urlToArrayBuffer(options.challenge),
        rpId: options.rpId,
        timeout: options.timeout,
        userVerification: options.userVerification,
        allowCredentials: options.allowCredentials?.map((c: any) => ({
          type: c.type,
          id: base64urlToArrayBuffer(c.id),
          transports: c.transports,
        })),
      };

      // Step 2: Get the credential using the browser API
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("Failed to get credential");
      }

      const response = credential.response as AuthenticatorAssertionResponse;

      // Step 3: Send the credential to the server for verification
      const credentialForServer = {
        id: credential.id,
        rawId: arrayBufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: arrayBufferToBase64url(response.clientDataJSON),
          authenticatorData: arrayBufferToBase64url(response.authenticatorData),
          signature: arrayBufferToBase64url(response.signature),
          userHandle: response.userHandle
            ? arrayBufferToBase64url(response.userHandle)
            : null,
        },
      };

      const { data: verifyResult, error: verifyError } = await supabase.functions.invoke(
        "passkey-authenticate",
        {
          body: { step: "verify", credential: credentialForServer },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (verifyError) throw verifyError;

      if (!verifyResult.success) {
        // Track failed passkey verification
        await trackCurrentUserMFAEvent("passkey", false);
        throw new Error(verifyResult.error || "Authentication failed");
      }

      // Track successful passkey verification
      await trackCurrentUserMFAEvent("passkey", true);

      setState((prev) => ({ ...prev, isLoading: false }));
      return { success: true, verifiedAt: verifyResult.verifiedAt };
    } catch (error: any) {
      const errorMessage = error.name === "NotAllowedError"
        ? "Passkey authentication was cancelled"
        : error.message || "Failed to authenticate with passkey";

      // Don't track cancelled operations as failures
      if (error.name !== "NotAllowedError") {
        await trackCurrentUserMFAEvent("passkey", false);
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [state.isSupported]);

  // Delete a passkey
  const deletePasskey = useCallback(async (passkeyId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { error } = await supabase
        .from("passkey_credentials")
        .delete()
        .eq("id", passkeyId);

      if (error) throw error;

      await fetchPasskeys();
      return { success: true };
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message || "Failed to delete passkey",
      }));
      return { success: false, error: error.message };
    }
  }, [fetchPasskeys]);

  // Check if platform authenticator is available
  const checkPlatformAuthenticator = useCallback(async () => {
    if (!state.isSupported) return false;

    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }, [state.isSupported]);

  // Initialize
  useEffect(() => {
    fetchPasskeys();
  }, [fetchPasskeys]);

  return {
    ...state,
    hasPasskeys: state.passkeys.length > 0,
    fetchPasskeys,
    registerPasskey,
    authenticateWithPasskey,
    deletePasskey,
    checkPlatformAuthenticator,
  };
}
