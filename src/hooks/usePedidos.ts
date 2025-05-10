
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { toast } from "@/hooks/use-toast";
import { Pedido, PedidoItem, ItemAgregado } from "@/types/pedidos";

export const usePedidos = () => {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, number>>({});
  const [retirarSheetOpen, setRetirarSheetOpen] = useState(false);
  const [codigoRetirada, setCodigoRetirada] = useState("");
  const [qrVisible, setQrVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [itensAgregados, setItensAgregados] = useState<ItemAgregado[]>([]);

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
    
    const fetchPedidos = async () => {
      setLoading(true);
      try {
        // Buscar pedidos
        const { data: pedidosData, error: pedidosError } = await supabaseExtended
          .from("pedidos")
          .select(`
            id, 
            created_at, 
            valor_total, 
            bar_id,
            bars:bar_id (id, name, address)
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        
        if (pedidosError) throw pedidosError;
        
        // Buscar itens de cada pedido
        const pedidosComItens = await Promise.all(
          (pedidosData || []).map(async (pedido) => {
            const { data: itensData, error: itensError } = await supabaseExtended
              .from("pedido_itens")
              .select("*")
              .eq("pedido_id", pedido.id);
            
            if (itensError) throw itensError;
            
            // Explicitly map the data to match our Pedido interface
            return {
              id: pedido.id,
              created_at: pedido.created_at,
              valor_total: pedido.valor_total,
              bar: {
                id: pedido.bars?.id || "",
                name: pedido.bars?.name || "",
                address: pedido.bars?.address || ""
              },
              itens: itensData || []
            };
          })
        );
        
        setPedidos(pedidosComItens);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar pedidos",
          description: error.message,
          variant: "destructive"
        });
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchPedidos();
    }
  }, [user]);

  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const iniciarRetirada = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    agregarItens(pedido);
    
    // Resetar as seleções 
    const initialSelections: Record<string, number> = {};
    setItensSelecionados(initialSelections);
    
    setRetirarSheetOpen(true);
  };
  
  // Função para agregar itens iguais e calcular o total disponível
  const agregarItens = (pedido: Pedido) => {
    // Primeiro vamos coletar todos os itens com quantidade_restante > 0
    const itensDisponiveis = pedidos
      .flatMap(p => p.itens)
      .filter(item => item.quantidade_restante > 0);
    
    // Agrupar por nome de produto
    const itensPorNome: Record<string, ItemAgregado> = {};
    
    itensDisponiveis.forEach(item => {
      if (!itensPorNome[item.nome_produto]) {
        itensPorNome[item.nome_produto] = {
          nome_produto: item.nome_produto,
          itens: [],
          total_disponivel: 0
        };
      }
      
      itensPorNome[item.nome_produto].itens.push(item);
      itensPorNome[item.nome_produto].total_disponivel += item.quantidade_restante;
    });
    
    // Converter o objeto em array
    const itensAgregados = Object.values(itensPorNome);
    
    // Filtrar apenas os itens relacionados ao pedido selecionado
    const itensDoPedido = itensAgregados.filter(agregado => 
      pedido.itens.some(item => 
        item.nome_produto === agregado.nome_produto && item.quantidade_restante > 0
      )
    );
    
    setItensAgregados(itensDoPedido);
  };
  
  const gerarCodigoRetirada = () => {
    // Gerar código numérico de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    setCodigoRetirada(codigo);
  };
  
  const confirmarRetirada = async () => {
    if (!selectedPedido || Object.keys(itensSelecionados).length === 0) return;
    
    try {
      // Para cada produto selecionado, precisamos distribuir a quantidade entre os itens disponíveis
      for (const [nomeProduto, quantidadeTotal] of Object.entries(itensSelecionados)) {
        let quantidadeRestante = quantidadeTotal;
        
        // Encontrar todos os itens desse produto
        const item = itensAgregados.find(i => i.nome_produto === nomeProduto);
        if (!item) continue;
        
        // Para cada item do mesmo produto, retirar a quantidade, começando pelos mais antigos
        for (const pedidoItem of item.itens.sort((a, b) => a.id.localeCompare(b.id))) {
          if (quantidadeRestante <= 0) break;
          
          // Calcular quanto retirar deste item específico
          const quantidadeRetirada = Math.min(pedidoItem.quantidade_restante, quantidadeRestante);
          const novaQuantidade = pedidoItem.quantidade_restante - quantidadeRetirada;
          
          // Atualizar no banco de dados
          const { error } = await supabaseExtended
            .from("pedido_itens")
            .update({ quantidade_restante: novaQuantidade })
            .eq("id", pedidoItem.id);
          
          if (error) throw error;
          
          // Atualizar localmente para refletir na interface
          pedidoItem.quantidade_restante = novaQuantidade;
          
          // Reduzir a quantidade restante a ser retirada
          quantidadeRestante -= quantidadeRetirada;
        }
      }
      
      // Atualizar os pedidos no estado
      setPedidos(prevPedidos => {
        return prevPedidos.map(pedido => {
          // Encontrar os itens atualizados que pertencem a este pedido
          const updatedItems = pedido.itens.map(item => {
            const agregado = itensAgregados.find(a => a.nome_produto === item.nome_produto);
            if (!agregado) return item;
            
            // Encontrar o item específico nos itens agregados
            const updatedItem = agregado.itens.find(i => i.id === item.id);
            if (updatedItem) {
              return { ...item, quantidade_restante: updatedItem.quantidade_restante };
            }
            return item;
          });
          
          return {
            ...pedido,
            itens: updatedItems
          };
        });
      });
      
      // Gerar código de retirada
      gerarCodigoRetirada();
      setQrVisible(true);
      
    } catch (error: any) {
      toast({
        title: "Erro ao processar retirada",
        description: error.message,
        variant: "destructive"
      });
      console.error("Error processing withdrawal:", error);
    }
  };

  const fecharSheet = () => {
    setRetirarSheetOpen(false);
    setQrVisible(false);
    setCodigoRetirada("");
    setSelectedPedido(null);
    setItensAgregados([]);
    setItensSelecionados({});
  };

  return {
    pedidos,
    loading,
    selectedPedido,
    itensSelecionados,
    retirarSheetOpen,
    codigoRetirada,
    qrVisible,
    itensAgregados,
    formatarPreco,
    formatarData,
    iniciarRetirada,
    confirmarRetirada,
    fecharSheet,
    setRetirarSheetOpen,
    setItensSelecionados
  };
};
