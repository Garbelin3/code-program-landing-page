
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { formatarPreco, formatarData } from "@/components/pedidos/verificar-retirada/utils";
import { toast } from "@/hooks/use-toast";
import { navegarPagamento } from "@/lib/navegarPagamento";
import { Pedido } from "@/types/pedidos";

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
        // Buscar pedidos pendentes (apenas status "pendente")
        const { data: pedidosData, error: pedidosError } = await supabaseExtended
          .from("pedidos")
          .select(`
            id, 
            created_at, 
            valor_total, 
            bar_id,
            bar:bar_id (id, name, address),
            stripe_session_id,
            status
          `)
          .eq("user_id", user.id)
          .eq("status", "pendente")
          .order("created_at", { ascending: false });
        
        if (pedidosError) throw pedidosError;
        
        // Buscar item de cada pedido
        const pedidosPendentesComItem = await Promise.all(
          (pedidosData || []).map(async (pedido: any) => {
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
              stripe_session_id: pedido.stripe_session_id,
              bar: {
                id: pedido.bar.id,
                name: pedido.bar.name,
                address: pedido.bar.address
              },
              itens: itensData || []
            };
          })
        );
        
        setPedidosPendentes(pedidosPendentesComItem);
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
      
      // Escutar mudanças na tabela de pedidos para atualizar a lista
      const pedidosChannel = supabase
        .channel('custom-all-channel')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'pedidos', filter: `user_id=eq.${user.id}` },
          () => {
            fetchPedidosPendentes();
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(pedidosChannel);
      };
    }
  }, [user]);
  
  const retomarPagamento = async (pedidoId: string) => {
    try {
      // Buscar o stripe_session_id do pedido
      const { data: pedidoData, error: pedidoError } = await supabaseExtended
        .from("pedidos")
        .select("stripe_session_id")
        .eq("id", pedidoId)
        .single();
      
      if (pedidoError) throw pedidoError;
      
      if (pedidoData && pedidoData.stripe_session_id) {
        // Redirecionar para a página de checkout do Stripe
        navegarPagamento(pedidoData.stripe_session_id);
      } else {
        // Se não tiver session_id, precisamos criar um novo
        const response = await fetch(`/api/create-stripe-payment?pedido_id=${pedidoId}`, {
          method: 'POST',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao processar pagamento");
        }
        
        const { session_url, session_id } = await response.json();
        
        // Atualizar o pedido com o novo session_id
        await supabaseExtended
          .from("pedidos")
          .update({ stripe_session_id: session_id })
          .eq("id", pedidoId);
        
        // Redirecionar para a nova sessão
        navegarPagamento(session_url);
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
