
export interface ItemRetirada {
  nome_produto: string;
  quantidade: number;
}

export interface CodigoRetirada {
  id: string;
  codigo: string;
  pedido_id: string;
  itens: Record<string, number>;
  usado: boolean;
  invalidado: boolean;
  created_at: string;
}

export interface BarInfo {
  id: string;
  name: string;
  address: string;
}

export interface PedidoBasic {
  id: string;
  created_at: string;
  valor_total: number;
  status: string;
  user_id: string;
  bars: BarInfo;
}
