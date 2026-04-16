export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      campaigns: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          channel: string;
          description: string | null;
          is_active: boolean;
          context_markdown: string | null;
          generation_prompt: string;
          trigger_stage_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          channel?: string;
          description?: string | null;
          is_active?: boolean;
          context_markdown?: string | null;
          generation_prompt?: string;
          trigger_stage_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          channel?: string;
          description?: string | null;
          is_active?: boolean;
          context_markdown?: string | null;
          generation_prompt?: string;
          trigger_stage_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      funnel_stages: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          slug: string;
          position: number;
          is_system: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          slug: string;
          position: number;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          name?: string;
          slug?: string;
          position?: number;
          is_system?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role: "owner" | "admin" | "member";
          created_at?: string;
        };
        Update: {
          workspace_id?: string;
          user_id?: string;
          role?: "owner" | "admin" | "member";
          created_at?: string;
        };
      };
      lead_custom_field_definitions: {
        Row: {
          id: string;
          workspace_id: string;
          key: string;
          label: string;
          type: "text" | "number" | "boolean" | "date" | "select";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          key: string;
          label: string;
          type: "text" | "number" | "boolean" | "date" | "select";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          key?: string;
          label?: string;
          type?: "text" | "number" | "boolean" | "date" | "select";
          created_at?: string;
          updated_at?: string;
        };
      };
      stage_required_fields: {
        Row: {
          id: string;
          stage_id: string;
          field_key: string;
          field_kind: "standard" | "custom";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          stage_id: string;
          field_key: string;
          field_kind: "standard" | "custom";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          stage_id?: string;
          field_key?: string;
          field_kind?: "standard" | "custom";
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          workspace_id: string;
          stage_id: string;
          owner_user_id: string | null;
          full_name: string | null;
          company_name: string | null;
          email: string | null;
          phone: string | null;
          job_title: string | null;
          linkedin_url: string | null;
          source: string | null;
          status: string | null;
          notes: string | null;
          custom_fields: Json;
          last_contacted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          stage_id: string;
          owner_user_id?: string | null;
          full_name?: string | null;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          job_title?: string | null;
          linkedin_url?: string | null;
          source?: string | null;
          status?: string | null;
          notes?: string | null;
          custom_fields?: Json;
          last_contacted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          stage_id?: string;
          owner_user_id?: string | null;
          full_name?: string | null;
          company_name?: string | null;
          email?: string | null;
          phone?: string | null;
          job_title?: string | null;
          linkedin_url?: string | null;
          source?: string | null;
          status?: string | null;
          notes?: string | null;
          custom_fields?: Json;
          last_contacted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lead_message_suggestions: {
        Row: {
          id: string;
          workspace_id: string;
          lead_id: string;
          campaign_id: string;
          variant_index: number;
          content: string;
          source: "manual" | "auto_trigger";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          lead_id: string;
          campaign_id: string;
          variant_index: number;
          content: string;
          source?: "manual" | "auto_trigger";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          lead_id?: string;
          campaign_id?: string;
          variant_index?: number;
          content?: string;
          source?: "manual" | "auto_trigger";
          created_at?: string;
          updated_at?: string;
        };
      };
      outreach_events: {
        Row: {
          id: string;
          workspace_id: string;
          lead_id: string;
          campaign_id: string;
          message: string;
          sent_at: string;
          user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          lead_id: string;
          campaign_id: string;
          message: string;
          sent_at?: string;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          workspace_id?: string;
          lead_id?: string;
          campaign_id?: string;
          message?: string;
          sent_at?: string;
          user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};
