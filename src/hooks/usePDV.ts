
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ItemCarrinho, ClientePDV, MetodoPagamento, PedidoPDV, PedidoFinalizadoDia } from '@/types/pdv';

// ID fixo do usuário especial para pedidos PDV
const PDV_USER_ID = '00000000-0000-0000-0000-000000000001';

export const usePDV = (barId: string) => {
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [cliente, setCliente] = useState<ClientePDV>({});
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>('dinheiro');
  const [observacoes, setObservacoes] = useState('');
  const [finalizando, setFinalizando] = useState(false);
  const [pdvUserReady, setPdvUserReady] = useState(false);

  // Verificar se o usuário PDV existe ao inicializar
  useEffect(() => {
    const verificarUsuarioPDV = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', PDV_USER_ID)
          .eq('role', 'sistema')
          .single();

        if (error) {
          console.error('Erro ao verificar usuário PDV:', error);
          toast({
            title: 'Erro no sistema PDV',
            description: 'Usuário PDV não configurado corretamente',
            variant: 'destructive'
          });
          return;
        }

        if (data) {
          setPdvUserReady(true);
          console.log('✅ Usuário PDV verificado e pronto para uso');
        }
      } catch (error) {
        console.error('Erro inesperado ao verificar usuário PDV:', error);
      }
    };

    verificarUsuarioPDV();
  }, []);

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

    if (!pdvUserReady) {
      toast({
        title: 'Sistema não pronto',
        description: 'Aguarde a verificação do sistema PDV',
        variant: 'destructive'
      });
      return null;
    }

    setFinalizando(true);
    try {
      const valorTotal = calcularTotal();

      console.log('🎯 Finalizando pedido PDV com user_id:', PDV_USER_ID);

      // Criar o pedido com o ID do usuário PDV
      const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert({
          bar_id: barId,
          user_id: PDV_USER_ID, // Usar ID do usuário PDV em vez de null
          valor_total: valorTotal,
          status: 'pago' // Marca como pago imediatamente
        })
        .select()
        .single();

      if (pedidoError) {
        console.error('❌ Erro ao criar pedido:', pedidoError);
        throw pedidoError;
      }

      console.log('✅ Pedido criado com sucesso:', pedido.id);

      // Criar os itens do pedido
      const itensFormatados = carrinho.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.produto_id,
        nome_produto: item.nome,
        quantidade: item.quantidade,
        quantidade_restante: item.quantidade,
        preco_unitario: item.preco
      }));

      const { error: itensError } = await supabase
        .from('pedido_itens')
        .insert(itensFormatados);

      if (itensError) {
        console.error('❌ Erro ao criar itens do pedido:', itensError);
        throw itensError;
      }

      console.log('✅ Itens do pedido criados com sucesso');

      // Gerar código de retirada
      const codigoRetirada = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      const { error: codigoError } = await supabase
        .from('codigos_retirada')
        .insert({
          pedido_id: pedido.id,
          codigo: codigoRetirada,
          itens: itensFormatados.map(item => ({
            produto_id: item.produto_id,
            nome_produto: item.nome_produto,
            quantidade: item.quantidade
          }))
        });

      if (codigoError) {
        console.error('❌ Erro ao criar código de retirada:', codigoError);
        throw codigoError;
      }

      console.log('✅ Código de retirada criado:', codigoRetirada);

      // Se há email do cliente, enviar código por email
      if (cliente.email) {
        try {
          await supabase.functions.invoke('send-pedido-code', {
            body: {
              email: cliente.email,
              codigo: codigoRetirada,
              pedidoId: pedido.id,
              valorTotal,
              itens: carrinho
            }
          });
          console.log('✅ Email enviado para:', cliente.email);
        } catch (emailError) {
          console.warn('⚠️ Erro ao enviar email:', emailError);
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
      console.error('❌ Erro ao finalizar pedido:', error);
      toast({
        title: 'Erro ao finalizar pedido',
        description: error.message,
        variant: 'destructive'
      });
      return null;
    } finally {
      setFinalizando(false);
    }
  }, [carrinho, barId, cliente, calcularTotal, limparCarrinho, pdvUserReady]);

  return {
    carrinho,
    cliente,
    metodoPagamento,
    observacoes,
    finalizando,
    pdvUserReady,
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
