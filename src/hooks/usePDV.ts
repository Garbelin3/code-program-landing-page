
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ItemCarrinho, ClientePDV, MetodoPagamento, PedidoPDV, PedidoFinalizadoDia } from '@/types/pdv';

export const usePDV = (barId: string) => {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [cliente, setCliente] = useState<ClientePDV>({});
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('dinheiro');
  const [observacoes, setObservacoes] = useState('');
  const [finalizando, setFinalizando] = useState(false);

  const adicionarItem = useCallback((produto: Omit<ItemCarrinho, 'quantidade'>) => {
    setCarrinho(prev => {
      const itemExistente = prev.find(item => item.produto_id === produto.produto_id);
      
      if (itemExistente) {
        return prev.map(item =>
          item.produto_id === produto.produto_id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      }
      
      return [...prev, { ...produto, quantidade: 1 }];
    });
  }, []);

  const removerItem = useCallback((produtoId: string) => {
    setCarrinho(prev => prev.filter(item => item.produto_id !== produtoId));
  }, []);

  const alterarQuantidade = useCallback((produtoId: string, novaQuantidade: number) => {
    if (novaQuantidade <= 0) {
      removerItem(produtoId);
      return;
    }

    setCarrinho(prev => 
      prev.map(item =>
        item.produto_id === produtoId
          ? { ...item, quantidade: novaQuantidade }
          : item
      )
    );
  }, [removerItem]);

  const limparCarrinho = useCallback(() => {
    setCarrinho([]);
    setCliente({});
    setObservacoes('');
  }, []);

  const calcularTotal = useCallback(() => {
    return carrinho.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  }, [carrinho]);

  const finalizarPedido = useCallback(async (): Promise<string | null> => {
    if (carrinho.length === 0) {
      toast({
        title: 'Carrinho vazio',
        description: 'Adicione itens ao carrinho antes de finalizar',
        variant: 'destructive'
      });
      return null;
    }

    setFinalizando(true);
    try {
      const valorTotal = calcularTotal();
      let userId = null;

      // Se há email do cliente, tenta buscar o usuário
      if (cliente.email) {
        const { data: userIdResult } = await supabase
          .rpc('buscar_usuario_por_email', { 
            email_busca: cliente.email 
          });
        
        if (userIdResult) {
          userId = userIdResult;
        }
      }

      // Criar o pedido PDV
      const { data: pedidoPDV, error: pedidoError } = await supabase
        .from('pedidos_pdv')
        .insert({
          bar_id: barId,
          user_id: userId,
          valor_total: valorTotal,
          metodo_pagamento: metodoPagamento,
          observacoes: observacoes || null,
          cliente_email: cliente.email || null,
          cliente_nome: cliente.nome || null,
          status: 'pago'
        })
        .select()
        .single();

      if (pedidoError) throw pedidoError;

      // Criar os itens do pedido PDV
      const itensFormatados = carrinho.map(item => ({
        pedido_pdv_id: pedidoPDV.id,
        produto_id: item.produto_id,
        nome_produto: item.nome,
        quantidade: item.quantidade,
        quantidade_restante: item.quantidade,
        preco_unitario: item.preco
      }));

      const { error: itensError } = await supabase
        .from('pedidos_pdv_itens')
        .insert(itensFormatados);

      if (itensError) throw itensError;

      // Gerar código de retirada
      const codigoRetirada = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { error: codigoError } = await supabase
        .from('codigos_retirada')
        .insert({
          pedido_pdv_id: pedidoPDV.id,
          codigo: codigoRetirada,
          itens: itensFormatados.map(item => ({
            produto_id: item.produto_id,
            nome_produto: item.nome_produto,
            quantidade: item.quantidade
          }))
        });

      if (codigoError) throw codigoError;

      // Se há email do cliente, enviar código por email
      if (cliente.email) {
        try {
          await supabase.functions.invoke('send-pedido-code', {
            body: {
              email: cliente.email,
              codigo: codigoRetirada,
              pedidoId: pedidoPDV.id,
              valorTotal,
              itens: carrinho
            }
          });
        } catch (emailError) {
          console.warn('Erro ao enviar email:', emailError);
          // Não falha o pedido se o email falhar
        }
      }

      limparCarrinho();
      
      toast({
        title: 'Pedido finalizado!',
        description: `Código de retirada: ${codigoRetirada}`,
      });

      return codigoRetirada;
    } catch (error: any) {
      console.error('Erro ao finalizar pedido:', error);
      toast({
        title: 'Erro ao finalizar pedido',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setFinalizando(false);
    }
  }, [carrinho, barId, cliente, metodoPagamento, observacoes, calcularTotal, limparCarrinho]);

  return {
    carrinho,
    cliente,
    metodoPagamento,
    observacoes,
    finalizando,
    adicionarItem,
    removerItem,
    alterarQuantidade,
    limparCarrinho,
    calcularTotal,
    finalizarPedido,
    setCliente,
    setMetodoPagamento,
    setObservacoes
  };
};
