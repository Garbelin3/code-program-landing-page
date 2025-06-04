
export interface ItemCarrinho {
  produto_id: string;
  nome: string;
  preco: number;
  quantidade: number;
  categoria: string;
  descricao?: string;
}

export interface ClientePDV {
  email?: string;
  nome?: string;
}

export type MetodoPagamento = 'dinheiro' | 'pix' | 'cartao_credito' | 'cartao_debito';

export interface PedidoPDV {
  itens: ItemCarrinho[];
  cliente?: ClientePDV;
  metodoPagamento?: MetodoPagamento;
  observacoes?: string;
  valorTotal: number;
}

export interface PedidoFinalizadoDia {
  id: string;
  valor_total: number;
  created_at: string;
  metodo_pagamento?: MetodoPagamento;
  observacoes?: string;
  cliente_email?: string;
}
