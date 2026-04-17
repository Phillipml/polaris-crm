export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      app_runtime_config: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          channel: string
          context_markdown: string | null
          created_at: string
          created_by: string | null
          description: string | null
          generation_prompt: string
          id: string
          is_active: boolean
          name: string
          trigger_stage_id: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          channel?: string
          context_markdown?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          generation_prompt?: string
          id?: string
          is_active?: boolean
          name: string
          trigger_stage_id?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          channel?: string
          context_markdown?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          generation_prompt?: string
          id?: string
          is_active?: boolean
          name?: string
          trigger_stage_id?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_trigger_stage_fk"
            columns: ["trigger_stage_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "campaigns_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_stages: {
        Row: {
          created_at: string
          id: string
          is_system: boolean
          name: string
          position: number
          slug: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_system?: boolean
          name: string
          position: number
          slug: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_system?: boolean
          name?: string
          position?: number
          slug?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "funnel_stages_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          created_at: string
          id: string
          lead_id: string
          status: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id: string
          status: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string
          status?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generation_jobs_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          lead_id: string
          payload: Json
          type: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id: string
          payload?: Json
          type: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          lead_id?: string
          payload?: Json
          type?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_workspace_id_fkey"
            columns: ["lead_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "lead_activities_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_custom_field_definitions: {
        Row: {
          created_at: string
          id: string
          key: string
          label: string
          type: string
          updated_at: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          label: string
          type: string
          updated_at?: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          label?: string
          type?: string
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_custom_field_definitions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_message_suggestions: {
        Row: {
          campaign_id: string
          content: string
          created_at: string
          id: string
          lead_id: string
          source: string
          updated_at: string
          variant_index: number
          workspace_id: string
        }
        Insert: {
          campaign_id: string
          content: string
          created_at?: string
          id?: string
          lead_id: string
          source?: string
          updated_at?: string
          variant_index: number
          workspace_id: string
        }
        Update: {
          campaign_id?: string
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          source?: string
          updated_at?: string
          variant_index?: number
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_message_suggestions_campaign_id_workspace_id_fkey"
            columns: ["campaign_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "lead_message_suggestions_lead_id_workspace_id_fkey"
            columns: ["lead_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "lead_message_suggestions_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_stage_webhook_campaign_dedupe: {
        Row: {
          campaign_id: string
          created_at: string
          lead_id: string
          leads_updated_at: string
          new_stage_id: string
          old_stage_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          lead_id: string
          leads_updated_at: string
          new_stage_id: string
          old_stage_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          lead_id?: string
          leads_updated_at?: string
          new_stage_id?: string
          old_stage_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          company_name: string | null
          created_at: string
          custom_fields: Json
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          last_contacted_at: string | null
          linkedin_url: string | null
          notes: string | null
          owner_user_id: string | null
          phone: string | null
          source: string | null
          stage_id: string
          status: string | null
          updated_at: string
          workspace_id: string
        }
        Insert: {
          company_name?: string | null
          created_at?: string
          custom_fields?: Json
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_contacted_at?: string | null
          linkedin_url?: string | null
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          source?: string | null
          stage_id: string
          status?: string | null
          updated_at?: string
          workspace_id: string
        }
        Update: {
          company_name?: string | null
          created_at?: string
          custom_fields?: Json
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          last_contacted_at?: string | null
          linkedin_url?: string | null
          notes?: string | null
          owner_user_id?: string | null
          phone?: string | null
          source?: string | null
          stage_id?: string
          status?: string | null
          updated_at?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_stage_id_workspace_id_fkey"
            columns: ["stage_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "leads_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      outreach_events: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          lead_id: string
          message: string
          sent_at: string
          updated_at: string
          user_id: string | null
          workspace_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          lead_id: string
          message: string
          sent_at?: string
          updated_at?: string
          user_id?: string | null
          workspace_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          message?: string
          sent_at?: string
          updated_at?: string
          user_id?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outreach_events_campaign_id_workspace_id_fkey"
            columns: ["campaign_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "outreach_events_lead_id_workspace_id_fkey"
            columns: ["lead_id", "workspace_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id", "workspace_id"]
          },
          {
            foreignKeyName: "outreach_events_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      stage_required_fields: {
        Row: {
          created_at: string
          field_key: string
          field_kind: Database["public"]["Enums"]["stage_required_field_kind"]
          id: string
          stage_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          field_key: string
          field_kind: Database["public"]["Enums"]["stage_required_field_kind"]
          id?: string
          stage_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          field_key?: string
          field_kind?: Database["public"]["Enums"]["stage_required_field_kind"]
          id?: string
          stage_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stage_required_fields_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "funnel_stages"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: string
          token: string
          workspace_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          role: string
          token: string
          workspace_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: string
          token?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_invites_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string
          role: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          created_at?: string
          role: string
          user_id: string
          workspace_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_funnel_stage: {
        Args: { p_name: string; p_workspace_id: string }
        Returns: {
          created_at: string
          id: string
          is_system: boolean
          name: string
          position: number
          slug: string
          updated_at: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "funnel_stages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_workspace_invite: {
        Args: { p_email: string; p_role: string; p_workspace_id: string }
        Returns: Json
      }
      create_workspace_with_owner: {
        Args: { workspace_name: string }
        Returns: string
      }
      delete_funnel_stage: {
        Args: {
          p_reallocate_to_stage_id?: string
          p_stage_id: string
          p_workspace_id: string
        }
        Returns: undefined
      }
      delete_workspace_as_owner: {
        Args: { p_workspace_id: string }
        Returns: undefined
      }
      is_workspace_member: { Args: { ws: string }; Returns: boolean }
      is_workspace_owner_or_admin: { Args: { ws: string }; Returns: boolean }
      list_workspace_members_directory: {
        Args: { p_workspace: string }
        Returns: Json
      }
      reorder_funnel_stages: {
        Args: { p_stage_ids: string[]; p_workspace_id: string }
        Returns: {
          created_at: string
          id: string
          is_system: boolean
          name: string
          position: number
          slug: string
          updated_at: string
          workspace_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "funnel_stages"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      seed_default_funnel_stages_for_workspace: {
        Args: { target_workspace_id: string }
        Returns: undefined
      }
      transition_lead_stage_atomic: {
        Args: {
          p_destination_stage_id: string
          p_lead_id: string
          p_workspace_id: string
        }
        Returns: {
          company_name: string | null
          created_at: string
          custom_fields: Json
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          last_contacted_at: string | null
          linkedin_url: string | null
          notes: string | null
          owner_user_id: string | null
          phone: string | null
          source: string | null
          stage_id: string
          status: string | null
          updated_at: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "leads"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      update_funnel_stage_name: {
        Args: { p_name: string; p_stage_id: string; p_workspace_id: string }
        Returns: {
          created_at: string
          id: string
          is_system: boolean
          name: string
          position: number
          slug: string
          updated_at: string
          workspace_id: string
        }
        SetofOptions: {
          from: "*"
          to: "funnel_stages"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      workspace_dashboard_stats: {
        Args: { p_workspace: string }
        Returns: {
          stage_counts: Json
          suggestions_last_7d: number
          total_leads: number
        }[]
      }
    }
    Enums: {
      stage_required_field_kind: "standard" | "custom"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      stage_required_field_kind: ["standard", "custom"],
    },
  },
} as const

