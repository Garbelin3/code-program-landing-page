
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { PedidoFinalizadoDia } from '@/types/pdv';

export const useHistoricoDia = (barId: string) => {
  const [pedidos, setPedidos] = useState<PedidoFinalizadoDia[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPedidosDia = async () => {
    setLoading(true);
    try {
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);

      // Usar query SQL direta para contornar problema de tipos
      const { data, error } = await supabase
        .from('pedidos_pdv' as any)
        .select('id, valor_total, created_at, metodo_pagamento, observacoes, cliente_email, cliente_nome')
        .eq('bar_id', barId)
        .eq('status', 'pago')
        .gte('created_at', hoje.toISOString())
        .lt('created_at', amanha.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapear dados do banco para o tipo correto
      const pedidosFormatados: PedidoFinalizadoDia[] = (data || []).map(pedido => ({
        id: pedido.id,
        valor_total: pedido.valor_total,
        created_at: pedido.created_at,
        metodo_pagamento: pedido.metodo_pagamento,
        observacoes: pedido.observacoes,
        cliente_email: pedido.cliente_email,
        cliente_nome: pedido.cliente_nome
      }));

      setPedidos(pedidosFormatados);
    } catch (error: any) {
      console.error('Erro ao buscar histórico:', error);
      toast({
        title: 'Erro ao carregar histórico',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (barId) {
      fetchPedidosDia();
    }
  }, [barId]);

  return {
    pedidos,
    loading,
    refetch: fetchPedidosDia
  };
};
