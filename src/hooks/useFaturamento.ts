
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
      console.log('=== DEBUG FATURAMENTO ===');
      console.log('barId recebido:', barId);
      console.log('dataInicio:', dataInicio);
      console.log('dataFim:', dataFim);
      
      if (!barId) {
        console.log('❌ barId está vazio, retornando...');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        console.log('🔍 Buscando pedidos pagos para o bar:', barId);
        
        // Primeiro, vamos verificar se conseguimos acessar a tabela pedidos
        console.log('🧪 Teste 1: Verificando acesso básico à tabela pedidos...');
        const { data: testPedidos, error: testError } = await supabase
          .from('pedidos')
          .select('id, bar_id, status')
          .limit(5);
        
        console.log('🧪 Resultado do teste básico:');
        console.log('- Error:', testError);
        console.log('- Dados:', testPedidos);
        console.log('- Quantidade:', testPedidos?.length || 0);

        // Segundo, vamos verificar especificamente para este bar
        console.log('🧪 Teste 2: Verificando pedidos específicos do bar...');
        const { data: barPedidos, error: barError } = await supabase
          .from('pedidos')
          .select('id, bar_id, status, valor_total, data_pagamento')
          .eq('bar_id', barId);
        
        console.log('🧪 Resultado pedidos do bar:');
        console.log('- Error:', barError);
        console.log('- Dados:', barPedidos);
        console.log('- Quantidade:', barPedidos?.length || 0);

        // Buscar pedidos pagos do bar (consulta principal)
        const { data: pedidos, error } = await supabase
          .from('pedidos')
          .select('valor_total, data_pagamento, status')
          .eq('bar_id', barId)
          .eq('status', 'pago')
          .not('data_pagamento', 'is', null);

        console.log('📊 Resultado da consulta principal:');
        console.log('- Error:', error);
        console.log('- Dados retornados:', pedidos);
        console.log('- Quantidade de pedidos:', pedidos?.length || 0);

        if (error) {
          console.error('❌ Erro na consulta:', error);
          throw error;
        }

        if (!pedidos || pedidos.length === 0) {
          console.log('⚠️ Nenhum pedido pago encontrado');
          setFaturamento({ total: 0, mensal: 0, semanal: 0, porPeriodo: [] });
          return;
        }

        console.log('✅ Pedidos encontrados:', pedidos.length);

        // Calcular totais
        const total = pedidos.reduce((sum, pedido) => {
          const valor = Number(pedido.valor_total);
          console.log(`Pedido valor: ${valor}`);
          return sum + valor;
        }, 0);

        console.log('💰 Total calculado:', total);

        // Data atual
        const agora = new Date();
        const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay());

        console.log('📅 Datas de referência:');
        console.log('- Hoje:', agora.toISOString());
        console.log('- Início do mês:', inicioMes.toISOString());
        console.log('- Início da semana:', inicioSemana.toISOString());

        // Filtrar por período
        const pedidosMes = pedidos.filter(p => {
          const dataPagamento = new Date(p.data_pagamento!);
          const isThisMonth = dataPagamento >= inicioMes;
          console.log(`Pedido ${p.valor_total} - Data: ${dataPagamento.toISOString()} - É deste mês: ${isThisMonth}`);
          return isThisMonth;
        });
        
        const pedidosSemana = pedidos.filter(p => {
          const dataPagamento = new Date(p.data_pagamento!);
          const isThisWeek = dataPagamento >= inicioSemana;
          console.log(`Pedido ${p.valor_total} - Data: ${dataPagamento.toISOString()} - É desta semana: ${isThisWeek}`);
          return isThisWeek;
        });

        const mensal = pedidosMes.reduce((sum, pedido) => sum + Number(pedido.valor_total), 0);
        const semanal = pedidosSemana.reduce((sum, pedido) => sum + Number(pedido.valor_total), 0);

        console.log('📈 Valores calculados:');
        console.log('- Total:', total);
        console.log('- Mensal:', mensal);
        console.log('- Semanal:', semanal);

        // Dados por período (para o filtro de datas)
        let pedidosFiltrados = pedidos;
        if (dataInicio && dataFim) {
          console.log('🔍 Aplicando filtro de data:', dataInicio, 'até', dataFim);
          pedidosFiltrados = pedidos.filter(p => {
            const dataPagamento = new Date(p.data_pagamento!);
            return dataPagamento >= dataInicio && dataPagamento <= dataFim;
          });
          console.log('📊 Pedidos filtrados por data:', pedidosFiltrados.length);
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

        console.log('📊 Dados por período:', porPeriodo);

        const novoFaturamento = { total, mensal, semanal, porPeriodo };
        console.log('🎯 Faturamento final:', novoFaturamento);
        
        setFaturamento(novoFaturamento);
      } catch (error: any) {
        console.error('❌ Erro ao buscar faturamento:', error);
        toast({
          title: 'Erro ao carregar faturamento',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
        console.log('=== FIM DEBUG FATURAMENTO ===');
      }
    };

    fetchFaturamento();
  }, [barId, dataInicio, dataFim]);

  return { faturamento, loading };
};
