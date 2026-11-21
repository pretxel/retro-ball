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
      rb_cards: {
        Row: {
          author_id: string
          body: string
          column_key: string
          created_at: string
          id: string
          room_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          column_key: string
          created_at?: string
          id?: string
          room_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          column_key?: string
          created_at?: string
          id?: string
          room_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rb_cards_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "rb_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rb_cards_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rb_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rb_participants: {
        Row: {
          display_name: string
          id: string
          is_facilitator: boolean
          joined_at: string
          last_seen_at: string
          room_id: string
        }
        Insert: {
          display_name: string
          id?: string
          is_facilitator?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id: string
        }
        Update: {
          display_name?: string
          id?: string
          is_facilitator?: boolean
          joined_at?: string
          last_seen_at?: string
          room_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rb_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rb_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rb_rooms: {
        Row: {
          anonymous_mode: boolean
          authors_revealed: boolean
          code: string
          created_at: string
          ended_at: string | null
          facilitator_id: string | null
          id: string
          last_activity_at: string
          template: string
          timer_seconds: number | null
          timer_started_at: string | null
          votes_per_user: number
        }
        Insert: {
          anonymous_mode?: boolean
          authors_revealed?: boolean
          code: string
          created_at?: string
          ended_at?: string | null
          facilitator_id?: string | null
          id?: string
          last_activity_at?: string
          template?: string
          timer_seconds?: number | null
          timer_started_at?: string | null
          votes_per_user?: number
        }
        Update: {
          anonymous_mode?: boolean
          authors_revealed?: boolean
          code?: string
          created_at?: string
          ended_at?: string | null
          facilitator_id?: string | null
          id?: string
          last_activity_at?: string
          template?: string
          timer_seconds?: number | null
          timer_started_at?: string | null
          votes_per_user?: number
        }
        Relationships: [
          {
            foreignKeyName: "rb_rooms_facilitator_fk"
            columns: ["facilitator_id"]
            isOneToOne: false
            referencedRelation: "rb_participants"
            referencedColumns: ["id"]
          },
        ]
      }
      rb_votes: {
        Row: {
          card_id: string
          created_at: string
          id: string
          room_id: string
          voter_id: string
        }
        Insert: {
          card_id: string
          created_at?: string
          id?: string
          room_id: string
          voter_id: string
        }
        Update: {
          card_id?: string
          created_at?: string
          id?: string
          room_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rb_votes_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "rb_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rb_votes_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rb_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rb_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "rb_participants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      pg_all_foreign_keys: {
        Row: {
          fk_columns: unknown[] | null
          fk_constraint_name: unknown
          fk_schema_name: unknown
          fk_table_name: unknown
          fk_table_oid: unknown
          is_deferrable: boolean | null
          is_deferred: boolean | null
          match_type: string | null
          on_delete: string | null
          on_update: string | null
          pk_columns: unknown[] | null
          pk_constraint_name: unknown
          pk_index_name: unknown
          pk_schema_name: unknown
          pk_table_name: unknown
          pk_table_oid: unknown
        }
        Relationships: []
      }
      tap_funky: {
        Row: {
          args: string | null
          is_definer: boolean | null
          is_strict: boolean | null
          is_visible: boolean | null
          kind: unknown
          langoid: unknown
          name: unknown
          oid: unknown
          owner: unknown
          returns: string | null
          returns_set: boolean | null
          schema: unknown
          volatility: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _rb_bump_activity: { Args: { p_room_id: string }; Returns: undefined }
      _cleanup: { Args: never; Returns: boolean }
      _contract_on: { Args: { "": string }; Returns: unknown }
      _currtest: { Args: never; Returns: number }
      _db_privs: { Args: never; Returns: unknown[] }
      _extensions: { Args: never; Returns: unknown[] }
      _rb_generate_room_code: { Args: never; Returns: string }
      _get: { Args: { "": string }; Returns: number }
      _get_latest: { Args: { "": string }; Returns: number[] }
      _get_note: { Args: { "": string }; Returns: string }
      _rb_is_facilitator: { Args: { p_pid: string }; Returns: boolean }
      _is_verbose: { Args: never; Returns: boolean }
      _rb_participant_in_room: {
        Args: { p_pid: string; p_room_id: string }
        Returns: boolean
      }
      _prokind: { Args: { p_oid: unknown }; Returns: unknown }
      _query: { Args: { "": string }; Returns: string }
      _rb_rate_limit_check: {
        Args: {
          p_action: string
          p_limit: number
          p_participant_id: string
          p_window?: string
        }
        Returns: undefined
      }
      _refine_vol: { Args: { "": string }; Returns: string }
      _rb_room_active: { Args: { p_room_id: string }; Returns: boolean }
      _rb_room_for_participant: { Args: { p_pid: string }; Returns: string }
      _table_privs: { Args: never; Returns: unknown[] }
      _temptypes: { Args: { "": string }; Returns: string }
      _todo: { Args: never; Returns: string }
      rb_add_card: {
        Args: { p_body: string; p_column_key: string; p_participant_id: string }
        Returns: {
          author_id: string
          body: string
          column_key: string
          created_at: string
          id: string
          room_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rb_cards"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rb_cards_visible: {
        Args: { p_viewer_id: string }
        Returns: {
          author_id: string
          body: string
          column_key: string
          created_at: string
          id: string
          room_id: string
          updated_at: string
        }[]
      }
      rb_cast_vote: {
        Args: { p_card_id: string; p_participant_id: string }
        Returns: {
          card_id: string
          created_at: string
          id: string
          room_id: string
          voter_id: string
        }
        SetofOptions: {
          from: "*"
          to: "rb_votes"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      col_is_null:
        | {
            Args: {
              column_name: unknown
              description?: string
              schema_name: unknown
              table_name: unknown
            }
            Returns: string
          }
        | {
            Args: {
              column_name: unknown
              description?: string
              table_name: unknown
            }
            Returns: string
          }
      col_not_null:
        | {
            Args: {
              column_name: unknown
              description?: string
              schema_name: unknown
              table_name: unknown
            }
            Returns: string
          }
        | {
            Args: {
              column_name: unknown
              description?: string
              table_name: unknown
            }
            Returns: string
          }
      rb_create_room: {
        Args: { p_display_name: string }
        Returns: {
          code: string
          participant_id: string
          room_id: string
        }[]
      }
      rb_delete_card: {
        Args: { p_card_id: string; p_participant_id: string }
        Returns: undefined
      }
      diag:
        | {
            Args: { msg: unknown }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.diag(msg => text), public.diag(msg => anyelement). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { msg: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.diag(msg => text), public.diag(msg => anyelement). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      diag_test_name: { Args: { "": string }; Returns: string }
      do_tap:
        | { Args: never; Returns: string[] }
        | { Args: { "": string }; Returns: string[] }
      rb_edit_card: {
        Args: { p_body: string; p_card_id: string; p_participant_id: string }
        Returns: {
          author_id: string
          body: string
          column_key: string
          created_at: string
          id: string
          room_id: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "rb_cards"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      rb_end_room: { Args: { p_participant_id: string }; Returns: undefined }
      fail:
        | { Args: never; Returns: string }
        | { Args: { "": string }; Returns: string }
      findfuncs: { Args: { "": string }; Returns: string[] }
      finish: { Args: { exception_on_failure?: boolean }; Returns: string[] }
      rb_get_room_state: {
        Args: { p_room_id: string; p_viewer_id?: string }
        Returns: {
          cards: Json
          participants: Json
          room: Json
          votes: Json
        }[]
      }
      has_unique: { Args: { "": string }; Returns: string }
      in_todo: { Args: never; Returns: boolean }
      is_empty: { Args: { "": string }; Returns: string }
      isnt_empty: { Args: { "": string }; Returns: string }
      rb_join_room: {
        Args: { p_code: string; p_display_name: string }
        Returns: {
          participant_id: string
          room_id: string
        }[]
      }
      lives_ok: { Args: { "": string }; Returns: string }
      no_plan: { Args: never; Returns: boolean[] }
      num_failed: { Args: never; Returns: number }
      os_name: { Args: never; Returns: string }
      pass:
        | { Args: never; Returns: string }
        | { Args: { "": string }; Returns: string }
      pg_version: { Args: never; Returns: string }
      pg_version_num: { Args: never; Returns: number }
      pgtap_version: { Args: never; Returns: number }
      rb_purge_stale_rooms: { Args: never; Returns: number }
      rb_reveal_authors: { Args: { p_participant_id: string }; Returns: undefined }
      rb_revoke_vote: {
        Args: { p_card_id: string; p_participant_id: string }
        Returns: undefined
      }
      runtests:
        | { Args: never; Returns: string[] }
        | { Args: { "": string }; Returns: string[] }
      rb_set_anonymous_mode: {
        Args: { p_on: boolean; p_participant_id: string }
        Returns: undefined
      }
      rb_set_votes_per_user: {
        Args: { p_n: number; p_participant_id: string }
        Returns: undefined
      }
      skip:
        | { Args: { "": string }; Returns: string }
        | { Args: { how_many: number; why: string }; Returns: string }
      rb_start_timer: {
        Args: { p_participant_id: string; p_seconds: number }
        Returns: undefined
      }
      rb_stop_timer: { Args: { p_participant_id: string }; Returns: undefined }
      throws_ok: { Args: { "": string }; Returns: string }
      todo:
        | { Args: { how_many: number }; Returns: boolean[] }
        | { Args: { how_many: number; why: string }; Returns: boolean[] }
        | { Args: { why: string }; Returns: boolean[] }
        | { Args: { how_many: number; why: string }; Returns: boolean[] }
      todo_end: { Args: never; Returns: boolean[] }
      todo_start:
        | { Args: never; Returns: boolean[] }
        | { Args: { "": string }; Returns: boolean[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      _time_trial_type: {
        a_time: number | null
      }
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
    Enums: {},
  },
} as const

