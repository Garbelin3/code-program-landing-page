
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

      const { data, error } = await supabase
        .from('pedidos_pdv')
        .select('id, valor_total, created_at, metodo_pagamento, observacoes, cliente_email, cliente_nome')
        .eq('bar_id', barId)
        .eq('status', 'pago')
        .gte('created_at', hoje.toISOString())
        .lt('created_at', amanha.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPedidos(data || []);
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

  const reenviarCodigo = async (pedidoId: string, email: string) => {
    try {
      // Buscar código de retirada
      const { data: codigo, error: codigoError } = await supabase
        .from('codigos_retirada')
        .select('codigo')
        .eq('pedido_pdv_id', pedidoId)
        .single();

      if (codigoError) throw codigoError;

      // Reenviar por email
      await supabase.functions.invoke('send-pedido-code', {
        body: {
          email,
          codigo: codigo.codigo,
          pedidoId,
          reenvio: true
        }
      });

      toast({
        title: 'Código reenviado',
        description: `Código enviado para ${email}`
      });
    } catch (error: any) {
      console.error('Erro ao reenviar código:', error);
      toast({
        title: 'Erro ao reenviar código',
        description: error.message,
        variant: 'destructive'
      });
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
    reenviarCodigo,
    refetch: fetchPedidosDia
  };
};
