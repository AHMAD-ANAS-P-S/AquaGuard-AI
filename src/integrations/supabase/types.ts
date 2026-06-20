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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      action_logs: {
        Row: {
          action_description: string | null
          action_type: string
          alert_id: string | null
          created_at: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          action_description?: string | null
          action_type: string
          alert_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          action_description?: string | null
          action_type?: string
          alert_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "action_logs_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_predictions: {
        Row: {
          accuracy_score: number | null
          actual_outcome: string | null
          confidence_score: number | null
          created_at: string | null
          id: string
          model_version: string | null
          predicted_at: string | null
          prediction_data: Json | null
          prediction_type: string
          village_id: string | null
        }
        Insert: {
          accuracy_score?: number | null
          actual_outcome?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          model_version?: string | null
          predicted_at?: string | null
          prediction_data?: Json | null
          prediction_type: string
          village_id?: string | null
        }
        Update: {
          accuracy_score?: number | null
          actual_outcome?: string | null
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          model_version?: string | null
          predicted_at?: string | null
          prediction_data?: Json | null
          prediction_type?: string
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_predictions_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_acknowledgments: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          acknowledgment_method: string | null
          alert_id: string | null
          created_at: string | null
          id: string
          notes: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledgment_method?: string | null
          alert_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          acknowledgment_method?: string | null
          alert_id?: string | null
          created_at?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_acknowledgments_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_escalation_logs: {
        Row: {
          acknowledged_at: string | null
          action_taken: string | null
          alert_id: string | null
          created_at: string | null
          escalation_level: number
          id: string
          recipient_name: string | null
          recipient_phone: string | null
          recipient_role: string
          response_time_seconds: number | null
          sent_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          action_taken?: string | null
          alert_id?: string | null
          created_at?: string | null
          escalation_level: number
          id?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_role: string
          response_time_seconds?: number | null
          sent_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          action_taken?: string | null
          alert_id?: string | null
          created_at?: string | null
          escalation_level?: number
          id?: string
          recipient_name?: string | null
          recipient_phone?: string | null
          recipient_role?: string
          response_time_seconds?: number | null
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_escalation_logs_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      alerts: {
        Row: {
          actions_taken: string | null
          assigned_to: string | null
          created_at: string | null
          id: string
          message: string
          resolved_at: string | null
          severity: string
          status: string | null
          title: string
          type: string
          village_id: string | null
        }
        Insert: {
          actions_taken?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          message: string
          resolved_at?: string | null
          severity: string
          status?: string | null
          title: string
          type: string
          village_id?: string | null
        }
        Update: {
          actions_taken?: string | null
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          message?: string
          resolved_at?: string | null
          severity?: string
          status?: string | null
          title?: string
          type?: string
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alerts_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          points_required: number | null
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon: string
          id?: string
          name: string
          points_required?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          points_required?: number | null
        }
        Relationships: []
      }
      health_reports: {
        Row: {
          cases_count: number | null
          created_at: string | null
          id: string
          notes: string | null
          photo_url: string | null
          report_type: string
          reporter_name: string
          reporter_role: string | null
          status: string | null
          symptoms: Json
          user_id: string | null
          village_id: string | null
        }
        Insert: {
          cases_count?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          report_type?: string
          reporter_name: string
          reporter_role?: string | null
          status?: string | null
          symptoms: Json
          user_id?: string | null
          village_id?: string | null
        }
        Update: {
          cases_count?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          report_type?: string
          reporter_name?: string
          reporter_role?: string | null
          status?: string | null
          symptoms?: Json
          user_id?: string | null
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "health_reports_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_devices: {
        Row: {
          battery_level: number | null
          communication_mode: string | null
          created_at: string | null
          device_type: string
          firmware_version: string | null
          id: string
          installation_date: string | null
          last_communication: string | null
          latitude: number | null
          location_name: string | null
          longitude: number | null
          sensor_id: string
          status: string | null
          updated_at: string | null
          village_id: string | null
        }
        Insert: {
          battery_level?: number | null
          communication_mode?: string | null
          created_at?: string | null
          device_type?: string
          firmware_version?: string | null
          id?: string
          installation_date?: string | null
          last_communication?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          sensor_id: string
          status?: string | null
          updated_at?: string | null
          village_id?: string | null
        }
        Update: {
          battery_level?: number | null
          communication_mode?: string | null
          created_at?: string | null
          device_type?: string
          firmware_version?: string | null
          id?: string
          installation_date?: string | null
          last_communication?: string | null
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          sensor_id?: string
          status?: string | null
          updated_at?: string | null
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iot_devices_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string | null
          email_enabled: boolean | null
          id: string
          push_enabled: boolean | null
          severity_threshold: string | null
          sms_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          severity_threshold?: string | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_enabled?: boolean | null
          id?: string
          push_enabled?: boolean | null
          severity_threshold?: string | null
          sms_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      offline_sync_queue: {
        Row: {
          created_at: string
          data: Json
          data_type: string
          id: string
          synced: boolean | null
          synced_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          data: Json
          data_type: string
          id?: string
          synced?: boolean | null
          synced_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          data_type?: string
          id?: string
          synced?: boolean | null
          synced_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string | null
          updated_at: string | null
          village_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          village_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_completions: {
        Row: {
          completed_at: string
          id: string
          max_score: number
          passed: boolean
          points_earned: number
          quiz_type: string
          score: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          max_score: number
          passed: boolean
          points_earned: number
          quiz_type: string
          score: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          max_score?: number
          passed?: boolean
          points_earned?: number
          quiz_type?: string
          score?: number
          user_id?: string
        }
        Relationships: []
      }
      sms_reports: {
        Row: {
          created_at: string
          id: string
          message: string
          parsed_data: Json | null
          phone_number: string
          processed_at: string | null
          status: string | null
          village_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          parsed_data?: Json | null
          phone_number: string
          processed_at?: string | null
          status?: string | null
          village_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          parsed_data?: Json | null
          phone_number?: string
          processed_at?: string | null
          status?: string | null
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_reports_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_gamification: {
        Row: {
          created_at: string
          id: string
          last_activity_date: string | null
          level: number | null
          quizzes_completed: number | null
          reports_submitted: number | null
          streak_days: number | null
          total_points: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          level?: number | null
          quizzes_completed?: number | null
          reports_submitted?: number | null
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_activity_date?: string | null
          level?: number | null
          quizzes_completed?: number | null
          reports_submitted?: number | null
          streak_days?: number | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      villages: {
        Row: {
          created_at: string | null
          district: string | null
          id: string
          last_updated: string | null
          latitude: number | null
          longitude: number | null
          name: string
          population: number | null
          risk_level: string | null
          risk_score: number | null
          state: string | null
        }
        Insert: {
          created_at?: string | null
          district?: string | null
          id?: string
          last_updated?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          population?: number | null
          risk_level?: string | null
          risk_score?: number | null
          state?: string | null
        }
        Update: {
          created_at?: string | null
          district?: string | null
          id?: string
          last_updated?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          population?: number | null
          risk_level?: string | null
          risk_score?: number | null
          state?: string | null
        }
        Relationships: []
      }
      water_quality_readings: {
        Row: {
          bacterial_count: number | null
          created_at: string | null
          device_id: string | null
          id: string
          ph: number | null
          reading_timestamp: string | null
          sensor_id: string | null
          status: string | null
          tds: number | null
          temperature: number | null
          turbidity: number | null
          village_id: string | null
        }
        Insert: {
          bacterial_count?: number | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          ph?: number | null
          reading_timestamp?: string | null
          sensor_id?: string | null
          status?: string | null
          tds?: number | null
          temperature?: number | null
          turbidity?: number | null
          village_id?: string | null
        }
        Update: {
          bacterial_count?: number | null
          created_at?: string | null
          device_id?: string | null
          id?: string
          ph?: number | null
          reading_timestamp?: string | null
          sensor_id?: string | null
          status?: string | null
          tds?: number | null
          temperature?: number | null
          turbidity?: number | null
          village_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "water_quality_readings_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "iot_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "water_quality_readings_village_id_fkey"
            columns: ["village_id"]
            isOneToOne: false
            referencedRelation: "villages"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "official" | "asha_worker" | "citizen"
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
      app_role: ["admin", "official", "asha_worker", "citizen"],
    },
  },
} as const
