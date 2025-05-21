
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { toast } from "@/hooks/use-toast";
import { Pedido } from "@/types/pedidos";
import { formatarPreco, formatarData } from "@/components/pedidos/verificar-retirada/utils";

export const usePedidosPendentes = () => {
  const [pedidosPendentes, setPedidosPendentes] = useState<Pedido[]>([]);
  const [loadingPendentes, setLoadingPendentes] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    
    getUser();
  }, []);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchPedidosPendentes = async () => {
      setLoadingPendentes(true);
      try {
        // Buscar pedidos com status "aguardando_pagamento"
        const { data: pedidosData, error: pedidosError } = await supabaseExtended
          .from("pedidos")
          .select(`
            id, 
            created_at, 
            valor_total, 
            bar_id,
            bar:bar_id (id, name, address),
            status,
            data_criacao
          `)
          .eq("user_id", user.id)
          .eq("status", "aguardando_pagamento")
          .order("created_at", { ascending: false });
        
        if (pedidosError) throw pedidosError;
        
        // Filtrar pedidos que não expiram (criados há mais de 30 minutos)
        const agora = new Date();
        const pedidosValidos = (pedidosData || []).filter(pedido => {
          if (!pedido.data_criacao) return true;
          
          const dataCriacao = new Date(pedido.data_criacao);
          const diferencaMinutos = (agora.getTime() - dataCriacao.getTime()) / (1000 * 60);
          return diferencaMinutos <= 30; // Menos de 30 minutos
        });
        
        // Buscar itens de cada pedido
        const pedidosComItens = await Promise.all(
          pedidosValidos.map(async (pedido) => {
            const { data: itensData, error: itensError } = await supabaseExtended
              .from("pedido_itens")
              .select("*")
              .eq("pedido_id", pedido.id);
            
            if (itensError) throw itensError;
            
            return {
              id: pedido.id,
              created_at: pedido.created_at,
              valor_total: pedido.valor_total,
              status: pedido.status,
              bar: {
                id: pedido.bar?.id || "",
                name: pedido.bar?.name || "",
                address: pedido.bar?.address || ""
              },
              itens: itensData || []
            };
          })
        );
        
        // Cancelar pedidos expirados (criados há mais de 30 minutos)
        for (const pedido of (pedidosData || [])) {
          if (!pedido.data_criacao) continue;
          
          const dataCriacao = new Date(pedido.data_criacao);
          const diferencaMinutos = (agora.getTime() - dataCriacao.getTime()) / (1000 * 60);
          
          if (diferencaMinutos > 30) {
            // Cancelar pedido expirado
            await supabaseExtended
              .from("pedidos")
              .update({ status: "cancelado" })
              .eq("id", pedido.id);
          }
        }
        
        setPedidosPendentes(pedidosComItens);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar pedidos pendentes",
          description: error.message,
          variant: "destructive"
        });
        console.error("Error fetching pending orders:", error);
      } finally {
        setLoadingPendentes(false);
      }
    };
    
    if (user) {
      fetchPedidosPendentes();
      
      // Configurar um intervalo para verificar pedidos pendentes periodicamente
      const interval = setInterval(fetchPedidosPendentes, 60000); // a cada minuto
      
      return () => clearInterval(interval);
    }
  }, [user]);

  const retomarPagamento = async (pedidoId: string) => {
    try {
      // Buscar dados do pedido
      const { data: pedido, error: pedidoError } = await supabaseExtended
        .from("pedidos")
        .select("*, bar:bar_id(*)")
        .eq("id", pedidoId)
        .single();
        
      if (pedidoError) throw pedidoError;
      
      // Verificar se o pedido ainda está aguardando pagamento
      if (pedido.status !== "aguardando_pagamento") {
        toast({
          title: "Pedido não disponível",
          description: "Este pedido não está mais disponível para pagamento",
          variant: "destructive"
        });
        return;
      }
      
      // Buscar itens do pedido
      const { data: itensData, error: itensError } = await supabaseExtended
        .from("pedido_itens")
        .select("*")
        .eq("pedido_id", pedidoId);
        
      if (itensError) throw itensError;
      
      const itens = itensData.map(item => ({
        id: item.produto_id,
        nome: item.nome_produto,
        preco: item.preco_unitario,
        quantidade: item.quantidade
      }));
      
      // Criar nova sessão de pagamento Stripe
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke(
        "create-stripe-payment",
        {
          body: {
            pedidoId: pedido.id,
            barId: pedido.bar_id,
            valorTotal: pedido.valor_total,
            items: itens
          }
        }
      );
      
      if (stripeError) throw stripeError;
      
      if (stripeData.url) {
        // Redirecionar para a página de pagamento do Stripe
        window.location.href = stripeData.url;
      } else {
        throw new Error("Não foi possível criar a sessão de pagamento");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao retomar pagamento",
        description: error.message,
        variant: "destructive"
      });
      console.error("Error resuming payment:", error);
    }
  };

  return {
    pedidosPendentes,
    loadingPendentes,
    formatarPreco,
    formatarData,
    retomarPagamento
  };
};
