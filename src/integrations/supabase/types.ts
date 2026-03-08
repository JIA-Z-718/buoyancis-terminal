export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ab_test_variants: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          recipient_count: number
          subject: string
          variant_name: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          recipient_count?: number
          subject: string
          variant_name: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          recipient_count?: number
          subject?: string
          variant_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_test_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_access_audit_log: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          operation: string
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation: string
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          operation?: string
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      alert_email_template: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      alert_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      audit_anomaly_alerts: {
        Row: {
          alert_type: string
          description: string
          details: Json | null
          detected_at: string
          id: string
          ip_address: string | null
          notified_at: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          user_id: string | null
        }
        Insert: {
          alert_type: string
          description: string
          details?: Json | null
          detected_at?: string
          id?: string
          ip_address?: string | null
          notified_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          description?: string
          details?: Json | null
          detected_at?: string
          id?: string
          ip_address?: string | null
          notified_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      audit_anomaly_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string
          author_role: string | null
          content: string
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          scheduled_publish_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          author_role?: string | null
          content: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          scheduled_publish_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          author_role?: string | null
          content?: string
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          scheduled_publish_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      bot_detection_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      cron_failure_notifications: {
        Row: {
          id: string
          notified_at: string
          runid: number
        }
        Insert: {
          id?: string
          notified_at?: string
          runid: number
        }
        Update: {
          id?: string
          notified_at?: string
          runid?: number
        }
        Relationships: []
      }
      cron_job_thresholds: {
        Row: {
          created_at: string
          id: string
          jobid: number
          notifications_enabled: boolean
          threshold_value: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          jobid: number
          notifications_enabled?: boolean
          threshold_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          jobid?: number
          notifications_enabled?: boolean
          threshold_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      custom_music: {
        Row: {
          created_at: string
          file_path: string
          id: string
          is_public: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_path: string
          id?: string
          is_public?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_path?: string
          id?: string
          is_public?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_entropy_words: {
        Row: {
          created_at: string
          created_by: string | null
          decoded_string: string
          deep_analysis: string
          id: string
          interpretation: string
          recipient_count: number | null
          scheduled_date: string
          sent_at: string | null
          updated_at: string
          word: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          decoded_string: string
          deep_analysis: string
          id?: string
          interpretation: string
          recipient_count?: number | null
          scheduled_date: string
          sent_at?: string | null
          updated_at?: string
          word: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          decoded_string?: string
          deep_analysis?: string
          id?: string
          interpretation?: string
          recipient_count?: number | null
          scheduled_date?: string
          sent_at?: string | null
          updated_at?: string
          word?: string
        }
        Relationships: []
      }
      data_retention_settings: {
        Row: {
          description: string | null
          id: string
          is_enabled: boolean
          retention_days: number
          table_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          is_enabled?: boolean
          retention_days?: number
          table_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          is_enabled?: boolean
          retention_days?: number
          table_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      decay_events: {
        Row: {
          created_at: string
          days_since_observation: number
          decay_amount: number
          decay_formula: string
          frequency_after: number
          frequency_before: number
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          days_since_observation: number
          decay_amount: number
          decay_formula?: string
          frequency_after: number
          frequency_before: number
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          days_since_observation?: number
          decay_amount?: number
          decay_formula?: string
          frequency_after?: number
          frequency_before?: number
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      decode_history: {
        Row: {
          created_at: string
          decoded_at: string
          id: string
          is_favorite: boolean
          tags: string[] | null
          updated_at: string
          user_id: string
          word: string
        }
        Insert: {
          created_at?: string
          decoded_at?: string
          id?: string
          is_favorite?: boolean
          tags?: string[] | null
          updated_at?: string
          user_id: string
          word: string
        }
        Update: {
          created_at?: string
          decoded_at?: string
          id?: string
          is_favorite?: boolean
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          word?: string
        }
        Relationships: []
      }
      deliverability_alerts: {
        Row: {
          alert_type: string
          created_at: string
          escalated_at: string | null
          escalation_level: number | null
          id: string
          metric_value: number
          notified_at: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          threshold_value: number
        }
        Insert: {
          alert_type: string
          created_at?: string
          escalated_at?: string | null
          escalation_level?: number | null
          id?: string
          metric_value: number
          notified_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          threshold_value: number
        }
        Update: {
          alert_type?: string
          created_at?: string
          escalated_at?: string | null
          escalation_level?: number | null
          id?: string
          metric_value?: number
          notified_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          threshold_value?: number
        }
        Relationships: []
      }
      early_access_signups: {
        Row: {
          created_at: string
          daily_entropy_subscribed: boolean | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          created_at?: string
          daily_entropy_subscribed?: boolean | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          created_at?: string
          daily_entropy_subscribed?: boolean | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      email_bounces: {
        Row: {
          bounce_type: string
          bounced_at: string
          email: string
          id: string
          reason: string | null
          source_campaign_id: string | null
        }
        Insert: {
          bounce_type?: string
          bounced_at?: string
          email: string
          id?: string
          reason?: string | null
          source_campaign_id?: string | null
        }
        Update: {
          bounce_type?: string
          bounced_at?: string
          email?: string
          id?: string
          reason?: string | null
          source_campaign_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_bounces_source_campaign_id_fkey"
            columns: ["source_campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          body: string
          created_by: string | null
          id: string
          recipient_count: number
          sent_at: string
          subject: string
        }
        Insert: {
          body: string
          created_by?: string | null
          id?: string
          recipient_count?: number
          sent_at?: string
          subject: string
        }
        Update: {
          body?: string
          created_by?: string | null
          id?: string
          recipient_count?: number
          sent_at?: string
          subject?: string
        }
        Relationships: []
      }
      email_clicks: {
        Row: {
          campaign_id: string
          clicked_at: string
          id: string
          original_url: string
          recipient_email: string
          user_agent: string | null
          variant: string | null
        }
        Insert: {
          campaign_id: string
          clicked_at?: string
          id?: string
          original_url: string
          recipient_email: string
          user_agent?: string | null
          variant?: string | null
        }
        Update: {
          campaign_id?: string
          clicked_at?: string
          id?: string
          original_url?: string
          recipient_email?: string
          user_agent?: string | null
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_clicks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_complaints: {
        Row: {
          complained_at: string
          complaint_type: string
          email: string
          feedback_id: string | null
          id: string
          source_campaign_id: string | null
        }
        Insert: {
          complained_at?: string
          complaint_type?: string
          email: string
          feedback_id?: string | null
          id?: string
          source_campaign_id?: string | null
        }
        Update: {
          complained_at?: string
          complaint_type?: string
          email?: string
          feedback_id?: string | null
          id?: string
          source_campaign_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_complaints_source_campaign_id_fkey"
            columns: ["source_campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_opens: {
        Row: {
          campaign_id: string
          id: string
          opened_at: string
          recipient_email: string
          user_agent: string | null
          variant: string | null
        }
        Insert: {
          campaign_id: string
          id?: string
          opened_at?: string
          recipient_email: string
          user_agent?: string | null
          variant?: string | null
        }
        Update: {
          campaign_id?: string
          id?: string
          opened_at?: string
          recipient_email?: string
          user_agent?: string | null
          variant?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_opens_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_rate_limits: {
        Row: {
          email_type: string
          id: string
          recipient_email: string
          sender_context: string | null
          sent_at: string
        }
        Insert: {
          email_type: string
          id?: string
          recipient_email: string
          sender_context?: string | null
          sent_at?: string
        }
        Update: {
          email_type?: string
          id?: string
          recipient_email?: string
          sender_context?: string | null
          sent_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribes: {
        Row: {
          email: string
          id: string
          reason: string | null
          unsubscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          reason?: string | null
          unsubscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          reason?: string | null
          unsubscribed_at?: string
        }
        Relationships: []
      }
      entropy_cleaning_cycles: {
        Row: {
          bottom_tier_boost_percent: number | null
          completed_at: string | null
          created_at: string
          cycle_number: number
          deficiency_supplemented: number | null
          error_message: string | null
          excess_harvested: number | null
          id: string
          started_at: string
          status: string
          top_tier_reduction_percent: number | null
          total_frequency_redistributed: number | null
          users_affected: number | null
        }
        Insert: {
          bottom_tier_boost_percent?: number | null
          completed_at?: string | null
          created_at?: string
          cycle_number: number
          deficiency_supplemented?: number | null
          error_message?: string | null
          excess_harvested?: number | null
          id?: string
          started_at?: string
          status?: string
          top_tier_reduction_percent?: number | null
          total_frequency_redistributed?: number | null
          users_affected?: number | null
        }
        Update: {
          bottom_tier_boost_percent?: number | null
          completed_at?: string | null
          created_at?: string
          cycle_number?: number
          deficiency_supplemented?: number | null
          error_message?: string | null
          excess_harvested?: number | null
          id?: string
          started_at?: string
          status?: string
          top_tier_reduction_percent?: number | null
          total_frequency_redistributed?: number | null
          users_affected?: number | null
        }
        Relationships: []
      }
      escalation_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      event_checkins: {
        Row: {
          checked_in_at: string
          company: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          checked_in_at?: string
          company?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          checked_in_at?: string
          company?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      geo_restrictions: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          created_by: string | null
          id: string
          is_blocked: boolean
          reason: string | null
          region: string | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_blocked?: boolean
          reason?: string | null
          region?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_blocked?: boolean
          reason?: string | null
          region?: string | null
        }
        Relationships: []
      }
      ip_blocklist: {
        Row: {
          blocked_by: string | null
          created_at: string
          id: string
          ip_address: string
          reason: string | null
        }
        Insert: {
          blocked_by?: string | null
          created_at?: string
          id?: string
          ip_address: string
          reason?: string | null
        }
        Update: {
          blocked_by?: string | null
          created_at?: string
          id?: string
          ip_address?: string
          reason?: string | null
        }
        Relationships: []
      }
      mfa_enrollment_reminders: {
        Row: {
          created_at: string
          id: string
          reminder_type: string
          sent_at: string
          user_email: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reminder_type?: string
          sent_at?: string
          user_email: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reminder_type?: string
          sent_at?: string
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      mfa_recovery_code_secrets: {
        Row: {
          code_hash: string
          created_at: string
          id: string
          recovery_code_id: string
        }
        Insert: {
          code_hash: string
          created_at?: string
          id?: string
          recovery_code_id: string
        }
        Update: {
          code_hash?: string
          created_at?: string
          id?: string
          recovery_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mfa_recovery_code_secrets_recovery_code_id_fkey"
            columns: ["recovery_code_id"]
            isOneToOne: true
            referencedRelation: "mfa_recovery_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      mfa_recovery_codes: {
        Row: {
          created_at: string
          id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mfa_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      mfa_verification_events: {
        Row: {
          id: string
          ip_address: string | null
          method: string
          success: boolean
          user_agent: string | null
          user_id: string
          verified_at: string
        }
        Insert: {
          id?: string
          ip_address?: string | null
          method: string
          success?: boolean
          user_agent?: string | null
          user_id: string
          verified_at?: string
        }
        Update: {
          id?: string
          ip_address?: string | null
          method?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string
          verified_at?: string
        }
        Relationships: []
      }
      node_claims: {
        Row: {
          claimant_name: string
          claimed_at: string
          id: string
          ip_address: string | null
          node_id: string
          status: Database["public"]["Enums"]["node_claim_status"]
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          claimant_name: string
          claimed_at?: string
          id?: string
          ip_address?: string | null
          node_id: string
          status?: Database["public"]["Enums"]["node_claim_status"]
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          claimant_name?: string
          claimed_at?: string
          id?: string
          ip_address?: string | null
          node_id?: string
          status?: Database["public"]["Enums"]["node_claim_status"]
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      notification_history: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          recipients: string[]
          status: string
          subject: string | null
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type: string
          recipients: string[]
          status?: string
          subject?: string | null
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          recipients?: string[]
          status?: string
          subject?: string | null
          triggered_by?: string | null
        }
        Relationships: []
      }
      observation_events: {
        Row: {
          created_at: string
          event_type: string
          frequency_after: number
          frequency_before: number
          frequency_delta: number
          id: string
          ip_address: unknown
          quality_score: number | null
          target_entity_id: string | null
          target_entity_type: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          frequency_after: number
          frequency_before: number
          frequency_delta: number
          id?: string
          ip_address?: unknown
          quality_score?: number | null
          target_entity_id?: string | null
          target_entity_type?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          frequency_after?: number
          frequency_before?: number
          frequency_delta?: number
          id?: string
          ip_address?: unknown
          quality_score?: number | null
          target_entity_id?: string | null
          target_entity_type?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      passkey_challenges: {
        Row: {
          challenge: string
          created_at: string
          expires_at: string
          id: string
          session_id: string
          type: string
          user_id: string | null
        }
        Insert: {
          challenge: string
          created_at?: string
          expires_at?: string
          id?: string
          session_id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          challenge?: string
          created_at?: string
          expires_at?: string
          id?: string
          session_id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      passkey_credentials: {
        Row: {
          aaguid: string | null
          counter: number
          created_at: string
          credential_id: string
          device_type: string | null
          friendly_name: string | null
          id: string
          last_used_at: string | null
          public_key: string
          transports: string[] | null
          user_id: string
        }
        Insert: {
          aaguid?: string | null
          counter?: number
          created_at?: string
          credential_id: string
          device_type?: string | null
          friendly_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key: string
          transports?: string[] | null
          user_id: string
        }
        Update: {
          aaguid?: string | null
          counter?: number
          created_at?: string
          credential_id?: string
          device_type?: string | null
          friendly_name?: string | null
          id?: string
          last_used_at?: string | null
          public_key?: string
          transports?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          keyboard_shortcuts: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          keyboard_shortcuts?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          keyboard_shortcuts?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rate_limit_violations: {
        Row: {
          created_at: string
          function_name: string
          id: string
          ip_address: string
          max_requests: number
          request_count: number
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          ip_address: string
          max_requests: number
          request_count: number
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          ip_address?: string
          max_requests?: number
          request_count?: number
        }
        Relationships: []
      }
      recovery_code_attempts: {
        Row: {
          attempted_at: string
          id: string
          success: boolean
          user_id: string
        }
        Insert: {
          attempted_at?: string
          id?: string
          success?: boolean
          user_id: string
        }
        Update: {
          attempted_at?: string
          id?: string
          success?: boolean
          user_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          buoyancis_score: number | null
          category: string
          city: string
          created_at: string
          cuisine: string | null
          id: string
          image_url: string | null
          is_featured: boolean | null
          lat: number | null
          lng: number | null
          name: string
          name_cn: string | null
          phone: string | null
          region: string
          review_count: number | null
          slug: string
          traditional_score: number | null
          updated_at: string
          verified_review_count: number | null
          website: string | null
        }
        Insert: {
          address?: string | null
          buoyancis_score?: number | null
          category?: string
          city?: string
          created_at?: string
          cuisine?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          lat?: number | null
          lng?: number | null
          name: string
          name_cn?: string | null
          phone?: string | null
          region?: string
          review_count?: number | null
          slug: string
          traditional_score?: number | null
          updated_at?: string
          verified_review_count?: number | null
          website?: string | null
        }
        Update: {
          address?: string | null
          buoyancis_score?: number | null
          category?: string
          city?: string
          created_at?: string
          cuisine?: string | null
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          lat?: number | null
          lng?: number | null
          name?: string
          name_cn?: string | null
          phone?: string | null
          region?: string
          review_count?: number | null
          slug?: string
          traditional_score?: number | null
          updated_at?: string
          verified_review_count?: number | null
          website?: string | null
        }
        Relationships: []
      }
      retention_policy_audit_log: {
        Row: {
          changed_at: string
          changed_by: string | null
          field_changed: string
          id: string
          new_value: string | null
          old_value: string | null
          table_name: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          field_changed: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          table_name: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          field_changed?: string
          id?: string
          new_value?: string | null
          old_value?: string | null
          table_name?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          content: string
          content_cn: string | null
          created_at: string
          display_name: string | null
          helpful_count: number | null
          id: string
          is_local_expert: boolean | null
          is_verified: boolean | null
          rating: number
          restaurant_id: string
          trust_tier: number
          trust_weight: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          content_cn?: string | null
          created_at?: string
          display_name?: string | null
          helpful_count?: number | null
          id?: string
          is_local_expert?: boolean | null
          is_verified?: boolean | null
          rating: number
          restaurant_id: string
          trust_tier?: number
          trust_weight?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_cn?: string | null
          created_at?: string
          display_name?: string | null
          helpful_count?: number | null
          id?: string
          is_local_expert?: boolean | null
          is_verified?: boolean | null
          rating?: number
          restaurant_id?: string
          trust_tier?: number
          trust_weight?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
      role_audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          target_user_id?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          emails: string[]
          error_message: string | null
          id: string
          scheduled_for: string
          sent_at: string | null
          status: string
          subject: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          emails: string[]
          error_message?: string | null
          id?: string
          scheduled_for: string
          sent_at?: string | null
          status?: string
          subject: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          emails?: string[]
          error_message?: string | null
          id?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          subject?: string
        }
        Relationships: []
      }
      security_summary_schedules: {
        Row: {
          created_at: string
          day_of_week: number | null
          frequency: string
          id: string
          is_enabled: boolean
          last_sent_at: string | null
          recipient_emails: string[]
          time_of_day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          frequency?: string
          id?: string
          is_enabled?: boolean
          last_sent_at?: string | null
          recipient_emails?: string[]
          time_of_day?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          frequency?: string
          id?: string
          is_enabled?: boolean
          last_sent_at?: string | null
          recipient_emails?: string[]
          time_of_day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      signup_error_logs: {
        Row: {
          created_at: string
          email: string | null
          error_code: string | null
          error_details: string | null
          error_message: string | null
          first_name: string | null
          id: string
          last_name: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          error_code?: string | null
          error_details?: string | null
          error_message?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          error_code?: string | null
          error_details?: string | null
          error_message?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      sms_verification_codes: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          expires_at: string
          id: string
          max_attempts: number
          phone_number: string
          purpose: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          expires_at: string
          id?: string
          max_attempts?: number
          phone_number: string
          purpose: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          expires_at?: string
          id?: string
          max_attempts?: number
          phone_number?: string
          purpose?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      sovereignty_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      trust_profiles: {
        Row: {
          accumulated_observations: number
          base_frequency: number
          created_at: string
          current_tier: number
          decay_rate: number
          id: string
          incubation_boost: number
          incubation_expires_at: string | null
          is_incubated: boolean
          last_observation_at: string | null
          resonance_frequency: number
          tier_locked_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accumulated_observations?: number
          base_frequency?: number
          created_at?: string
          current_tier?: number
          decay_rate?: number
          id?: string
          incubation_boost?: number
          incubation_expires_at?: string | null
          is_incubated?: boolean
          last_observation_at?: string | null
          resonance_frequency?: number
          tier_locked_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accumulated_observations?: number
          base_frequency?: number
          created_at?: string
          current_tier?: number
          decay_rate?: number
          id?: string
          incubation_boost?: number
          incubation_expires_at?: string | null
          is_incubated?: boolean
          last_observation_at?: string | null
          resonance_frequency?: number
          tier_locked_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_feedback: {
        Row: {
          created_at: string
          email: string | null
          feedback_type: string
          id: string
          message: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          feedback_type?: string
          id?: string
          message: string
        }
        Update: {
          created_at?: string
          email?: string | null
          feedback_type?: string
          id?: string
          message?: string
        }
        Relationships: []
      }
      user_phone_numbers: {
        Row: {
          country_code: string
          created_at: string
          id: string
          is_verified: boolean
          phone_number: string
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          country_code: string
          created_at?: string
          id?: string
          is_verified?: boolean
          phone_number: string
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          is_verified?: boolean
          phone_number?: string
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      validation_summary_schedules: {
        Row: {
          created_at: string
          day_of_week: number | null
          frequency: string
          id: string
          is_enabled: boolean
          last_sent_at: string | null
          recipient_emails: string[]
          time_of_day: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week?: number | null
          frequency: string
          id?: string
          is_enabled?: boolean
          last_sent_at?: string | null
          recipient_emails?: string[]
          time_of_day?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number | null
          frequency?: string
          id?: string
          is_enabled?: boolean
          last_sent_at?: string | null
          recipient_emails?: string[]
          time_of_day?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      reviews_public: {
        Row: {
          content: string | null
          content_cn: string | null
          created_at: string | null
          display_name: string | null
          helpful_count: number | null
          id: string | null
          is_local_expert: boolean | null
          is_verified: boolean | null
          rating: number | null
          restaurant_id: string | null
          trust_tier: number | null
          trust_weight: number | null
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_cn?: string | null
          created_at?: string | null
          display_name?: string | null
          helpful_count?: number | null
          id?: string | null
          is_local_expert?: boolean | null
          is_verified?: boolean | null
          rating?: number | null
          restaurant_id?: string | null
          trust_tier?: number | null
          trust_weight?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_cn?: string | null
          created_at?: string | null
          display_name?: string | null
          helpful_count?: number | null
          id?: string | null
          is_local_expert?: boolean | null
          is_verified?: boolean | null
          rating?: number | null
          restaurant_id?: string | null
          trust_tier?: number | null
          trust_weight?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_restaurant_id_fkey"
            columns: ["restaurant_id"]
            isOneToOne: false
            referencedRelation: "restaurants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_trust_decay: { Args: { p_user_id: string }; Returns: number }
      check_email_rate_limit: {
        Args: {
          p_email_type: string
          p_max_per_day?: number
          p_max_per_hour?: number
          p_recipient_email: string
          p_sender_context?: string
        }
        Returns: {
          allowed: boolean
          daily_count: number
          hourly_count: number
          retry_after_seconds: number
        }[]
      }
      check_recovery_code_rate_limit: {
        Args: { p_user_id: string }
        Returns: {
          allowed: boolean
          attempts_in_window: number
          lockout_until: string
          retry_after_seconds: number
        }[]
      }
      cleanup_expired_passkey_challenges: { Args: never; Returns: undefined }
      cleanup_expired_sms_codes: { Args: never; Returns: undefined }
      create_cron_job: {
        Args: {
          p_function_name: string
          p_job_name: string
          p_schedule: string
        }
        Returns: number
      }
      delete_cron_job: { Args: { job_id: number }; Returns: undefined }
      get_cron_job_history: {
        Args: { job_id_filter?: number; limit_count?: number }
        Returns: {
          command: string
          database: string
          end_time: string
          job_pid: number
          jobid: number
          return_message: string
          runid: number
          start_time: string
          status: string
          username: string
        }[]
      }
      get_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          database: string
          jobid: number
          jobname: string
          nodename: string
          nodeport: number
          schedule: string
          username: string
        }[]
      }
      get_recent_cron_failures: {
        Args: never
        Returns: {
          end_time: string
          jobid: number
          jobname: string
          return_message: string
          runid: number
          start_time: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_cron_failures_notified: {
        Args: { run_ids: number[] }
        Returns: undefined
      }
      record_email_send: {
        Args: {
          p_email_type: string
          p_recipient_email: string
          p_sender_context?: string
        }
        Returns: string
      }
      record_observation: {
        Args: {
          p_event_type: string
          p_quality_score?: number
          p_target_entity_id?: string
          p_target_entity_type?: string
          p_user_id: string
        }
        Returns: number
      }
      record_recovery_code_attempt: {
        Args: { p_success: boolean; p_user_id: string }
        Returns: string
      }
      reset_recovery_code_attempts: {
        Args: { p_user_id: string }
        Returns: number
      }
      run_cron_job_now: { Args: { job_id: number }; Returns: undefined }
      toggle_cron_job: { Args: { job_id: number }; Returns: undefined }
      update_cron_job_schedule: {
        Args: { p_job_id: number; p_schedule: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      node_claim_status: "VIEWED" | "CLAIMED" | "REJECTED"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      node_claim_status: ["VIEWED", "CLAIMED", "REJECTED"],
    },
  },
} as const
