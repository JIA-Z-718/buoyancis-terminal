import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldAlert, Loader2, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MFASetting {
  id: string;
  setting_key: string;
  setting_value: boolean;
  description: string | null;
  updated_at: string;
}

export default function MFAEnforcementSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [setting, setSetting] = useState<MFASetting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSetting();
  }, []);

  const fetchSetting = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("mfa_settings")
        .select("*")
        .eq("setting_key", "mfa_required_for_admin")
        .single();

      if (fetchError) throw fetchError;
      setSetting(data);
    } catch (err) {
      console.error("Error fetching MFA setting:", err);
      setError("Failed to load MFA settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async (newValue: boolean) => {
    if (!setting || !user) return;

    try {
      setIsUpdating(true);
      setError(null);

      const { error: updateError } = await supabase
        .from("mfa_settings")
        .update({
          setting_value: newValue,
          updated_by: user.id,
        })
        .eq("id", setting.id);

      if (updateError) throw updateError;

      setSetting({ ...setting, setting_value: newValue });

      toast({
        title: newValue ? "MFA Enforcement Enabled" : "MFA Enforcement Disabled",
        description: newValue
          ? "All admin users will now be required to set up MFA."
          : "MFA is now optional for admin users.",
      });
    } catch (err) {
      console.error("Error updating MFA setting:", err);
      setError("Failed to update MFA settings");
      toast({
        title: "Error",
        description: "Failed to update MFA settings",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ShieldAlert className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">MFA Enforcement Policy</CardTitle>
              <CardDescription>
                Configure whether MFA is required for admin access
              </CardDescription>
            </div>
          </div>
          {setting?.setting_value ? (
            <Badge variant="default" className="gap-1.5">
              <Shield className="h-3.5 w-3.5" />
              Required
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1.5">
              Optional
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div className="space-y-1">
            <Label htmlFor="mfa-enforcement" className="text-base font-medium">
              Require MFA for Admin Access
            </Label>
            <p className="text-sm text-muted-foreground">
              When enabled, admins must set up two-factor authentication before accessing the dashboard
            </p>
          </div>
          <Switch
            id="mfa-enforcement"
            checked={setting?.setting_value ?? true}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
        </div>

        <Alert className="bg-amber-500/10 border-amber-500/30">
          <Info className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-sm">
            <strong className="text-amber-700 dark:text-amber-500">Security Recommendation:</strong>{" "}
            We strongly recommend keeping MFA enforcement enabled to protect sensitive admin features
            from unauthorized access.
          </AlertDescription>
        </Alert>

        {setting && (
          <p className="text-xs text-muted-foreground">
            Last updated: {new Date(setting.updated_at).toLocaleString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
