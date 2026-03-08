import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useHighlightSettings, DURATION_OPTIONS, type HighlightSettings } from "@/hooks/useHighlightSettings";
import { Sparkles, RotateCcw, Users, MessageSquare, Bell } from "lucide-react";

interface SettingRowProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}

function SettingRow({ icon, label, description, value, onChange }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">{icon}</div>
        <div className="space-y-1">
          <Label className="text-sm font-medium">{label}</Label>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <Select
        value={String(value)}
        onValueChange={(val) => onChange(Number(val))}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DURATION_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={String(option.value)}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function HighlightDurationSettings() {
  const { settings, updateSetting, resetToDefaults, defaultSettings } = useHighlightSettings();

  const hasChanges = 
    settings.signups !== defaultSettings.signups ||
    settings.feedback !== defaultSettings.feedback ||
    settings.notifications !== defaultSettings.notifications;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5" />
              Highlight Duration
            </CardTitle>
            <CardDescription>
              Configure how long new items stay highlighted in real-time tables
            </CardDescription>
          </div>
          {hasChanges && (
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToDefaults}
              className="text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="divide-y">
          <SettingRow
            icon={<Users className="h-4 w-4" />}
            label="Signups Table"
            description="Early access signup entries"
            value={settings.signups}
            onChange={(val) => updateSetting("signups", val)}
          />
          <SettingRow
            icon={<MessageSquare className="h-4 w-4" />}
            label="Feedback Table"
            description="User feedback entries"
            value={settings.feedback}
            onChange={(val) => updateSetting("feedback", val)}
          />
          <SettingRow
            icon={<Bell className="h-4 w-4" />}
            label="Notifications Table"
            description="Notification history entries"
            value={settings.notifications}
            onChange={(val) => updateSetting("notifications", val)}
          />
        </div>
      </CardContent>
    </Card>
  );
}
