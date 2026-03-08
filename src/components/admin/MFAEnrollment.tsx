import { useState } from "react";
import { useMFA } from "@/hooks/useMFA";
import { useMFATestMode, isDevelopment } from "@/hooks/useMFATestMode";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Shield, ShieldCheck, ShieldOff, Loader2, Copy, Check, Smartphone, Key, Fingerprint, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import MFATestModeBanner from "./MFATestModeBanner";
import MFATestModeToggle from "./MFATestModeToggle";
import PasskeyEnrollment from "./PasskeyEnrollment";
import SMSEnrollment from "./SMSEnrollment";

// Helper to send MFA change notification
async function notifyMFAChange(action: "enabled" | "disabled", userEmail: string, userName?: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return;

    await supabase.functions.invoke("notify-mfa-change", {
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: { action, userEmail, userName },
    });
  } catch (error) {
    console.error("Failed to send MFA change notification:", error);
  }
}

interface MFAEnrollmentProps {
  onEnrollmentComplete?: () => void;
}

export default function MFAEnrollment({ onEnrollmentComplete }: MFAEnrollmentProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Real MFA hook
  const realMFA = useMFA();
  
  // Test mode hook
  const testMFA = useMFATestMode();
  
  // Use test mode if active, otherwise use real MFA
  const mfa = testMFA.isTestMode ? testMFA : realMFA;
  
  const {
    isEnrolled,
    factors,
    isLoading,
    error,
    enrollmentData,
    startEnrollment,
    verifyEnrollment,
    cancelEnrollment,
    unenroll,
    currentLevel,
  } = mfa;

  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [showEnrollDialog, setShowEnrollDialog] = useState(false);

  const handleStartEnrollment = async () => {
    const result = await startEnrollment("Buoyancis Admin");
    if (result.success) {
      setShowEnrollDialog(true);
    } else {
      toast({
        title: "Enrollment Failed",
        description: result.error || "Could not start MFA enrollment",
        variant: "destructive",
      });
    }
  };

  const handleVerifyEnrollment = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    const result = await verifyEnrollment(verificationCode);
    setIsVerifying(false);

    if (result.success) {
      setShowEnrollDialog(false);
      setVerificationCode("");
      toast({
        title: "MFA Enabled",
        description: testMFA.isTestMode 
          ? "Test mode: MFA enrollment simulated successfully."
          : "Two-factor authentication has been successfully enabled for your account.",
      });
      // Send notification email (skip in test mode)
      if (user?.email && !testMFA.isTestMode) {
        notifyMFAChange("enabled", user.email, user.user_metadata?.display_name);
      }
      // Notify parent of completion
      onEnrollmentComplete?.();
    } else {
      toast({
        title: "Verification Failed",
        description: result.error || "Invalid code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEnrollment = async () => {
    await cancelEnrollment();
    setShowEnrollDialog(false);
    setVerificationCode("");
  };

  const handleCopySecret = () => {
    if (enrollmentData?.secret) {
      navigator.clipboard.writeText(enrollmentData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
      toast({
        title: "Copied",
        description: "Secret key copied to clipboard",
      });
    }
  };

  const handleUnenroll = async (factorId: string) => {
    const result = await unenroll(factorId);
    if (result.success) {
      toast({
        title: "MFA Disabled",
        description: testMFA.isTestMode 
          ? "Test mode: MFA removal simulated successfully."
          : "Two-factor authentication has been removed from your account.",
      });
      // Send notification email (skip in test mode)
      if (user?.email && !testMFA.isTestMode) {
        notifyMFAChange("disabled", user.email, user.user_metadata?.display_name);
      }
    } else {
      toast({
        title: "Error",
        description: result.error || "Could not remove MFA",
        variant: "destructive",
      });
    }
  };

  const verifiedFactors = factors.filter((f: any) => f.status === "verified");

  return (
    <div className="space-y-6">
      {/* Test Mode Banner */}
      {testMFA.isTestMode && (
        <MFATestModeBanner 
          onDisable={testMFA.disableTestMode} 
          testCode={testMFA.TEST_VERIFICATION_CODE} 
        />
      )}

      {/* Tabbed interface for different MFA methods */}
      <Tabs defaultValue="totp" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="totp" className="gap-2">
            <Smartphone className="h-4 w-4" />
            Authenticator
          </TabsTrigger>
          <TabsTrigger value="sms" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            SMS
          </TabsTrigger>
          <TabsTrigger value="passkey" className="gap-2">
            <Fingerprint className="h-4 w-4" />
            Passkey
          </TabsTrigger>
        </TabsList>

        {/* TOTP Tab */}
        <TabsContent value="totp" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Authenticator App</CardTitle>
                    <CardDescription>
                      Use an app like Google Authenticator or Authy
                    </CardDescription>
                  </div>
                </div>
                {isEnrolled ? (
                  <Badge variant="default" className="gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1.5">
                    <ShieldOff className="h-3.5 w-3.5" />
                    Disabled
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {isEnrolled ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-lg border bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {testMFA.isTestMode ? "Test Authenticator" : "Authenticator App"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {testMFA.isTestMode ? "Test mode - simulated enrollment" : "Added recently"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {currentLevel === "aal2" && (
                          <Badge variant="outline" className="text-xs">
                            Verified
                          </Badge>
                        )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              Remove
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove Two-Factor Authentication?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove the authenticator app from your account. You can re-enable it at any time.
                                Your account will be less secure without MFA.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => verifiedFactors[0] && handleUnenroll(verifiedFactors[0].id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Remove MFA
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {testMFA.isTestMode 
                      ? "Test mode: You can now test the MFA verification flow."
                      : "You'll be asked to enter a verification code from your authenticator app when signing in."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Protect your admin account with two-factor authentication using an authenticator app like 
                    Google Authenticator, Authy, or 1Password.
                  </p>

                  <div className="flex items-start gap-3 p-4 rounded-lg border bg-amber-500/10 border-amber-500/30">
                    <Key className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-700 dark:text-amber-500">Recommended for Admin Accounts</p>
                      <p className="text-muted-foreground mt-1">
                        As an admin, enabling MFA significantly reduces the risk of unauthorized access to sensitive data.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Button onClick={handleStartEnrollment} disabled={isLoading} className="w-full sm:w-auto">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Setting up...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-4 w-4" />
                          Enable Two-Factor Authentication
                        </>
                      )}
                    </Button>
                    
                    {/* Test Mode Toggle - only visible in development */}
                    <MFATestModeToggle 
                      isTestMode={testMFA.isTestMode} 
                      onEnable={testMFA.enableTestMode} 
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SMS Tab */}
        <TabsContent value="sms" className="mt-4">
          <SMSEnrollment onEnrollmentComplete={onEnrollmentComplete} />
        </TabsContent>

        {/* Passkey Tab */}
        <TabsContent value="passkey" className="mt-4">
          <PasskeyEnrollment onEnrollmentComplete={onEnrollmentComplete} />
        </TabsContent>
      </Tabs>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={(open) => !open && handleCancelEnrollment()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {testMFA.isTestMode ? "Test Mode: Set Up Authenticator" : "Set Up Authenticator App"}
            </DialogTitle>
            <DialogDescription>
              {testMFA.isTestMode 
                ? `Simulated enrollment. Enter code ${testMFA.TEST_VERIFICATION_CODE} to complete.`
                : "Scan the QR code with your authenticator app, then enter the verification code."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {enrollmentData?.qrCode && (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg">
                  <img 
                    src={enrollmentData.qrCode} 
                    alt="MFA QR Code" 
                    className="w-48 h-48"
                  />
                </div>

                <div className="text-center space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {testMFA.isTestMode 
                      ? "This is a demo QR code for testing purposes."
                      : "Can't scan the code? Enter this key manually:"}
                  </p>
                  <div className="flex items-center gap-2 justify-center">
                    <code className="px-2 py-1 bg-muted rounded text-xs font-mono break-all max-w-[200px]">
                      {enrollmentData.secret}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCopySecret}
                    >
                      {copiedSecret ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="verification-code">Verification Code</Label>
              <Input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                placeholder={testMFA.isTestMode ? testMFA.TEST_VERIFICATION_CODE : "000000"}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                className="text-center text-lg tracking-widest font-mono"
              />
              <p className="text-xs text-muted-foreground text-center">
                {testMFA.isTestMode 
                  ? `Enter ${testMFA.TEST_VERIFICATION_CODE} to complete test enrollment`
                  : "Enter the 6-digit code from your authenticator app"}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancelEnrollment}>
              Cancel
            </Button>
            <Button 
              onClick={handleVerifyEnrollment} 
              disabled={verificationCode.length !== 6 || isVerifying}
            >
              {isVerifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify & Enable"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
