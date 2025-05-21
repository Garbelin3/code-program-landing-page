
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
  created_at: string;
  invalidado?: boolean;
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
  bar: BarInfo;
}
