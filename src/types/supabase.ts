
import { Database as GeneratedDatabase } from "@/integrations/supabase/types";

// Extend the generated database types
export interface PedidosRow {
  id: string;
  user_id: string;
  bar_id: string;
  valor_total: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface PedidoItensRow {
  id: string;
  pedido_id: string;
  produto_id: string;
  quantidade: number;
  quantidade_restante: number;
  preco_unitario: number;
  nome_produto: string;
  created_at: string;
  updated_at: string;
}

// Custom database interface that extends the generated one
export interface Database {
  public: {
    Tables: {
      pedidos: {
        Row: PedidosRow;
        Insert: Omit<PedidosRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PedidosRow, 'id' | 'created_at' | 'updated_at'>>;
      };
      pedido_itens: {
        Row: PedidoItensRow;
        Insert: Omit<PedidoItensRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<PedidoItensRow, 'id' | 'created_at' | 'updated_at'>>;
      };
    } & GeneratedDatabase['public']['Tables'];
    Views: GeneratedDatabase['public']['Views'];
    Functions: GeneratedDatabase['public']['Functions'];
    Enums: GeneratedDatabase['public']['Enums'];
    CompositeTypes: GeneratedDatabase['public']['CompositeTypes'];
  };
}
