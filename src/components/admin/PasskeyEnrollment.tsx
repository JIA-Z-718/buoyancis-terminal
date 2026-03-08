import { useState } from "react";
import { usePasskey } from "@/hooks/usePasskey";
import { useAuth } from "@/hooks/useAuth";
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
import { Fingerprint, Plus, Trash2, Loader2, KeyRound, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import RelativeTime from "@/components/RelativeTime";

interface PasskeyEnrollmentProps {
  onEnrollmentComplete?: () => void;
}

export default function PasskeyEnrollment({ onEnrollmentComplete }: PasskeyEnrollmentProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const {
    passkeys,
    hasPasskeys,
    isLoading,
    error,
    isSupported,
    registerPasskey,
    deletePasskey,
    authenticateWithPasskey,
  } = usePasskey();

  const [showNameDialog, setShowNameDialog] = useState(false);
  const [passkeyName, setPasskeyName] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleStartRegistration = () => {
    setPasskeyName("");
    setShowNameDialog(true);
  };

  const handleRegisterPasskey = async () => {
    if (!passkeyName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for this passkey",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);
    const result = await registerPasskey(passkeyName.trim());
    setIsRegistering(false);

    if (result.success) {
      setShowNameDialog(false);
      toast({
        title: "Passkey Added",
        description: "Your passkey has been registered successfully.",
      });
      onEnrollmentComplete?.();
    } else {
      toast({
        title: "Registration Failed",
        description: result.error || "Could not register passkey",
        variant: "destructive",
      });
    }
  };

  const handleAuthenticate = async () => {
    setIsAuthenticating(true);
    const result = await authenticateWithPasskey();
    setIsAuthenticating(false);

    if (result.success) {
      toast({
        title: "Passkey Verified",
        description: "Successfully authenticated with passkey.",
      });
      onEnrollmentComplete?.();
    } else {
      toast({
        title: "Authentication Failed",
        description: result.error || "Could not verify passkey",
        variant: "destructive",
      });
    }
  };

  const handleDeletePasskey = async (passkeyId: string, name: string) => {
    const result = await deletePasskey(passkeyId);
    if (result.success) {
      toast({
        title: "Passkey Removed",
        description: `"${name}" has been removed from your account.`,
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Could not remove passkey",
        variant: "destructive",
      });
    }
  };

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Fingerprint className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">Passkeys</CardTitle>
              <CardDescription>Not supported in this browser</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Your browser doesn't support passkeys (WebAuthn). Try using a modern browser like 
              Chrome, Safari, or Edge to use this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Fingerprint className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Passkeys</CardTitle>
                <CardDescription>
                  Use biometrics or your device's screen lock for quick, secure access
                </CardDescription>
              </div>
            </div>
            {hasPasskeys && (
              <Badge variant="default" className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {passkeys.length} registered
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

          {hasPasskeys ? (
            <div className="space-y-4">
              {/* List of registered passkeys */}
              <div className="space-y-2">
                {passkeys.map((passkey) => (
                  <div
                    key={passkey.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <KeyRound className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">
                          {passkey.friendly_name || "Passkey"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Added <RelativeTime date={passkey.created_at} />
                          {passkey.last_used_at && (
                            <> · Last used <RelativeTime date={passkey.last_used_at} /></>
                          )}
                        </p>
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Passkey?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove "{passkey.friendly_name || "Passkey"}" from your account. 
                            You won't be able to use it to sign in anymore.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeletePasskey(passkey.id, passkey.friendly_name || "Passkey")}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>

              {/* Add another passkey button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleStartRegistration}
                disabled={isLoading || isRegistering}
                className="w-full sm:w-auto"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Passkey
              </Button>

              {/* Verify button for MFA */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleAuthenticate}
                  disabled={isLoading || isAuthenticating}
                  className="w-full"
                >
                  {isAuthenticating ? (
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
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Passkeys are a more secure and convenient alternative to passwords. 
                Use your device's fingerprint sensor, Face ID, or screen lock.
              </p>

              <div className="flex items-start gap-3 p-4 rounded-lg border bg-blue-500/10 border-blue-500/30">
                <Fingerprint className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium text-blue-700 dark:text-blue-400">Why use passkeys?</p>
                  <ul className="text-muted-foreground mt-1 space-y-1 list-disc list-inside">
                    <li>More secure than passwords or SMS codes</li>
                    <li>Quick authentication with biometrics</li>
                    <li>Works across your devices</li>
                    <li>Resistant to phishing attacks</li>
                  </ul>
                </div>
              </div>

              <Button
                onClick={handleStartRegistration}
                disabled={isLoading || isRegistering}
                className="w-full sm:w-auto"
              >
                {isRegistering ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  <>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    Add a Passkey
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Name Your Passkey</DialogTitle>
            <DialogDescription>
              Give this passkey a name to help you identify it later (e.g., "MacBook Pro", "iPhone").
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="passkey-name">Passkey Name</Label>
              <Input
                id="passkey-name"
                placeholder="e.g., MacBook Pro"
                value={passkeyName}
                onChange={(e) => setPasskeyName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRegisterPasskey()}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowNameDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRegisterPasskey}
              disabled={isRegistering || !passkeyName.trim()}
            >
              {isRegistering ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
