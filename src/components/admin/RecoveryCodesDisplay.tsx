import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
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
} from "@/components/ui/alert-dialog";
import { Copy, Check, Download, RefreshCw, Key, Shield, Loader2, RotateCcw } from "lucide-react";
import { useRecoveryCodes } from "@/hooks/useRecoveryCodes";
import { useMFA } from "@/hooks/useMFA";
import { useToast } from "@/hooks/use-toast";
import ReauthDialog from "./ReauthDialog";

export default function RecoveryCodesDisplay() {
  const { toast } = useToast();
  const { isEnrolled, isLoading: mfaLoading } = useMFA();
  const {
    generatedCodes,
    unusedCount,
    isLoading,
    generateRecoveryCodes,
    clearDisplayedCodes,
    fetchUnusedCount,
  } = useRecoveryCodes();

  const [showCodesDialog, setShowCodesDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [showReauthDialog, setShowReauthDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<"generate" | "rotate" | null>(null);

  // Fetch count when enrolled
  useEffect(() => {
    if (isEnrolled && !mfaLoading) {
      fetchUnusedCount();
    }
  }, [isEnrolled, mfaLoading, fetchUnusedCount]);

  const handleGenerateCodes = async () => {
    const result = await generateRecoveryCodes();
    if (result.success) {
      setShowCodesDialog(true);
      setAcknowledged(false);
      setPendingAction(null);
      toast({
        title: "Recovery Codes Generated",
        description: "Please save these codes in a secure location.",
      });
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to generate recovery codes",
        variant: "destructive",
      });
    }
  };

  // Initiate generate (first time - no re-auth needed)
  const handleInitiateGenerate = () => {
    setPendingAction("generate");
    setShowConfirmDialog(true);
  };

  // Initiate rotate (has codes - needs re-auth)
  const handleInitiateRotate = () => {
    setPendingAction("rotate");
    setShowReauthDialog(true);
  };

  // After successful re-auth, show confirmation dialog
  const handleReauthSuccess = () => {
    setShowConfirmDialog(true);
  };

  // After confirming, actually generate the codes
  const handleConfirmAction = () => {
    setShowConfirmDialog(false);
    handleGenerateCodes();
  };

  const handleCopyAll = () => {
    const codesText = generatedCodes.join("\n");
    navigator.clipboard.writeText(codesText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "Recovery codes copied to clipboard",
    });
  };

  const handleDownload = () => {
    const codesText = [
      "Buoyancis MFA Recovery Codes",
      "================================",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      "Keep these codes in a safe place. Each code can only be used once.",
      "",
      ...generatedCodes.map((code, i) => `${i + 1}. ${code}`),
      "",
      "If you lose access to your authenticator app, use one of these codes to sign in.",
    ].join("\n");

    const blob = new Blob([codesText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `buoyancis-recovery-codes-${new Date().toISOString().split("T")[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded",
      description: "Recovery codes saved to file",
    });
  };

  const handleCloseDialog = () => {
    if (acknowledged) {
      setShowCodesDialog(false);
      clearDisplayedCodes();
    }
  };

  if (!isEnrolled) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Key className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Recovery Codes</CardTitle>
                <CardDescription>
                  Backup codes for when you lose access to your authenticator
                </CardDescription>
              </div>
            </div>
            {unusedCount > 0 && (
              <Badge variant="outline" className="gap-1.5">
                <Shield className="h-3.5 w-3.5" />
                {unusedCount} remaining
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {unusedCount === 0 ? (
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <Key className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm">
                <strong className="text-amber-700 dark:text-amber-500">No recovery codes available.</strong>{" "}
                Generate backup codes to ensure you can access your account if you lose your authenticator.
              </AlertDescription>
            </Alert>
          ) : (
            <p className="text-sm text-muted-foreground">
              You have {unusedCount} unused recovery code{unusedCount !== 1 ? "s" : ""}. 
              Each code can only be used once to sign in when you don't have access to your authenticator app.
            </p>
          )}

          <div className="flex gap-2 flex-wrap">
            {unusedCount === 0 ? (
              <Button 
                variant="default" 
                disabled={isLoading}
                onClick={handleInitiateGenerate}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Generate Codes
              </Button>
            ) : (
              <Button 
                variant="outline" 
                disabled={isLoading}
                onClick={handleInitiateRotate}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                Rotate Codes
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Re-authentication Dialog (for rotation) */}
      <ReauthDialog
        open={showReauthDialog}
        onOpenChange={setShowReauthDialog}
        onSuccess={handleReauthSuccess}
        title="Confirm Identity"
        description="For security, please re-enter your password before rotating recovery codes."
      />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction === "generate" ? "Generate Recovery Codes?" : "Rotate Recovery Codes?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction === "rotate" && (
                <span className="text-destructive font-medium">
                  This will invalidate all existing recovery codes.{" "}
                </span>
              )}
              You'll receive 10 new one-time use codes. Make sure to save them in a secure location.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmAction}>
              {pendingAction === "generate" ? "Generate" : "Rotate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Recovery Codes Display Dialog */}
      <Dialog open={showCodesDialog} onOpenChange={(open) => !open && handleCloseDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Your Recovery Codes
            </DialogTitle>
            <DialogDescription>
              Save these codes in a secure location. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="bg-amber-500/10 border-amber-500/30">
              <AlertDescription className="text-sm text-amber-700 dark:text-amber-400">
                <strong>Important:</strong> These codes will only be shown once. 
                Copy or download them now.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {generatedCodes.map((code, index) => (
                <div 
                  key={index} 
                  className="px-3 py-2 bg-background rounded border text-center"
                >
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopyAll}>
                {copied ? (
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="mr-2 h-4 w-4" />
                )}
                {copied ? "Copied!" : "Copy All"}
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5"
              />
              <span className="text-sm">
                I have saved these recovery codes in a secure location
              </span>
            </label>
          </div>

          <DialogFooter>
            <Button onClick={handleCloseDialog} disabled={!acknowledged}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
