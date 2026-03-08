-- Add bot detection spike threshold to alert_settings
INSERT INTO public.alert_settings (setting_key, setting_value, description)
VALUES ('bot_detection_spike_threshold', 50, 'Number of bot detection events per hour that triggers a spike alert')
ON CONFLICT (setting_key) DO NOTHING;

-- Add unique constraint on setting_key if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alert_settings_setting_key_key'
  ) THEN
    ALTER TABLE public.alert_settings ADD CONSTRAINT alert_settings_setting_key_key UNIQUE (setting_key);
  END IF;
END $$;