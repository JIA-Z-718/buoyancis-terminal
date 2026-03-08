import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Fingerprint } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [passkeySupported, setPasskeySupported] = useState(false);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Check WebAuthn support on mount
  useEffect(() => {
    setPasskeySupported(isWebAuthnSupported());
  }, []);

  // Redirect to admin if already logged in
  useEffect(() => {
    if (user) {
      navigate("/admin");
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
      setIsLoading(false);
    } else {
      // Navigation will happen via useEffect when user state updates
      // MFA enforcement is handled by MFAEnforcementGuard in Admin page
      setIsLoading(false);
    }
  };

  const handlePasskeyLogin = async () => {
    if (!passkeySupported) {
      toast({
        title: "Not supported",
        description: "Passkey authentication is not supported in this browser.",
        variant: "destructive",
      });
      return;
    }

    setIsPasskeyLoading(true);

    try {
      // Step 1: Get authentication options from the server
      const { data: options, error: optionsError } = await supabase.functions.invoke(
        "passkey-login",
        {
          body: { step: "options" },
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
        userVerification: options.userVerification as UserVerificationRequirement,
        // Empty allowCredentials for discoverable credentials
        allowCredentials: [],
      };

      const passkeySessionId: string | undefined = options.sessionId;
      if (!passkeySessionId) {
        throw new Error("Missing passkey session id");
      }

      // Step 2: Get the credential using the browser API
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error("No credential selected");
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
        "passkey-login",
        {
          body: { step: "verify", sessionId: passkeySessionId, credential: credentialForServer },
        }
      );

      if (verifyError) throw verifyError;

      if (!verifyResult.success) {
        throw new Error(verifyResult.error || "Authentication failed");
      }

      // Step 4: Complete the sign-in using the magic link token
      const { error: otpError } = await supabase.auth.verifyOtp({
        email: verifyResult.email,
        token: verifyResult.token,
        type: "magiclink",
      });

      if (otpError) {
        throw otpError;
      }

      toast({
        title: "Welcome back!",
        description: "Successfully signed in with passkey.",
      });

      // Navigation will happen via useEffect when user state updates
    } catch (error: any) {
      console.error("Passkey login error:", error);

      let errorMessage = "Failed to sign in with passkey";
      if (error.name === "NotAllowedError") {
        errorMessage = "Passkey authentication was cancelled";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsPasskeyLoading(false);
    }
  };

  return (
    <main id="main-content" className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <div className="glass-card p-8">
          <h1 className="text-2xl font-serif text-foreground mb-2">Welcome back</h1>
          <p className="text-muted-foreground mb-6">Sign in to your account</p>

          {/* Passkey Login Button */}
          {passkeySupported && (
            <>
              <Button
                type="button"
                variant="outline"
                className="w-full mb-4"
                onClick={handlePasskeyLogin}
                disabled={isPasskeyLoading || isLoading}
              >
                {isPasskeyLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Fingerprint className="w-4 h-4 mr-2" />
                )}
                Sign in with Passkey
              </Button>

              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isPasskeyLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isPasskeyLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || isPasskeyLoading}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
              Forgot your password?
            </Link>
          </div>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/auth/signup" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
};

export default Login;
