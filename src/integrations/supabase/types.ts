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
      custom_categories: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          name: string
          show_emoji: boolean
          user_id: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
          show_emoji?: boolean
          user_id: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
          show_emoji?: boolean
          user_id?: string
          xp_reward?: number
        }
        Relationships: []
      }
      daily_logs: {
        Row: {
          created_at: string
          date: string
          id: string
          phone_usage_hours: number | null
          sleep_hours: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          phone_usage_hours?: number | null
          sleep_hours?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          phone_usage_hours?: number | null
          sleep_hours?: number | null
          user_id?: string
        }
        Relationships: []
      }
      draco_state: {
        Row: {
          color: string
          created_at: string
          current_xp: number
          id: string
          level: number
          name: string
          total_xp: number
          updated_at: string
          user_id: string
          xp_to_next_level: number
        }
        Insert: {
          color?: string
          created_at?: string
          current_xp?: number
          id?: string
          level?: number
          name?: string
          total_xp?: number
          updated_at?: string
          user_id: string
          xp_to_next_level?: number
        }
        Update: {
          color?: string
          created_at?: string
          current_xp?: number
          id?: string
          level?: number
          name?: string
          total_xp?: number
          updated_at?: string
          user_id?: string
          xp_to_next_level?: number
        }
        Relationships: []
      }
      goals: {
        Row: {
          archived: boolean
          category: string | null
          category_xp: number | null
          completion_status: string | null
          created_at: string
          custom_category_id: string | null
          emoji: string | null
          id: string
          name: string
          parent_goal_id: string | null
          period_value: string | null
          progress: number
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          category?: string | null
          category_xp?: number | null
          completion_status?: string | null
          created_at?: string
          custom_category_id?: string | null
          emoji?: string | null
          id?: string
          name: string
          parent_goal_id?: string | null
          period_value?: string | null
          progress?: number
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          category?: string | null
          category_xp?: number | null
          completion_status?: string | null
          created_at?: string
          custom_category_id?: string | null
          emoji?: string | null
          id?: string
          name?: string
          parent_goal_id?: string | null
          period_value?: string | null
          progress?: number
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_custom_category_id_fkey"
            columns: ["custom_category_id"]
            isOneToOne: false
            referencedRelation: "custom_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_parent_goal_id_fkey"
            columns: ["parent_goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      habit_checks: {
        Row: {
          completed: boolean
          created_at: string
          date: string
          habit_id: string
          id: string
          micro_goals_completed: number
          user_id: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          date: string
          habit_id: string
          id?: string
          micro_goals_completed?: number
          user_id: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          date?: string
          habit_id?: string
          id?: string
          micro_goals_completed?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "habit_checks_habit_id_fkey"
            columns: ["habit_id"]
            isOneToOne: false
            referencedRelation: "habits"
            referencedColumns: ["id"]
          },
        ]
      }
      habits: {
        Row: {
          archived: boolean
          created_at: string
          description: string | null
          emoji: string | null
          end_date: string | null
          frequency_weeks: number
          goal_id: string | null
          has_micro_goals: boolean
          id: string
          is_bad_habit: boolean
          micro_goals_count: number
          micro_goals_names: string[]
          name: string
          notification_enabled: boolean
          notification_time: string | null
          period_type: string
          period_value: string | null
          previous_frequency_weeks: number | null
          previous_selected_days: number[] | null
          previous_specific_weeks_of_month: number[] | null
          repeat_weekly: boolean
          schedule_updated_at: string | null
          selected_days: number[] | null
          specific_weeks_of_month: number[] | null
          start_date: string | null
          updated_at: string
          user_id: string
          xp_reward: number | null
        }
        Insert: {
          archived?: boolean
          created_at?: string
          description?: string | null
          emoji?: string | null
          end_date?: string | null
          frequency_weeks?: number
          goal_id?: string | null
          has_micro_goals?: boolean
          id?: string
          is_bad_habit?: boolean
          micro_goals_count?: number
          micro_goals_names?: string[]
          name: string
          notification_enabled?: boolean
          notification_time?: string | null
          period_type: string
          period_value?: string | null
          previous_frequency_weeks?: number | null
          previous_selected_days?: number[] | null
          previous_specific_weeks_of_month?: number[] | null
          repeat_weekly?: boolean
          schedule_updated_at?: string | null
          selected_days?: number[] | null
          specific_weeks_of_month?: number[] | null
          start_date?: string | null
          updated_at?: string
          user_id: string
          xp_reward?: number | null
        }
        Update: {
          archived?: boolean
          created_at?: string
          description?: string | null
          emoji?: string | null
          end_date?: string | null
          frequency_weeks?: number
          goal_id?: string | null
          has_micro_goals?: boolean
          id?: string
          is_bad_habit?: boolean
          micro_goals_count?: number
          micro_goals_names?: string[]
          name?: string
          notification_enabled?: boolean
          notification_time?: string | null
          period_type?: string
          period_value?: string | null
          previous_frequency_weeks?: number | null
          previous_selected_days?: number[] | null
          previous_specific_weeks_of_month?: number[] | null
          repeat_weekly?: boolean
          schedule_updated_at?: string | null
          selected_days?: number[] | null
          specific_weeks_of_month?: number[] | null
          start_date?: string | null
          updated_at?: string
          user_id?: string
          xp_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "habits_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          birth_date: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          photo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          birth_date?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          photo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          birth_date?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          photo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          account_created_at: string | null
          created_at: string
          dark_mode: boolean
          glass_blur: number
          glass_opacity: number
          id: string
          last_daily_log_date: string | null
          max_phone_hours: number | null
          min_sleep_hours: number | null
          notification_reminders: Json | null
          notifications_enabled: boolean
          progress_display_mode: string
          show_emojis: boolean
          theme_color: string
          updated_at: string
          user_id: string
          wallpaper_dark: string | null
          wallpaper_light: string | null
          wallpaper_mobile_dark: string | null
          wallpaper_mobile_light: string | null
        }
        Insert: {
          account_created_at?: string | null
          created_at?: string
          dark_mode?: boolean
          glass_blur?: number
          glass_opacity?: number
          id?: string
          last_daily_log_date?: string | null
          max_phone_hours?: number | null
          min_sleep_hours?: number | null
          notification_reminders?: Json | null
          notifications_enabled?: boolean
          progress_display_mode?: string
          show_emojis?: boolean
          theme_color?: string
          updated_at?: string
          user_id: string
          wallpaper_dark?: string | null
          wallpaper_light?: string | null
          wallpaper_mobile_dark?: string | null
          wallpaper_mobile_light?: string | null
        }
        Update: {
          account_created_at?: string | null
          created_at?: string
          dark_mode?: boolean
          glass_blur?: number
          glass_opacity?: number
          id?: string
          last_daily_log_date?: string | null
          max_phone_hours?: number | null
          min_sleep_hours?: number | null
          notification_reminders?: Json | null
          notifications_enabled?: boolean
          progress_display_mode?: string
          show_emojis?: boolean
          theme_color?: string
          updated_at?: string
          user_id?: string
          wallpaper_dark?: string | null
          wallpaper_light?: string | null
          wallpaper_mobile_dark?: string | null
          wallpaper_mobile_light?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
