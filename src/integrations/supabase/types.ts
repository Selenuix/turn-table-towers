export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          message_type: string
          player_id: string
          room_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          message_type?: string
          player_id: string
          room_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          player_id?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      game_logs: {
        Row: {
          action_data: Json | null
          action_type: string
          created_at: string
          id: string
          player_id: string | null
          room_id: string
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          created_at?: string
          id?: string
          player_id?: string | null
          room_id: string
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          player_id?: string | null
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_logs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_logs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      game_rooms: {
        Row: {
          id: string
          name: string | null
          owner_id: string
          player_ids: string[]
          max_players: number
          room_code: string
          created_at: string
          updated_at: string
          status: string
        }
        Insert: {
          id?: string
          name?: string | null
          owner_id: string
          player_ids?: string[]
          max_players?: number
          room_code: string
          created_at?: string
          updated_at?: string
          status?: string
        }
        Update: {
          id?: string
          name?: string | null
          owner_id?: string
          player_ids?: string[]
          max_players?: number
          room_code?: string
          created_at?: string
          updated_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_rooms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      game_states: {
        Row: {
          created_at: string
          current_player_id: string | null
          deck: Json
          discard_pile: Json
          id: string
          player_states: Json
          room_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_player_id?: string | null
          deck: Json
          discard_pile: Json
          id?: string
          player_states: Json
          room_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_player_id?: string | null
          deck?: Json
          discard_pile?: Json
          id?: string
          player_states?: Json
          room_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_states_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: true
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          updated_at: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id: string
          updated_at?: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          show_rules_on_create: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          show_rules_on_create?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          show_rules_on_create?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_room_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      initialize_game_state: {
        Args: { p_room_id: string }
        Returns: {
          created_at: string
          current_player_id: string | null
          deck: Database["public"]["CompositeTypes"]["card"][]
          discard_pile: Database["public"]["CompositeTypes"]["card"][]
          id: string
          player_states: Json
          room_id: string | null
          status: string | null
          updated_at: string
        }
      }
      join_game_room: {
        Args: {
          p_room_id: string
          p_current_player_ids: string[]
          p_new_player_ids: string[]
        }
        Returns: {
          created_at: string
          id: string
          max_players: number
          name: string | null
          owner_id: string
          player_ids: string[] | null
          room_code: string
          status: Database["public"]["Enums"]["game_status"] | null
          updated_at: string
        }
      }
      leave_game_room: {
        Args: {
          p_room_id: string
          p_current_player_ids: string[]
          p_new_player_ids: string[]
          p_new_owner_id: string
        }
        Returns: {
          created_at: string
          id: string
          max_players: number
          name: string | null
          owner_id: string
          player_ids: string[] | null
          room_code: string
          status: Database["public"]["Enums"]["game_status"] | null
          updated_at: string
        }
      }
      log_game_action: {
        Args: {
          p_room_id: string
          p_player_id: string
          p_action_type: string
          p_action_data?: Json
        }
        Returns: undefined
      }
      start_game: {
        Args: { p_room_id: string }
        Returns: {
          created_at: string
          current_player_id: string | null
          deck: Database["public"]["CompositeTypes"]["card"][]
          discard_pile: Database["public"]["CompositeTypes"]["card"][]
          id: string
          player_states: Json
          room_id: string | null
          status: string | null
          updated_at: string
        }
      }
      update_player_cards: {
        Args: {
          p_room_id: string
          p_player_id: string
          p_shield_index: number
          p_hp_indices: number[]
        }
        Returns: {
          created_at: string
          current_player_id: string | null
          deck: Database["public"]["CompositeTypes"]["card"][]
          discard_pile: Database["public"]["CompositeTypes"]["card"][]
          id: string
          player_states: Json
          room_id: string | null
          status: string | null
          updated_at: string
        }
      }
    }
    Enums: {
      card_rank:
        | "ace"
        | "2"
        | "3"
        | "4"
        | "5"
        | "6"
        | "7"
        | "8"
        | "9"
        | "10"
        | "jack"
        | "queen"
        | "king"
      card_suit: "hearts" | "diamonds" | "clubs" | "spades"
      game_status: "waiting" | "in_progress" | "finished"
    }
    CompositeTypes: {
      card: {
        suit: Database["public"]["Enums"]["card_suit"] | null
        rank: Database["public"]["Enums"]["card_rank"] | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      card_rank: [
        "ace",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        "10",
        "jack",
        "queen",
        "king",
      ],
      card_suit: ["hearts", "diamonds", "clubs", "spades"],
      game_status: ["waiting", "in_progress", "finished"],
    },
  },
} as const
