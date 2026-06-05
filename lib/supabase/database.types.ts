export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          height_cm: number | null
          weight_kg: number | null
          birth_date: string | null
          sex: 'male' | 'female' | 'other' | null
          fitness_goal: 'muscle_gain' | 'fat_loss' | 'maintenance' | 'endurance' | null
          activity_level: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
          health_connect_enabled: boolean
          health_connect_last_sync: string | null
          calorie_target_override: number | null
          protein_target_g: number | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          birth_date?: string | null
          sex?: 'male' | 'female' | 'other' | null
          fitness_goal?: 'muscle_gain' | 'fat_loss' | 'maintenance' | 'endurance' | null
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
          health_connect_enabled?: boolean
          health_connect_last_sync?: string | null
          calorie_target_override?: number | null
          protein_target_g?: number | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          height_cm?: number | null
          weight_kg?: number | null
          birth_date?: string | null
          sex?: 'male' | 'female' | 'other' | null
          fitness_goal?: 'muscle_gain' | 'fat_loss' | 'maintenance' | 'endurance' | null
          activity_level?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active' | null
          health_connect_enabled?: boolean
          health_connect_last_sync?: string | null
          calorie_target_override?: number | null
          protein_target_g?: number | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      daily_summaries: {
        Row: {
          id: string
          user_id: string
          date: string
          steps: number | null
          calories_burned: number | null
          active_minutes: number | null
          distance_km: number | null
          floors_climbed: number | null
          sleep_minutes_total: number | null
          sleep_minutes_deep: number | null
          sleep_minutes_rem: number | null
          sleep_minutes_light: number | null
          sleep_minutes_awake: number | null
          sleep_score: number | null
          sleep_start: string | null
          sleep_end: string | null
          resting_heart_rate: number | null
          hrv_rmssd: number | null
          hrv_score: number | null
          hr_zone_1_minutes: number | null
          hr_zone_2_minutes: number | null
          hr_zone_3_minutes: number | null
          spo2_avg: number | null
          weight_kg: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          steps?: number | null
          calories_burned?: number | null
          active_minutes?: number | null
          distance_km?: number | null
          floors_climbed?: number | null
          sleep_minutes_total?: number | null
          sleep_minutes_deep?: number | null
          sleep_minutes_rem?: number | null
          sleep_minutes_light?: number | null
          sleep_minutes_awake?: number | null
          sleep_score?: number | null
          sleep_start?: string | null
          sleep_end?: string | null
          resting_heart_rate?: number | null
          hrv_rmssd?: number | null
          hrv_score?: number | null
          hr_zone_1_minutes?: number | null
          hr_zone_2_minutes?: number | null
          hr_zone_3_minutes?: number | null
          spo2_avg?: number | null
          weight_kg?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          steps?: number | null
          calories_burned?: number | null
          active_minutes?: number | null
          distance_km?: number | null
          floors_climbed?: number | null
          sleep_minutes_total?: number | null
          sleep_minutes_deep?: number | null
          sleep_minutes_rem?: number | null
          sleep_minutes_light?: number | null
          sleep_minutes_awake?: number | null
          sleep_score?: number | null
          sleep_start?: string | null
          sleep_end?: string | null
          resting_heart_rate?: number | null
          hrv_rmssd?: number | null
          hrv_score?: number | null
          hr_zone_1_minutes?: number | null
          hr_zone_2_minutes?: number | null
          hr_zone_3_minutes?: number | null
          spo2_avg?: number | null
          weight_kg?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      food_logs: {
        Row: {
          id: string
          user_id: string
          logged_at: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_name: string
          brand_name: string | null
          quantity_g: number
          calories: number
          protein_g: number
          carbs_g: number
          fat_g: number
          fiber_g: number | null
          sugar_g: number | null
          sodium_mg: number | null
          barcode: string | null
          openfoodfacts_id: string | null
          photo_url: string | null
          ai_estimated: boolean
          ai_confidence: number | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          logged_at?: string
          meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_name: string
          brand_name?: string | null
          quantity_g?: number
          calories: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number | null
          sugar_g?: number | null
          sodium_mg?: number | null
          barcode?: string | null
          openfoodfacts_id?: string | null
          photo_url?: string | null
          ai_estimated?: boolean
          ai_confidence?: number | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          logged_at?: string
          meal_type?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
          food_name?: string
          brand_name?: string | null
          quantity_g?: number
          calories?: number
          protein_g?: number
          carbs_g?: number
          fat_g?: number
          fiber_g?: number | null
          sugar_g?: number | null
          sodium_mg?: number | null
          barcode?: string | null
          openfoodfacts_id?: string | null
          photo_url?: string | null
          ai_estimated?: boolean
          ai_confidence?: number | null
          notes?: string | null
        }
      }
      exercises: {
        Row: {
          id: string
          name: string
          name_de: string | null
          category: 'strength' | 'cardio' | 'flexibility' | 'plyometric'
          equipment: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'bands' | 'other' | null
          muscle_primary: string[]
          muscle_secondary: string[]
          force_type: 'push' | 'pull' | 'static' | 'hinge' | 'squat' | null
          instructions: string | null
          video_url: string | null
          is_custom: boolean
          user_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          name_de?: string | null
          category: 'strength' | 'cardio' | 'flexibility' | 'plyometric'
          equipment?: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'bands' | 'other' | null
          muscle_primary?: string[]
          muscle_secondary?: string[]
          force_type?: 'push' | 'pull' | 'static' | 'hinge' | 'squat' | null
          instructions?: string | null
          video_url?: string | null
          is_custom?: boolean
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          name_de?: string | null
          category?: 'strength' | 'cardio' | 'flexibility' | 'plyometric'
          equipment?: 'barbell' | 'dumbbell' | 'cable' | 'machine' | 'bodyweight' | 'kettlebell' | 'bands' | 'other' | null
          muscle_primary?: string[]
          muscle_secondary?: string[]
          force_type?: 'push' | 'pull' | 'static' | 'hinge' | 'squat' | null
          instructions?: string | null
          video_url?: string | null
          is_custom?: boolean
          user_id?: string | null
          created_at?: string
        }
      }
      workout_sessions: {
        Row: {
          id: string
          user_id: string
          program_id: string | null
          program_day_id: string | null
          name: string | null
          started_at: string
          ended_at: string | null
          duration_seconds: number | null
          notes: string | null
          rpe_overall: number | null
          total_volume_kg: number | null
          health_strain: number | null
          location: 'gym' | 'home' | 'outdoor' | 'other' | null
        }
        Insert: {
          id?: string
          user_id: string
          program_id?: string | null
          program_day_id?: string | null
          name?: string | null
          started_at: string
          ended_at?: string | null
          duration_seconds?: number | null
          notes?: string | null
          rpe_overall?: number | null
          total_volume_kg?: number | null
          health_strain?: number | null
          location?: 'gym' | 'home' | 'outdoor' | 'other' | null
        }
        Update: {
          id?: string
          user_id?: string
          program_id?: string | null
          program_day_id?: string | null
          name?: string | null
          started_at?: string
          ended_at?: string | null
          duration_seconds?: number | null
          notes?: string | null
          rpe_overall?: number | null
          total_volume_kg?: number | null
          health_strain?: number | null
          location?: 'gym' | 'home' | 'outdoor' | 'other' | null
        }
      }
      workout_sets: {
        Row: {
          id: string
          session_id: string
          exercise_id: string
          set_number: number
          reps: number | null
          weight_kg: number | null
          duration_seconds: number | null
          distance_m: number | null
          rpe: number | null
          is_warmup: boolean
          is_dropset: boolean
          is_pr: boolean
          recorded_at: string
        }
        Insert: {
          id?: string
          session_id: string
          exercise_id: string
          set_number: number
          reps?: number | null
          weight_kg?: number | null
          duration_seconds?: number | null
          distance_m?: number | null
          rpe?: number | null
          is_warmup?: boolean
          is_dropset?: boolean
          is_pr?: boolean
          recorded_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          exercise_id?: string
          set_number?: number
          reps?: number | null
          weight_kg?: number | null
          duration_seconds?: number | null
          distance_m?: number | null
          rpe?: number | null
          is_warmup?: boolean
          is_dropset?: boolean
          is_pr?: boolean
          recorded_at?: string
        }
      }
      ai_conversations: {
        Row: {
          id: string
          user_id: string
          role: 'user' | 'assistant' | 'system_daily'
          content: string
          context_snapshot: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: 'user' | 'assistant' | 'system_daily'
          content: string
          context_snapshot?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: 'user' | 'assistant' | 'system_daily'
          content?: string
          context_snapshot?: Json | null
          created_at?: string
        }
      }
      programs: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          duration_weeks: number | null
          days_per_week: number | null
          difficulty: 'beginner' | 'intermediate' | 'advanced' | null
          goal: 'hypertrophy' | 'strength' | 'endurance' | 'general' | null
          is_active: boolean
          is_template: boolean
          is_recovery_week: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          duration_weeks?: number | null
          days_per_week?: number | null
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
          goal?: 'hypertrophy' | 'strength' | 'endurance' | 'general' | null
          is_active?: boolean
          is_template?: boolean
          is_recovery_week?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          duration_weeks?: number | null
          days_per_week?: number | null
          difficulty?: 'beginner' | 'intermediate' | 'advanced' | null
          goal?: 'hypertrophy' | 'strength' | 'endurance' | 'general' | null
          is_active?: boolean
          is_template?: boolean
          is_recovery_week?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      upsert_daily_summary: {
        Args: {
          p_user_id: string
          p_date: string
          p_steps?: number
          p_calories_burned?: number
          p_active_minutes?: number
          p_distance_km?: number
          p_sleep_minutes_total?: number
          p_sleep_score?: number
          p_resting_heart_rate?: number
          p_hrv_rmssd?: number
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
