import { useState, useEffect } from "react";
import { useMFA } from "@/hooks/useMFA";
import { useRecoveryCodes } from "@/hooks/useRecoveryCodes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, ArrowLeft, Key, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

interface MFAVerificationProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export default function MFAVerification({ onSuccess, onCancel }: MFAVerificationProps) {
  const { verifyMFA, isLoading, error } = useMFA();
  const { 
    verifyRecoveryCode, 
    isLoading: isRecoveryLoading, 
    remainingAttempts,
    rateLimited,
    retryAfterSeconds,
  } = useRecoveryCodes();
  
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const [displayRemainingAttempts, setDisplayRemainingAttempts] = useState<number | null>(null);

  // Update displayed attempts when hook value changes
  useEffect(() => {
    if (useRecoveryCode && remainingAttempts !== undefined) {
      setDisplayRemainingAttempts(remainingAttempts);
    }
  }, [useRecoveryCode, remainingAttempts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (useRecoveryCode) {
      // Validate recovery code format (XXXX-XXXX)
      const cleanCode = code.replace(/\s/g, "").toUpperCase();
      if (!/^[A-Z0-9]{4}-?[A-Z0-9]{4}$/.test(cleanCode)) {
        setLocalError("Please enter a valid recovery code (format: XXXX-XXXX)");
        return;
      }

      setIsVerifying(true);
      const result = await verifyRecoveryCode(cleanCode);
      setIsVerifying(false);

      if (result.success) {
        onSuccess();
      } else {
        setLocalError(result.error || "Invalid or already used recovery code");
        setCode("");
        // Update displayed remaining attempts from the result
        if (result.remainingAttempts !== undefined) {
          setDisplayRemainingAttempts(result.remainingAttempts);
        }
      }
    } else {
      if (code.length !== 6) {
        setLocalError("Please enter a 6-digit code");
        return;
      }

      setIsVerifying(true);
      const result = await verifyMFA(code);
      setIsVerifying(false);

      if (result.success) {
        onSuccess();
      } else {
        setLocalError(result.error || "Invalid verification code");
        setCode("");
      }
    }
  };

  const toggleRecoveryMode = () => {
    setUseRecoveryCode(!useRecoveryCode);
    setCode("");
    setLocalError(null);
    setDisplayRemainingAttempts(null);
  };

  // Determine warning level based on remaining attempts
  const getAttemptsWarningLevel = (): 'none' | 'warning' | 'danger' => {
    if (displayRemainingAttempts === null) return 'none';
    if (displayRemainingAttempts <= 1) return 'danger';
    if (displayRemainingAttempts <= 3) return 'warning';
    return 'none';
  };

  const attemptsWarningLevel = getAttemptsWarningLevel();

  const displayError = localError || error;
  const isProcessing = isLoading || isVerifying || isRecoveryLoading;

  return (
    <div className="w-full max-w-md">
      {onCancel && (
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>
      )}

      <div className="glass-card p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            {useRecoveryCode ? (
              <Key className="h-6 w-6 text-primary" />
            ) : (
              <Shield className="h-6 w-6 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-2xl font-serif text-foreground">
              {useRecoveryCode ? "Recovery Code" : "Two-Factor Authentication"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {useRecoveryCode 
                ? "Enter one of your backup recovery codes" 
                : "Enter the code from your authenticator app"}
            </p>
          </div>
        </div>

        {displayError && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{displayError}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mfa-code">
              {useRecoveryCode ? "Recovery Code" : "Verification Code"}
            </Label>
            {useRecoveryCode ? (
              <Input
                id="mfa-code"
                type="text"
                placeholder="XXXX-XXXX"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-xl tracking-widest font-mono h-14"
                autoFocus
                required
              />
            ) : (
              <Input
                id="mfa-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder="000000"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-2xl tracking-[0.5em] font-mono h-14"
                autoFocus
                autoComplete="one-time-code"
                required
              />
            )}
            <p className="text-xs text-muted-foreground text-center">
              {useRecoveryCode 
                ? "Enter a recovery code from your saved backup codes"
                : "Enter the 6-digit code from your authenticator app"}
            </p>

            {/* Remaining attempts indicator for recovery codes */}
            {useRecoveryCode && displayRemainingAttempts !== null && !rateLimited && (
              <div className={`flex items-center justify-center gap-2 p-2 rounded-lg ${
                attemptsWarningLevel === 'danger' 
                  ? 'bg-destructive/10 text-destructive' 
                  : attemptsWarningLevel === 'warning'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {attemptsWarningLevel !== 'none' && (
                  <AlertTriangle className="h-4 w-4" />
                )}
                <span className="text-xs font-medium">
                  {displayRemainingAttempts === 0 
                    ? "No attempts remaining"
                    : `${displayRemainingAttempts} attempt${displayRemainingAttempts !== 1 ? 's' : ''} remaining before lockout`
                  }
                </span>
              </div>
            )}

            {/* Rate limited message */}
            {useRecoveryCode && rateLimited && (
              <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-destructive/10 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">
                  Locked out. Try again in {Math.ceil(retryAfterSeconds / 60)} minute{Math.ceil(retryAfterSeconds / 60) !== 1 ? 's' : ''}.
                </span>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isProcessing || (useRecoveryCode ? code.length < 8 : code.length !== 6)}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={toggleRecoveryMode}
            className="text-sm text-primary hover:underline"
          >
            {useRecoveryCode 
              ? "Use authenticator app instead" 
              : "Use a recovery code"}
          </button>
        </div>

        {useRecoveryCode && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Recovery codes are one-time use. After using a code, it cannot be used again.
          </p>
        )}

        {!useRecoveryCode && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Lost access to your authenticator?{" "}
            <Link to="/auth/forgot-password" className="text-primary hover:underline">
              Contact support
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
