import { useState, useEffect } from "react";
import { useSMSMFA } from "@/hooks/useSMSMFA";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MessageSquare, Phone, ShieldCheck, ShieldOff, Loader2, Check, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Common country codes
const COUNTRY_CODES = [
  { code: "+1", country: "US/Canada" },
  { code: "+44", country: "UK" },
  { code: "+49", country: "Germany" },
  { code: "+33", country: "France" },
  { code: "+39", country: "Italy" },
  { code: "+34", country: "Spain" },
  { code: "+31", country: "Netherlands" },
  { code: "+32", country: "Belgium" },
  { code: "+41", country: "Switzerland" },
  { code: "+43", country: "Austria" },
  { code: "+46", country: "Sweden" },
  { code: "+47", country: "Norway" },
  { code: "+45", country: "Denmark" },
  { code: "+358", country: "Finland" },
  { code: "+48", country: "Poland" },
  { code: "+61", country: "Australia" },
  { code: "+64", country: "New Zealand" },
  { code: "+81", country: "Japan" },
  { code: "+82", country: "South Korea" },
  { code: "+86", country: "China" },
  { code: "+91", country: "India" },
  { code: "+65", country: "Singapore" },
  { code: "+852", country: "Hong Kong" },
  { code: "+55", country: "Brazil" },
  { code: "+52", country: "Mexico" },
];

interface SMSEnrollmentProps {
  onEnrollmentComplete?: () => void;
}

export default function SMSEnrollment({ onEnrollmentComplete }: SMSEnrollmentProps) {
  const { toast } = useToast();
  const {
    phoneNumber,
    isEnrolled,
    isLoading,
    error,
    isSendingCode,
    isVerifyingCode,
    codeExpiresAt,
    sendVerificationCode,
    verifyCode,
    removePhoneNumber,
  } = useSMSMFA();

  const [showEnrollDialog, setShowEnrollDialog] = useState(false);
  const [step, setStep] = useState<"phone" | "verify">("phone");
  const [countryCode, setCountryCode] = useState("+1");
  const [inputPhoneNumber, setInputPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [countdown, setCountdown] = useState(0);

  // Countdown timer for code expiry
  useEffect(() => {
    if (!codeExpiresAt) {
      setCountdown(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.floor((codeExpiresAt.getTime() - Date.now()) / 1000));
      setCountdown(remaining);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [codeExpiresAt]);

  const handleSendCode = async () => {
    if (!inputPhoneNumber) {
      toast({
        title: "Phone number required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }

    const result = await sendVerificationCode(inputPhoneNumber, countryCode, "phone_verification");
    if (result.success) {
      setStep("verify");
      toast({
        title: "Code sent",
        description: "A verification code has been sent to your phone",
      });
    } else {
      toast({
        title: "Failed to send code",
        description: result.error || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    const result = await verifyCode(verificationCode, "phone_verification");
    if (result.success) {
      setShowEnrollDialog(false);
      resetForm();
      toast({
        title: "SMS MFA enabled",
        description: "Your phone number has been verified and SMS authentication is now enabled.",
      });
      onEnrollmentComplete?.();
    } else {
      toast({
        title: "Verification failed",
        description: result.error || "Invalid code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async () => {
    const result = await removePhoneNumber();
    if (result.success) {
      toast({
        title: "SMS MFA disabled",
        description: "SMS authentication has been removed from your account.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Could not remove SMS MFA",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setStep("phone");
    setInputPhoneNumber("");
    setVerificationCode("");
  };

  const handleClose = () => {
    setShowEnrollDialog(false);
    resetForm();
  };

  const formatPhoneDisplay = () => {
    if (!phoneNumber) return "";
    const last4 = phoneNumber.phone_number.slice(-4);
    return `${phoneNumber.country_code} ••••••${last4}`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">SMS Authentication</CardTitle>
              <CardDescription>
                Receive verification codes via text message
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

        {isEnrolled && phoneNumber ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{formatPhoneDisplay()}</p>
                  <p className="text-xs text-muted-foreground">
                    Verified {phoneNumber.verified_at ? new Date(phoneNumber.verified_at).toLocaleDateString() : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Verified
                  </Badge>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                        Remove
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove SMS Authentication?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove SMS authentication from your account. You can re-enable it at any time with a new phone number.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleRemove}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Remove SMS MFA
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              You can use SMS verification as a backup method when signing in.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add your phone number to receive verification codes via SMS. This provides a backup authentication method if you can't access your authenticator app.
            </p>

            <div className="flex items-start gap-3 p-4 rounded-lg border bg-amber-500/10 border-amber-500/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-700 dark:text-amber-500">Backup Authentication Method</p>
                <p className="text-muted-foreground mt-1">
                  SMS is less secure than authenticator apps but provides a convenient backup option.
                </p>
              </div>
            </div>

            <Button onClick={() => setShowEnrollDialog(true)} disabled={isLoading} className="w-full sm:w-auto">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Add Phone Number
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>

      {/* Enrollment Dialog */}
      <Dialog open={showEnrollDialog} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {step === "phone" ? "Add Phone Number" : "Verify Phone Number"}
            </DialogTitle>
            <DialogDescription>
              {step === "phone"
                ? "Enter your phone number to receive verification codes via SMS."
                : "Enter the 6-digit code sent to your phone."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {step === "phone" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="country-code">Country</Label>
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRY_CODES.map(({ code, country }) => (
                        <SelectItem key={code} value={code}>
                          {code} ({country})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone-number">Phone Number</Label>
                  <Input
                    id="phone-number"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={inputPhoneNumber}
                    onChange={(e) => setInputPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Standard messaging rates may apply
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="000000"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                    className="text-center text-lg tracking-widest font-mono"
                  />
                  {countdown > 0 && (
                    <p className="text-xs text-muted-foreground text-center">
                      Code expires in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                    </p>
                  )}
                </div>

                <Button
                  variant="link"
                  onClick={() => {
                    setStep("phone");
                    setVerificationCode("");
                  }}
                  className="text-sm p-0 h-auto"
                  disabled={isSendingCode}
                >
                  Change phone number
                </Button>
              </>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {step === "phone" ? (
              <Button onClick={handleSendCode} disabled={!inputPhoneNumber || isSendingCode}>
                {isSendingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Code"
                )}
              </Button>
            ) : (
              <Button onClick={handleVerifyCode} disabled={verificationCode.length !== 6 || isVerifyingCode}>
                {isVerifyingCode ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Enable"
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
