
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface FaturamentoData {
  total: number;
  mensal: number;
  semanal: number;
  porPeriodo: { data: string; valor: number }[];
}

export const useFaturamento = (barId: string, dataInicio?: Date, dataFim?: Date) => {
  const [faturamento, setFaturamento] = useState<FaturamentoData>({
    total: 0,
    mensal: 0,
    semanal: 0,
    porPeriodo: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaturamento = async () => {
      if (!barId) return;
      
      setLoading(true);
      try {
        // Buscar pedidos pagos do bar
        const { data: pedidos, error } = await supabase
          .from('pedidos')
          .select('valor_total, data_pagamento')
          .eq('bar_id', barId)
          .eq('status', 'pago')
          .not('data_pagamento', 'is', null);

        if (error) throw error;

        if (!pedidos || pedidos.length === 0) {
          setFaturamento({ total: 0, mensal: 0, semanal: 0, porPeriodo: [] });
          return;
        }

        // Calcular totais
        const total = pedidos.reduce((sum, pedido) => sum + Number(pedido.valor_total), 0);

        // Data atual
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay());

        // Filtrar por período
        const pedidosMes = pedidos.filter(p => 
          new Date(p.data_pagamento!) >= inicioMes
        );
        const pedidosSemana = pedidos.filter(p => 
          new Date(p.data_pagamento!) >= inicioSemana
        );

        const mensal = pedidosMes.reduce((sum, pedido) => sum + Number(pedido.valor_total), 0);
        const semanal = pedidosSemana.reduce((sum, pedido) => sum + Number(pedido.valor_total), 0);

        // Dados por período (para o filtro de datas)
        let pedidosFiltrados = pedidos;
        if (dataInicio && dataFim) {
          pedidosFiltrados = pedidos.filter(p => {
            const dataPagamento = new Date(p.data_pagamento!);
            return dataPagamento >= dataInicio && dataPagamento <= dataFim;
          });
        }

        // Agrupar por data
        const porPeriodo = pedidosFiltrados.reduce((acc, pedido) => {
          const data = new Date(pedido.data_pagamento!).toISOString().split('T')[0];
          const existing = acc.find(item => item.data === data);
          if (existing) {
            existing.valor += Number(pedido.valor_total);
          } else {
            acc.push({ data, valor: Number(pedido.valor_total) });
          }
          return acc;
        }, [] as { data: string; valor: number }[]);

        setFaturamento({ total, mensal, semanal, porPeriodo });
      } catch (error: any) {
        console.error('Erro ao buscar faturamento:', error);
        toast({
          title: 'Erro ao carregar faturamento',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFaturamento();
  }, [barId, dataInicio, dataFim]);

  return { faturamento, loading };
};
