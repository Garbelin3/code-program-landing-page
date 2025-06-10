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
      bars: {
        Row: {
          active: boolean | null
          address: string
          created_at: string
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean | null
          address: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean | null
          address?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chaves_pix: {
        Row: {
          bar_id: string
          chave_pix: string
          created_at: string
          id: string
          nome_beneficiario: string
          status: string
          tipo_chave: string
          updated_at: string
        }
        Insert: {
          bar_id: string
          chave_pix: string
          created_at?: string
          id?: string
          nome_beneficiario: string
          status?: string
          tipo_chave: string
          updated_at?: string
        }
        Update: {
          bar_id?: string
          chave_pix?: string
          created_at?: string
          id?: string
          nome_beneficiario?: string
          status?: string
          tipo_chave?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chaves_pix_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      codigos_retirada: {
        Row: {
          codigo: string
          created_at: string
          id: string
          invalidado: boolean | null
          itens: Json
          pedido_id: string | null
          pedido_pdv_id: string | null
          usado: boolean | null
        }
        Insert: {
          codigo: string
          created_at?: string
          id?: string
          invalidado?: boolean | null
          itens: Json
          pedido_id?: string | null
          pedido_pdv_id?: string | null
          usado?: boolean | null
        }
        Update: {
          codigo?: string
          created_at?: string
          id?: string
          invalidado?: boolean | null
          itens?: Json
          pedido_id?: string | null
          pedido_pdv_id?: string | null
          usado?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "codigos_retirada_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedido_itens: {
        Row: {
          created_at: string
          id: string
          nome_produto: string
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          quantidade_restante: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_produto: string
          pedido_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          quantidade_restante: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_produto?: string
          pedido_id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          quantidade_restante?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedido_itens_pedido_id_fkey"
            columns: ["pedido_id"]
            isOneToOne: false
            referencedRelation: "pedidos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedido_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          bar_id: string
          created_at: string
          data_pagamento: string | null
          id: string
          mercadopago_preference_id: string | null
          status: string | null
          updated_at: string
          user_id: string
          valor_total: number
        }
        Insert: {
          bar_id: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          mercadopago_preference_id?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          valor_total: number
        }
        Update: {
          bar_id?: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          mercadopago_preference_id?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_pdv: {
        Row: {
          bar_id: string
          cliente_email: string | null
          cliente_nome: string | null
          created_at: string
          id: string
          metodo_pagamento: string
          observacoes: string | null
          status: string
          updated_at: string
          user_id: string | null
          valor_total: number
        }
        Insert: {
          bar_id: string
          cliente_email?: string | null
          cliente_nome?: string | null
          created_at?: string
          id?: string
          metodo_pagamento: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          valor_total: number
        }
        Update: {
          bar_id?: string
          cliente_email?: string | null
          cliente_nome?: string | null
          created_at?: string
          id?: string
          metodo_pagamento?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_pdv_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos_pdv_itens: {
        Row: {
          created_at: string
          id: string
          nome_produto: string
          pedido_pdv_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          quantidade_restante: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome_produto: string
          pedido_pdv_id: string
          preco_unitario: number
          produto_id: string
          quantidade: number
          quantidade_restante: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome_produto?: string
          pedido_pdv_id?: string
          preco_unitario?: number
          produto_id?: string
          quantidade?: number
          quantidade_restante?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_pdv_itens_pedido_pdv_id_fkey"
            columns: ["pedido_pdv_id"]
            isOneToOne: false
            referencedRelation: "pedidos_pdv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pedidos_pdv_itens_produto_id_fkey"
            columns: ["produto_id"]
            isOneToOne: false
            referencedRelation: "produtos"
            referencedColumns: ["id"]
          },
        ]
      }
      produtos: {
        Row: {
          ativo: boolean
          bar_id: string
          categoria: string
          created_at: string
          descricao: string | null
          id: string
          nome: string
          preco: number
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          bar_id: string
          categoria: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome: string
          preco: number
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          bar_id?: string
          categoria?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome?: string
          preco?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "produtos_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          bar_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          bar_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          bar_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      solicitacoes_saque: {
        Row: {
          bar_id: string
          chave_pix_id: string
          created_at: string
          data_processamento: string | null
          data_solicitacao: string
          id: string
          observacoes: string | null
          status: string
          updated_at: string
          valor_solicitado: number
        }
        Insert: {
          bar_id: string
          chave_pix_id: string
          created_at?: string
          data_processamento?: string | null
          data_solicitacao?: string
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_solicitado: number
        }
        Update: {
          bar_id?: string
          chave_pix_id?: string
          created_at?: string
          data_processamento?: string | null
          data_solicitacao?: string
          id?: string
          observacoes?: string | null
          status?: string
          updated_at?: string
          valor_solicitado?: number
        }
        Relationships: [
          {
            foreignKeyName: "solicitacoes_saque_bar_id_fkey"
            columns: ["bar_id"]
            isOneToOne: false
            referencedRelation: "bars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solicitacoes_saque_chave_pix_id_fkey"
            columns: ["chave_pix_id"]
            isOneToOne: false
            referencedRelation: "chaves_pix"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      buscar_usuario_por_email: {
        Args: { email_busca: string }
        Returns: string
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      user_can_access_bar: {
        Args: { bar_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
