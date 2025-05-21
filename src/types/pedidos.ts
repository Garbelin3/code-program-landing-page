
export interface PedidoItem {
  id: string;
  nome_produto: string;
  quantidade: number;
  quantidade_restante: number;
  preco_unitario: number;
}

export interface Bar {
  id: string;
  name: string;
  address: string;
}

export interface Pedido {
  id: string;
  created_at: string;
  valor_total: number;
  bar: Bar;
  itens: PedidoItem[];
}

export interface ItemAgregado {
  nome_produto: string;
  itens: PedidoItem[];
  total_disponivel: number;
}
