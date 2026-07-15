// Tipos auto-generados desde Supabase con mcp__supabase__generate_typescript_types.
// Proyecto: VaultBit Asesoría (YOUR-PROJECT-REF)
// NO editar a mano — regenerar con la herramienta cuando cambie el schema.

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      cal_bookings: {
        Row: {
          attendee_email: string | null
          attendee_name: string | null
          cal_booking_id: string
          cal_uid: string | null
          cancellation_reason: string | null
          created_at: string
          end_time: string
          event_type_slug: string | null
          id: string
          meeting_url: string | null
          raw: Json | null
          start_time: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          attendee_email?: string | null
          attendee_name?: string | null
          cal_booking_id: string
          cal_uid?: string | null
          cancellation_reason?: string | null
          created_at?: string
          end_time: string
          event_type_slug?: string | null
          id?: string
          meeting_url?: string | null
          raw?: Json | null
          start_time: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          attendee_email?: string | null
          attendee_name?: string | null
          cal_booking_id?: string
          cal_uid?: string | null
          cancellation_reason?: string | null
          created_at?: string
          end_time?: string
          event_type_slug?: string | null
          id?: string
          meeting_url?: string | null
          raw?: Json | null
          start_time?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      captacion_progress: {
        Row: {
          last_visited_route: string | null
          manual_read_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          last_visited_route?: string | null
          manual_read_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          last_visited_route?: string | null
          manual_read_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      captacion_tasks: {
        Row: {
          bucket: string
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          event_id: string | null
          id: string
          notes: string | null
          owner: string
          partner_id: string | null
          priority: string
          source_doc: string
          status: string
          title: string
          updated_at: string
          week: number | null
        }
        Insert: {
          bucket?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          owner?: string
          partner_id?: string | null
          priority?: string
          source_doc?: string
          status?: string
          title: string
          updated_at?: string
          week?: number | null
        }
        Update: {
          bucket?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          event_id?: string | null
          id?: string
          notes?: string | null
          owner?: string
          partner_id?: string | null
          priority?: string
          source_doc?: string
          status?: string
          title?: string
          updated_at?: string
          week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "captacion_tasks_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "captacion_tasks_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          active: boolean
          body_md: string
          category: string
          created_at: string
          description: string | null
          id: string
          name: string
          placeholders: Json
          slug: string
          updated_at: string
          version: number
        }
        Insert: {
          active?: boolean
          body_md: string
          category: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          placeholders?: Json
          slug: string
          updated_at?: string
          version?: number
        }
        Update: {
          active?: boolean
          body_md?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          placeholders?: Json
          slug?: string
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      contracts: {
        Row: {
          body_md_filled: string
          client_email: string | null
          client_name: string
          client_nif: string | null
          contract_number: string
          created_at: string
          created_by: string | null
          crm_entity_id: string | null
          crm_entity_type: string | null
          id: string
          notes: string | null
          quote_id: string | null
          sent_at: string | null
          signed_at: string | null
          status: string
          template_slug: string
          template_version: number
          updated_at: string
          values: Json
        }
        Insert: {
          body_md_filled: string
          client_email?: string | null
          client_name: string
          client_nif?: string | null
          contract_number: string
          created_at?: string
          created_by?: string | null
          crm_entity_id?: string | null
          crm_entity_type?: string | null
          id?: string
          notes?: string | null
          quote_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: string
          template_slug: string
          template_version: number
          updated_at?: string
          values?: Json
        }
        Update: {
          body_md_filled?: string
          client_email?: string | null
          client_name?: string
          client_nif?: string | null
          contract_number?: string
          created_at?: string
          created_by?: string | null
          crm_entity_id?: string | null
          crm_entity_type?: string | null
          id?: string
          notes?: string | null
          quote_id?: string | null
          sent_at?: string | null
          signed_at?: string | null
          status?: string
          template_slug?: string
          template_version?: number
          updated_at?: string
          values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_template_slug_fkey"
            columns: ["template_slug"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["slug"]
          },
        ]
      }
      crm_notes: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      crm_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          entity_id: string
          entity_type: string
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          attachment_url: string | null
          body: string | null
          channel: string
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          n8n_execution_id: string | null
          related_id: string | null
          sent_at: string | null
          status: string
          subject: string
          to_email: string
          updated_at: string
        }
        Insert: {
          attachment_url?: string | null
          body?: string | null
          channel: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          n8n_execution_id?: string | null
          related_id?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          to_email: string
          updated_at?: string
        }
        Update: {
          attachment_url?: string | null
          body?: string | null
          channel?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          n8n_execution_id?: string | null
          related_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          to_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          budget_estimate: number | null
          created_at: string
          created_by: string | null
          date_end: string | null
          date_start: string | null
          format: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          organizer: string | null
          related_partner_id: string | null
          roi_estimate: string | null
          sponsors: string[]
          tracking_status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          budget_estimate?: number | null
          created_at?: string
          created_by?: string | null
          date_end?: string | null
          date_start?: string | null
          format?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          organizer?: string | null
          related_partner_id?: string | null
          roi_estimate?: string | null
          sponsors?: string[]
          tracking_status?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          budget_estimate?: number | null
          created_at?: string
          created_by?: string | null
          date_end?: string | null
          date_start?: string | null
          format?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          organizer?: string | null
          related_partner_id?: string | null
          roi_estimate?: string | null
          sponsors?: string[]
          tracking_status?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_related_partner_id_fkey"
            columns: ["related_partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_ideas: {
        Row: {
          archetype: string | null
          batch_id: string | null
          compliance_flagged: Json | null
          compliance_passes: boolean | null
          created_at: string | null
          created_by: string | null
          format: string | null
          id: string
          idea_score: number | null
          idea_score_breakdown: Json | null
          notes: string | null
          promoted_script_id: string | null
          rationale: string | null
          status: string | null
          theme: string
          updated_at: string | null
        }
        Insert: {
          archetype?: string | null
          batch_id?: string | null
          compliance_flagged?: Json | null
          compliance_passes?: boolean | null
          created_at?: string | null
          created_by?: string | null
          format?: string | null
          id?: string
          idea_score?: number | null
          idea_score_breakdown?: Json | null
          notes?: string | null
          promoted_script_id?: string | null
          rationale?: string | null
          status?: string | null
          theme: string
          updated_at?: string | null
        }
        Update: {
          archetype?: string | null
          batch_id?: string | null
          compliance_flagged?: Json | null
          compliance_passes?: boolean | null
          created_at?: string | null
          created_by?: string | null
          format?: string | null
          id?: string
          idea_score?: number | null
          idea_score_breakdown?: Json | null
          notes?: string | null
          promoted_script_id?: string | null
          rationale?: string | null
          status?: string | null
          theme?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "founder_ideas_promoted_script_id_fkey"
            columns: ["promoted_script_id"]
            isOneToOne: false
            referencedRelation: "founder_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_metrics: {
        Row: {
          avg_watch_time_ms: number | null
          comments: number | null
          completion_rate: number | null
          created_at: string | null
          id: string
          instagram_media_id: string
          likes: number | null
          plays: number | null
          raw_payload: Json | null
          reach: number | null
          saved: number | null
          script_id: string
          shares: number | null
          snapshot_date: string
          total_interactions: number | null
          total_watch_time_ms: number | null
        }
        Insert: {
          avg_watch_time_ms?: number | null
          comments?: number | null
          completion_rate?: number | null
          created_at?: string | null
          id?: string
          instagram_media_id: string
          likes?: number | null
          plays?: number | null
          raw_payload?: Json | null
          reach?: number | null
          saved?: number | null
          script_id: string
          shares?: number | null
          snapshot_date?: string
          total_interactions?: number | null
          total_watch_time_ms?: number | null
        }
        Update: {
          avg_watch_time_ms?: number | null
          comments?: number | null
          completion_rate?: number | null
          created_at?: string | null
          id?: string
          instagram_media_id?: string
          likes?: number | null
          plays?: number | null
          raw_payload?: Json | null
          reach?: number | null
          saved?: number | null
          script_id?: string
          shares?: number | null
          snapshot_date?: string
          total_interactions?: number | null
          total_watch_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "founder_metrics_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "founder_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_scripts: {
        Row: {
          archetype: string | null
          compliance_flagged: Json | null
          compliance_passes: boolean | null
          copy_generated_at: string | null
          created_at: string | null
          created_by: string | null
          estimated_duration_s: number | null
          format: string | null
          hook_chosen: string | null
          hook_options: Json | null
          id: string
          idea_id: string | null
          idea_score: number | null
          instagram_media_id: string | null
          instagram_url: string | null
          keyword: string | null
          notes: string | null
          published_at: string | null
          rationale: string | null
          recorded_at: string | null
          scheduled_at: string | null
          script_context: string | null
          script_copy: string | null
          script_cta: string | null
          script_hook: string | null
          script_moral: string | null
          status: string | null
          suggested_hashtags: Json | null
          theme: string
          updated_at: string | null
        }
        Insert: {
          archetype?: string | null
          compliance_flagged?: Json | null
          compliance_passes?: boolean | null
          copy_generated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_duration_s?: number | null
          format?: string | null
          hook_chosen?: string | null
          hook_options?: Json | null
          id?: string
          idea_id?: string | null
          idea_score?: number | null
          instagram_media_id?: string | null
          instagram_url?: string | null
          keyword?: string | null
          notes?: string | null
          published_at?: string | null
          rationale?: string | null
          recorded_at?: string | null
          scheduled_at?: string | null
          script_context?: string | null
          script_copy?: string | null
          script_cta?: string | null
          script_hook?: string | null
          script_moral?: string | null
          status?: string | null
          suggested_hashtags?: Json | null
          theme: string
          updated_at?: string | null
        }
        Update: {
          archetype?: string | null
          compliance_flagged?: Json | null
          compliance_passes?: boolean | null
          copy_generated_at?: string | null
          created_at?: string | null
          created_by?: string | null
          estimated_duration_s?: number | null
          format?: string | null
          hook_chosen?: string | null
          hook_options?: Json | null
          id?: string
          idea_id?: string | null
          idea_score?: number | null
          instagram_media_id?: string | null
          instagram_url?: string | null
          keyword?: string | null
          notes?: string | null
          published_at?: string | null
          rationale?: string | null
          recorded_at?: string | null
          scheduled_at?: string | null
          script_context?: string | null
          script_copy?: string | null
          script_cta?: string | null
          script_hook?: string | null
          script_moral?: string | null
          status?: string | null
          suggested_hashtags?: Json | null
          theme?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "founder_scripts_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "founder_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_leads: {
        Row: {
          archetype: string
          channel: string
          contacted_at: string | null
          converted_at: string | null
          created_at: string
          email: string
          id: string
          ip_address: unknown
          name: string
          notes: string | null
          q1: string | null
          q2: string | null
          q3: string | null
          q4: string | null
          q5: string | null
          referrer: string | null
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          archetype: string
          channel: string
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          email: string
          id?: string
          ip_address?: unknown
          name: string
          notes?: string | null
          q1?: string | null
          q2?: string | null
          q3?: string | null
          q4?: string | null
          q5?: string | null
          referrer?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          archetype?: string
          channel?: string
          contacted_at?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          ip_address?: unknown
          name?: string
          notes?: string | null
          q1?: string | null
          q2?: string | null
          q3?: string | null
          q4?: string | null
          q5?: string | null
          referrer?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      funnel_sessions: {
        Row: {
          answers: Json | null
          archetype: string | null
          completed: boolean
          created_at: string
          id: string
          lead_id: string | null
          referrer: string | null
          session_key: string
          step_reached: number
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          answers?: Json | null
          archetype?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          lead_id?: string | null
          referrer?: string | null
          session_key: string
          step_reached?: number
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          answers?: Json | null
          archetype?: string | null
          completed?: boolean
          created_at?: string
          id?: string
          lead_id?: string | null
          referrer?: string | null
          session_key?: string
          step_reached?: number
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "funnel_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      google_oauth_tokens: {
        Row: {
          access_token_enc: string
          created_at: string
          email: string | null
          expires_at: string
          refresh_token_enc: string
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token_enc: string
          created_at?: string
          email?: string | null
          expires_at: string
          refresh_token_enc: string
          scope?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token_enc?: string
          created_at?: string
          email?: string | null
          expires_at?: string
          refresh_token_enc?: string
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      investor_interest: {
        Row: {
          created_at: string
          email: string
          id: string
          linkedin: string | null
          message: string | null
          name: string | null
          notes: string | null
          organization: string | null
          referrer: string | null
          source: string | null
          status: string
          ticket_size: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          vehicle_type: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          linkedin?: string | null
          message?: string | null
          name?: string | null
          notes?: string | null
          organization?: string | null
          referrer?: string | null
          source?: string | null
          status?: string
          ticket_size?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicle_type?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          linkedin?: string | null
          message?: string | null
          name?: string | null
          notes?: string | null
          organization?: string | null
          referrer?: string | null
          source?: string | null
          status?: string
          ticket_size?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      lead_magnet_subscribers: {
        Row: {
          created_at: string
          delivered: boolean
          delivered_at: string | null
          email: string
          follow_up_sent: boolean
          id: string
          name: string | null
          referrer: string | null
          source: string
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          created_at?: string
          delivered?: boolean
          delivered_at?: string | null
          email: string
          follow_up_sent?: boolean
          id?: string
          name?: string | null
          referrer?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          created_at?: string
          delivered?: boolean
          delivered_at?: string | null
          email?: string
          follow_up_sent?: boolean
          id?: string
          name?: string | null
          referrer?: string | null
          source?: string
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      linkedin_contacts: {
        Row: {
          company: string | null
          connected_on: string | null
          created_at: string
          created_by: string | null
          crypto_signal: boolean
          email_address: string | null
          first_name: string | null
          generated_message: string | null
          generated_message_at: string | null
          has_message_history: boolean
          id: string
          import_id: string | null
          last_message_at: string | null
          last_name: string | null
          linkedin_url: string
          messages_count: number
          notes: string | null
          outreach_status: string
          position: string | null
          relevance_reason: string | null
          relevance_status: string
          sector_tags: Json
          updated_at: string
        }
        Insert: {
          company?: string | null
          connected_on?: string | null
          created_at?: string
          created_by?: string | null
          crypto_signal?: boolean
          email_address?: string | null
          first_name?: string | null
          generated_message?: string | null
          generated_message_at?: string | null
          has_message_history?: boolean
          id?: string
          import_id?: string | null
          last_message_at?: string | null
          last_name?: string | null
          linkedin_url: string
          messages_count?: number
          notes?: string | null
          outreach_status?: string
          position?: string | null
          relevance_reason?: string | null
          relevance_status?: string
          sector_tags?: Json
          updated_at?: string
        }
        Update: {
          company?: string | null
          connected_on?: string | null
          created_at?: string
          created_by?: string | null
          crypto_signal?: boolean
          email_address?: string | null
          first_name?: string | null
          generated_message?: string | null
          generated_message_at?: string | null
          has_message_history?: boolean
          id?: string
          import_id?: string | null
          last_message_at?: string | null
          last_name?: string | null
          linkedin_url?: string
          messages_count?: number
          notes?: string | null
          outreach_status?: string
          position?: string | null
          relevance_reason?: string | null
          relevance_status?: string
          sector_tags?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "linkedin_contacts_import_id_fkey"
            columns: ["import_id"]
            isOneToOne: false
            referencedRelation: "linkedin_imports"
            referencedColumns: ["id"]
          },
        ]
      }
      linkedin_imports: {
        Row: {
          connections_count: number
          created_at: string
          created_by: string | null
          id: string
          messages_count: number
          notes: string | null
          source_filename: string | null
        }
        Insert: {
          connections_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          messages_count?: number
          notes?: string | null
          source_filename?: string | null
        }
        Update: {
          connections_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          messages_count?: number
          notes?: string | null
          source_filename?: string | null
        }
        Relationships: []
      }
      meta_oauth_tokens: {
        Row: {
          access_token_enc: string
          created_at: string | null
          expires_at: string
          facebook_page_id: string | null
          facebook_page_name: string | null
          instagram_user_id: string | null
          instagram_username: string | null
          scope: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token_enc: string
          created_at?: string | null
          expires_at: string
          facebook_page_id?: string | null
          facebook_page_name?: string | null
          instagram_user_id?: string | null
          instagram_username?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token_enc?: string
          created_at?: string | null
          expires_at?: string
          facebook_page_id?: string | null
          facebook_page_name?: string | null
          instagram_user_id?: string | null
          instagram_username?: string | null
          scope?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_applications: {
        Row: {
          created_at: string
          email: string
          id: string
          linkedin: string | null
          message: string | null
          name: string
          organization: string | null
          partner_type: string
          referrer: string | null
          source: string | null
          status: string
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          linkedin?: string | null
          message?: string | null
          name: string
          organization?: string | null
          partner_type: string
          referrer?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          linkedin?: string | null
          message?: string | null
          name?: string
          organization?: string | null
          partner_type?: string
          referrer?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      partner_sources: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          partner_id: string
          source_title: string | null
          source_type: string
          source_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          partner_id: string
          source_title?: string | null
          source_type?: string
          source_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          partner_id?: string
          source_title?: string | null
          source_type?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_sources_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          call_script: string | null
          city: string | null
          community_website: string | null
          company: string | null
          company_cif: string | null
          company_website: string | null
          competition_risk: string
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          linkedin_draft: string | null
          linkedin_url: string | null
          next_action: string | null
          next_action_date: string | null
          notes: string | null
          origin: string | null
          outreach_email: string | null
          outreach_subject: string | null
          phone: string | null
          pipeline_stage: string
          professional_type: string | null
          role: string | null
          tags: string[]
          updated_at: string
          verification_level: string
        }
        Insert: {
          call_script?: string | null
          city?: string | null
          community_website?: string | null
          company?: string | null
          company_cif?: string | null
          company_website?: string | null
          competition_risk?: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          linkedin_draft?: string | null
          linkedin_url?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          origin?: string | null
          outreach_email?: string | null
          outreach_subject?: string | null
          phone?: string | null
          pipeline_stage?: string
          professional_type?: string | null
          role?: string | null
          tags?: string[]
          updated_at?: string
          verification_level?: string
        }
        Update: {
          call_script?: string | null
          city?: string | null
          community_website?: string | null
          company?: string | null
          company_cif?: string | null
          company_website?: string | null
          competition_risk?: string
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          linkedin_draft?: string | null
          linkedin_url?: string | null
          next_action?: string | null
          next_action_date?: string | null
          notes?: string | null
          origin?: string | null
          outreach_email?: string | null
          outreach_subject?: string | null
          phone?: string | null
          pipeline_stage?: string
          professional_type?: string | null
          role?: string | null
          tags?: string[]
          updated_at?: string
          verification_level?: string
        }
        Relationships: []
      }
      pricing_modifiers: {
        Row: {
          active: boolean
          created_at: string
          default_enabled: boolean
          free_quantity: number
          id: string
          input_key: string | null
          kind: string
          label: string
          modifier_key: string
          service_slug: string
          sort_order: number
          tier_key: string | null
          unit_amount: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          default_enabled?: boolean
          free_quantity?: number
          id?: string
          input_key?: string | null
          kind: string
          label: string
          modifier_key: string
          service_slug: string
          sort_order?: number
          tier_key?: string | null
          unit_amount?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          default_enabled?: boolean
          free_quantity?: number
          id?: string
          input_key?: string | null
          kind?: string
          label?: string
          modifier_key?: string
          service_slug?: string
          sort_order?: number
          tier_key?: string | null
          unit_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      pricing_tiers: {
        Row: {
          active: boolean
          base_price_eur: number
          created_at: string
          description: string | null
          driver_key: string | null
          driver_max: number | null
          driver_min: number | null
          id: string
          is_custom: boolean
          modality: string
          service_slug: string
          sort_order: number
          tier_key: string
          tier_label: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          base_price_eur: number
          created_at?: string
          description?: string | null
          driver_key?: string | null
          driver_max?: number | null
          driver_min?: number | null
          id?: string
          is_custom?: boolean
          modality?: string
          service_slug: string
          sort_order?: number
          tier_key: string
          tier_label: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          base_price_eur?: number
          created_at?: string
          description?: string | null
          driver_key?: string | null
          driver_max?: number | null
          driver_min?: number | null
          id?: string
          is_custom?: boolean
          modality?: string
          service_slug?: string
          sort_order?: number
          tier_key?: string
          tier_label?: string
          updated_at?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          accepted_at: string | null
          base_price_eur: number
          client_address: string | null
          client_company: string | null
          client_email: string | null
          client_name: string
          client_nif: string | null
          client_sector: string | null
          created_at: string
          created_by: string | null
          crm_entity_id: string | null
          crm_entity_type: string | null
          currency: string
          discount_percent: number
          id: string
          internal_notes: string | null
          modality: string
          notes: string | null
          price_breakdown: Json | null
          pricing_inputs: Json | null
          quote_items: Json | null
          quote_number: string
          rejected_at: string | null
          sent_at: string | null
          service_slug: string
          status: string
          subtotal_eur: number
          tier: string
          total_eur: number
          updated_at: string
          validity_days: number
          vat_amount_eur: number
          vat_percent: number
        }
        Insert: {
          accepted_at?: string | null
          base_price_eur: number
          client_address?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name: string
          client_nif?: string | null
          client_sector?: string | null
          created_at?: string
          created_by?: string | null
          crm_entity_id?: string | null
          crm_entity_type?: string | null
          currency?: string
          discount_percent?: number
          id?: string
          internal_notes?: string | null
          modality: string
          notes?: string | null
          price_breakdown?: Json | null
          pricing_inputs?: Json | null
          quote_items?: Json | null
          quote_number: string
          rejected_at?: string | null
          sent_at?: string | null
          service_slug: string
          status?: string
          subtotal_eur: number
          tier: string
          total_eur: number
          updated_at?: string
          validity_days?: number
          vat_amount_eur: number
          vat_percent?: number
        }
        Update: {
          accepted_at?: string | null
          base_price_eur?: number
          client_address?: string | null
          client_company?: string | null
          client_email?: string | null
          client_name?: string
          client_nif?: string | null
          client_sector?: string | null
          created_at?: string
          created_by?: string | null
          crm_entity_id?: string | null
          crm_entity_type?: string | null
          currency?: string
          discount_percent?: number
          id?: string
          internal_notes?: string | null
          modality?: string
          notes?: string | null
          price_breakdown?: Json | null
          pricing_inputs?: Json | null
          quote_items?: Json | null
          quote_number?: string
          rejected_at?: string | null
          sent_at?: string | null
          service_slug?: string
          status?: string
          subtotal_eur?: number
          tier?: string
          total_eur?: number
          updated_at?: string
          validity_days?: number
          vat_amount_eur?: number
          vat_percent?: number
        }
        Relationships: []
      }
      service_pricing: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          modality: string
          price_eur: number
          service_slug: string
          tier: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          modality: string
          price_eur: number
          service_slug: string
          tier: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          modality?: string
          price_eur?: number
          service_slug?: string
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      next_contract_number: { Args: never; Returns: string }
      next_quote_number: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
