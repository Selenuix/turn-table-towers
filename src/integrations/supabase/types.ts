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
            foreignKeyName: "chat_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_messages_player"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_messages_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "game_logs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
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
        Insert: {
          created_at?: string
          id?: string
          max_players?: number
          name?: string | null
          owner_id: string
          player_ids?: string[] | null
          room_code: string
          status?: Database["public"]["Enums"]["game_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_players?: number
          name?: string | null
          owner_id?: string
          player_ids?: string[] | null
          room_code?: string
          status?: Database["public"]["Enums"]["game_status"] | null
          updated_at?: string
        }
        Relationships: []
      }
      game_states: {
        Row: {
          created_at: string
          current_player_id: string | null
          deck: Database["public"]["CompositeTypes"]["card"][]
          discard_pile: Database["public"]["CompositeTypes"]["card"][]
          id: string
          player_states: Json
          room_id: string
          status: Database["public"]["Enums"]["game_status"] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_player_id?: string | null
          deck: Database["public"]["CompositeTypes"]["card"][]
          discard_pile?: Database["public"]["CompositeTypes"]["card"][]
          id?: string
          player_states: Json
          room_id: string
          status?: Database["public"]["Enums"]["game_status"] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_player_id?: string | null
          deck?: Database["public"]["CompositeTypes"]["card"][]
          discard_pile?: Database["public"]["CompositeTypes"]["card"][]
          id?: string
          player_states?: Json
          room_id?: string
          status?: Database["public"]["Enums"]["game_status"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_states_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string
          id: string
          show_rules_on_create: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          show_rules_on_create?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          show_rules_on_create?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          room_id: string
          status: Database["public"]["Enums"]["game_status"] | null
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
      send_message: {
        Args: {
          p_room_id: string
          p_player_id: string
          p_message: string
          p_message_type?: string
        }
        Returns: Json
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
