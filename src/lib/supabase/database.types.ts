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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      camiones: {
        Row: {
          active: boolean
          anio: number | null
          chofer_id: string | null
          created_at: string
          dominio: string
          empresa: string | null
          id: string
          marca_modelo: string | null
          tipo: string
        }
        Insert: {
          active?: boolean
          anio?: number | null
          chofer_id?: string | null
          created_at?: string
          dominio: string
          empresa?: string | null
          id?: string
          marca_modelo?: string | null
          tipo: string
        }
        Update: {
          active?: boolean
          anio?: number | null
          chofer_id?: string | null
          created_at?: string
          dominio?: string
          empresa?: string | null
          id?: string
          marca_modelo?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "camiones_chofer_id_fkey"
            columns: ["chofer_id"]
            isOneToOne: false
            referencedRelation: "choferes"
            referencedColumns: ["id"]
          },
        ]
      }
      choferes: {
        Row: {
          active: boolean
          cuil: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          cuil?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          cuil?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      clientes: {
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
      order_items: {
        Row: {
          cantidad: number
          id: string
          order_note_id: string
          precio_unitario: number
          product_id: string
          tipo_envase: Database["public"]["Enums"]["packaging_type"]
        }
        Insert: {
          cantidad: number
          id?: string
          order_note_id: string
          precio_unitario: number
          product_id: string
          tipo_envase: Database["public"]["Enums"]["packaging_type"]
        }
        Update: {
          cantidad?: number
          id?: string
          order_note_id?: string
          precio_unitario?: number
          product_id?: string
          tipo_envase?: Database["public"]["Enums"]["packaging_type"]
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_note_id_fkey"
            columns: ["order_note_id"]
            isOneToOne: false
            referencedRelation: "order_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_notes: {
        Row: {
          chofer_id: string | null
          cliente: string
          created_at: string
          created_by: string | null
          estado_logistica: Database["public"]["Enums"]["logistica_status"]
          estado_produccion: Database["public"]["Enums"]["produccion_status"]
          fecha: string
          fecha_entrega: string | null
          fecha_envio: string | null
          id: string
          localidad: string | null
          numero: string
          observaciones: string | null
          provincia: string | null
          updated_at: string
          vendedor_id: string | null
          zona_id: string | null
        }
        Insert: {
          chofer_id?: string | null
          cliente: string
          created_at?: string
          created_by?: string | null
          estado_logistica?: Database["public"]["Enums"]["logistica_status"]
          estado_produccion?: Database["public"]["Enums"]["produccion_status"]
          fecha?: string
          fecha_entrega?: string | null
          fecha_envio?: string | null
          id?: string
          localidad?: string | null
          numero?: string
          observaciones?: string | null
          provincia?: string | null
          updated_at?: string
          vendedor_id?: string | null
          zona_id?: string | null
        }
        Update: {
          chofer_id?: string | null
          cliente?: string
          created_at?: string
          created_by?: string | null
          estado_logistica?: Database["public"]["Enums"]["logistica_status"]
          estado_produccion?: Database["public"]["Enums"]["produccion_status"]
          fecha?: string
          fecha_entrega?: string | null
          fecha_envio?: string | null
          id?: string
          localidad?: string | null
          numero?: string
          observaciones?: string | null
          provincia?: string | null
          updated_at?: string
          vendedor_id?: string | null
          zona_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_notes_chofer_id_fkey"
            columns: ["chofer_id"]
            isOneToOne: false
            referencedRelation: "choferes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notes_vendedor_id_fkey"
            columns: ["vendedor_id"]
            isOneToOne: false
            referencedRelation: "vendedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_notes_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          campo: Database["public"]["Enums"]["estado_campo"]
          changed_at: string
          changed_by: string | null
          estado: Database["public"]["Enums"]["order_status"]
          id: string
          order_note_id: string
        }
        Insert: {
          campo: Database["public"]["Enums"]["estado_campo"]
          changed_at?: string
          changed_by?: string | null
          estado: Database["public"]["Enums"]["order_status"]
          id?: string
          order_note_id: string
        }
        Update: {
          campo?: Database["public"]["Enums"]["estado_campo"]
          changed_at?: string
          changed_by?: string | null
          estado?: Database["public"]["Enums"]["order_status"]
          id?: string
          order_note_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_note_id_fkey"
            columns: ["order_note_id"]
            isOneToOne: false
            referencedRelation: "order_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          id: string
          packaging_type: Database["public"]["Enums"]["packaging_type"]
          price_usd: number | null
          product_id: string
          updated_at: string
          updated_by: string | null
          zone_id: string
        }
        Insert: {
          id?: string
          packaging_type: Database["public"]["Enums"]["packaging_type"]
          price_usd?: number | null
          product_id: string
          updated_at?: string
          updated_by?: string | null
          zone_id: string
        }
        Update: {
          id?: string
          packaging_type?: Database["public"]["Enums"]["packaging_type"]
          price_usd?: number | null
          product_id?: string
          updated_at?: string
          updated_by?: string | null
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prices_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prices_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "zones"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
      vendedores: {
        Row: {
          active: boolean
          id: string
          name: string
        }
        Insert: {
          active?: boolean
          id?: string
          name: string
        }
        Update: {
          active?: boolean
          id?: string
          name?: string
        }
        Relationships: []
      }
      zones: {
        Row: {
          code: string
          id: string
          name: string
          sort_order: number
        }
        Insert: {
          code: string
          id?: string
          name: string
          sort_order?: number
        }
        Update: {
          code?: string
          id?: string
          name?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_order_note: {
        Args: {
          p_chofer_id: string
          p_cliente: string
          p_fecha: string
          p_fecha_entrega: string
          p_items: Json
          p_localidad?: string
          p_observaciones: string
          p_provincia?: string
          p_vendedor_id: string
          p_zona_id: string
        }
        Returns: string
      }
    }
    Enums: {
      estado_campo: "LOGISTICA" | "PRODUCCION"
      logistica_status: "PENDIENTE" | "ENTREGADO"
      order_status: "PENDIENTE" | "FABRICADO" | "ENTREGADO"
      packaging_type: "GRANEL" | "BOLSA" | "BIG_BAG"
      produccion_status: "PENDIENTE" | "FABRICADO"
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
      estado_campo: ["LOGISTICA", "PRODUCCION"],
      logistica_status: ["PENDIENTE", "ENTREGADO"],
      order_status: ["PENDIENTE", "FABRICADO", "ENTREGADO"],
      packaging_type: ["GRANEL", "BOLSA", "BIG_BAG"],
      produccion_status: ["PENDIENTE", "FABRICADO"],
    },
  },
} as const
