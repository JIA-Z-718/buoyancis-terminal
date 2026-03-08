import { useState, useEffect } from "react";
import { useMFA } from "@/hooks/useMFA";
import { useMFAEnforcementSetting } from "@/hooks/useMFAEnforcementSetting";
import { usePasskey } from "@/hooks/usePasskey";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, ShieldAlert, Loader2, ArrowRight, Fingerprint } from "lucide-react";
import MFAEnrollment from "./MFAEnrollment";
import MFAVerification from "@/components/MFAVerification";

interface MFAEnforcementGuardProps {
  children: React.ReactNode;
  onSignOut?: () => void;
}

/**
 * MFA Enforcement Guard Component
 * 
 * This component conditionally enforces MFA for admin users based on the
 * mfa_required_for_admin setting. When enforcement is enabled:
 * 1. Checks if the user has MFA enrolled (TOTP or Passkey)
 * 2. If not enrolled, shows the enrollment UI (blocking access)
 * 3. If enrolled but not verified (AAL1), shows the verification UI
 * 4. Only allows access to children when MFA is fully verified (AAL2 or passkey verified)
 * 
 * When enforcement is disabled, users can access the dashboard without MFA.
 * 
 * Passkey verification is accepted as an alternative to TOTP for admin access.
 */
export default function MFAEnforcementGuard({ children, onSignOut }: MFAEnforcementGuardProps) {
  const {
    isEnrolled: isTOTPEnrolled,
    isLoading: mfaLoading,
    error,
    currentLevel,
    requiresMFAVerification,
    fetchMFAStatus,
  } = useMFA();

  const {
    hasPasskeys,
    isLoading: passkeyLoading,
    authenticateWithPasskey,
    isSupported: passkeySupported,
  } = usePasskey();

  const { isMFARequired, isLoading: settingLoading } = useMFAEnforcementSetting();

  // Track passkey verification state (session-local, not persisted in Supabase AAL)
  const [isPasskeyVerified, setIsPasskeyVerified] = useState(false);
  const [passkeyVerifying, setPasskeyVerifying] = useState(false);
  const [passkeyError, setPasskeyError] = useState<string | null>(null);

  // Check session storage for passkey verification on mount
  useEffect(() => {
    const verified = sessionStorage.getItem("passkey_verified");
    if (verified === "true") {
      setIsPasskeyVerified(true);
    }
  }, []);

  const isLoading = mfaLoading || settingLoading || passkeyLoading;

  // User has any form of MFA enrolled (TOTP or Passkey)
  const hasAnyMFAEnrolled = isTOTPEnrolled || hasPasskeys;

  // User is fully verified (AAL2 via TOTP or passkey verified this session)
  const isFullyVerified = currentLevel === "aal2" || isPasskeyVerified;

  // Handle passkey authentication
  const handlePasskeyAuth = async () => {
    setPasskeyVerifying(true);
    setPasskeyError(null);

    const result = await authenticateWithPasskey();

    setPasskeyVerifying(false);

    if (result.success) {
      setIsPasskeyVerified(true);
      // Store in session storage so it persists across page refreshes
      sessionStorage.setItem("passkey_verified", "true");
    } else {
      setPasskeyError(result.error || "Passkey authentication failed");
    }
  };

  // Show loading state while checking MFA status and settings
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Checking security status...</p>
        </div>
      </div>
    );
  }

  // If MFA is not required, allow access immediately
  if (!isMFARequired) {
    return <>{children}</>;
  }

  // User is fully verified - allow access
  if (hasAnyMFAEnrolled && isFullyVerified) {
    return <>{children}</>;
  }

  // User has TOTP enrolled and needs to verify (AAL1 -> AAL2)
  // But also has passkeys available - show choice
  if (isTOTPEnrolled && hasPasskeys && !isFullyVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold">Verify Your Identity</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Choose how you want to verify
            </p>
          </div>

          {/* Passkey Option */}
          {passkeySupported && (
            <Card className="border-primary/20 hover:border-primary/40 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <Fingerprint className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">Use Passkey</h3>
                    <p className="text-sm text-muted-foreground">
                      Verify with Face ID, Touch ID, or Windows Hello
                    </p>
                  </div>
                </div>

                {passkeyError && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{passkeyError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handlePasskeyAuth}
                  disabled={passkeyVerifying}
                  className="w-full mt-4"
                >
                  {passkeyVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="mr-2 h-4 w-4" />
                      Verify with Passkey
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or</span>
            </div>
          </div>

          {/* TOTP Verification */}
          <MFAVerification
            onSuccess={() => {
              fetchMFAStatus();
            }}
            onCancel={onSignOut}
          />
        </div>
      </div>
    );
  }

  // User has only TOTP enrolled and needs to verify (AAL1 -> AAL2)
  if (isTOTPEnrolled && requiresMFAVerification) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <MFAVerification
          onSuccess={() => {
            fetchMFAStatus();
          }}
          onCancel={onSignOut}
        />
      </div>
    );
  }

  // User has only passkeys enrolled - need to verify with passkey
  if (hasPasskeys && !isTOTPEnrolled && !isPasskeyVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Fingerprint className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Verify with Passkey</CardTitle>
                  <CardDescription>
                    Use your device's biometric authentication to continue
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {passkeyError && (
                <Alert variant="destructive">
                  <AlertDescription>{passkeyError}</AlertDescription>
                </Alert>
              )}

              <Button
                onClick={handlePasskeyAuth}
                disabled={passkeyVerifying}
                className="w-full"
                size="lg"
              >
                {passkeyVerifying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Verify with Passkey
                  </>
                )}
              </Button>

              {onSignOut && (
                <Button variant="ghost" onClick={onSignOut} className="w-full">
                  Sign out
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // User doesn't have any MFA enrolled - must enroll before accessing admin
  if (!hasAnyMFAEnrolled) {
    return (
      <div className="min-h-screen bg-background py-12 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header Card */}
          <Card className="border-amber-500/50 bg-amber-500/5">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-amber-500/20">
                  <ShieldAlert className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Two-Factor Authentication Required</CardTitle>
                  <CardDescription className="text-base mt-1">
                    Admin accounts must have MFA enabled to access the dashboard
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Alert className="bg-background">
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  For security purposes, all admin users are required to set up two-factor authentication 
                  before accessing admin features. This helps protect sensitive data and ensures only 
                  authorized personnel can manage the system.
                </AlertDescription>
              </Alert>

              <div className="mt-6 space-y-3">
                <h4 className="font-medium text-sm">Choose a verification method:</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                    <strong>Authenticator App</strong> - Google Authenticator, Authy, 1Password
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                    <strong>Passkey</strong> - Face ID, Touch ID, Windows Hello
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-primary flex-shrink-0" />
                    <strong>SMS</strong> - Verification code via text message
                  </li>
                </ul>
              </div>

              {onSignOut && (
                <div className="mt-6 pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={onSignOut}>
                    Sign out and return later
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* MFA Enrollment Component */}
          <MFAEnrollment />

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );
  }

  // Fallback: if enrolled but currentLevel is not aal2 and no passkey verified, show verification
  if (isTOTPEnrolled && currentLevel === "aal1" && !isPasskeyVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <MFAVerification
          onSuccess={() => {
            fetchMFAStatus();
          }}
          onCancel={onSignOut}
        />
      </div>
    );
  }

  // Default: allow access (shouldn't reach here normally)
  return <>{children}</>;
}
