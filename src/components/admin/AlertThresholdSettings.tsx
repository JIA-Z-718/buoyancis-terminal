import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Settings, Loader2, Save } from "lucide-react";

interface ThresholdSetting {
  id: string;
  setting_key: string;
  setting_value: number;
  description: string | null;
}

interface AlertThresholdSettingsProps {
  onSettingsUpdated?: () => void;
}

const AlertThresholdSettings = ({ onSettingsUpdated }: AlertThresholdSettingsProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<ThresholdSetting[]>([]);
  const [editedValues, setEditedValues] = useState<Record<string, number>>({});
  const { toast } = useToast();

  const fetchSettings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("alert_settings")
      .select("*")
      .order("setting_key");

    if (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error loading settings",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSettings(data || []);
      const values: Record<string, number> = {};
      (data || []).forEach((s) => {
        values[s.setting_key] = s.setting_value;
      });
      setEditedValues(values);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const handleValueChange = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setEditedValues((prev) => ({ ...prev, [key]: numValue }));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Update each setting
      for (const setting of settings) {
        const newValue = editedValues[setting.setting_key];
        if (newValue !== setting.setting_value) {
          const { error } = await supabase
            .from("alert_settings")
            .update({
              setting_value: newValue,
              updated_at: new Date().toISOString(),
            })
            .eq("id", setting.id);

          if (error) throw error;
        }
      }

      toast({
        title: "Settings saved",
        description: "Alert thresholds have been updated.",
      });

      onSettingsUpdated?.();
      setIsOpen(false);
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      bounce_rate_warning: "Bounce Rate Warning",
      bounce_rate_critical: "Bounce Rate Critical",
      complaint_rate_warning: "Complaint Rate Warning",
      complaint_rate_critical: "Complaint Rate Critical",
      unsubscribe_rate_warning: "Unsubscribe Rate Warning",
      cron_success_rate_warning: "Cron Success Rate Warning",
      bot_detection_spike_threshold: "Bot Detection Spike",
    };
    return labels[key] || key;
  };

  const getSettingHint = (key: string): string => {
    const hints: Record<string, string> = {
      bounce_rate_warning: "Recommended: 2%",
      bounce_rate_critical: "Recommended: 5%",
      complaint_rate_warning: "Recommended: 0.1%",
      complaint_rate_critical: "Recommended: 0.5%",
      unsubscribe_rate_warning: "Recommended: 1%",
      cron_success_rate_warning: "Alert when below this % (Recommended: 80%)",
      bot_detection_spike_threshold: "Events/hour threshold (Recommended: 50)",
    };
    return hints[key] || "";
  };

  const isCountBasedSetting = (key: string): boolean => {
    return key === "bot_detection_spike_threshold";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Settings className="h-4 w-4" />
          Thresholds
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Alert Thresholds</DialogTitle>
          <DialogDescription>
            Customize when deliverability alerts are triggered. Values are percentages.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {settings.map((setting) => (
              <div key={setting.id} className="space-y-2">
                <Label htmlFor={setting.setting_key} className="text-sm font-medium">
                  {getSettingLabel(setting.setting_key)}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={setting.setting_key}
                    type="number"
                    step={isCountBasedSetting(setting.setting_key) ? "1" : "0.01"}
                    min="0"
                    value={editedValues[setting.setting_key] ?? setting.setting_value}
                    onChange={(e) => handleValueChange(setting.setting_key, e.target.value)}
                    className="w-24"
                  />
                  {!isCountBasedSetting(setting.setting_key) && (
                    <span className="text-sm text-muted-foreground">%</span>
                  )}
                  {isCountBasedSetting(setting.setting_key) && (
                    <span className="text-sm text-muted-foreground">events/hr</span>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {getSettingHint(setting.setting_key)}
                  </span>
                </div>
              </div>
            ))}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AlertThresholdSettings;
