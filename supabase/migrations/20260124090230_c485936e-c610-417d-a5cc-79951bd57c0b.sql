-- Add notification settings for Slack and webhooks
INSERT INTO public.alert_email_template (setting_key, setting_value, description) VALUES
  ('slack_channel', '', 'Slack channel ID for alert notifications (leave empty to disable)'),
  ('webhook_url', '', 'Custom webhook URL for alert notifications (leave empty to disable)')
ON CONFLICT (setting_key) DO NOTHING;