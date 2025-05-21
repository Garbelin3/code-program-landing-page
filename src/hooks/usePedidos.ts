import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { toast } from "@/hooks/use-toast";
import { Pedido, PedidoItem, ItemAgregado, Bar } from "@/types/pedidos";
import { formatarPreco, formatarData } from "@/components/pedidos/verificar-retirada/utils";

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
        // Buscar pedidos que estejam pagos (apenas status "pago")
        const { data: pedidosData, error: pedidosError } = await supabaseExtended
          .from("pedidos")
          .select(`
            id, 
            created_at, 
            valor_total, 
            bar_id,
            bar:bar_id (id, name, address),
            status
          `)
          .eq("user_id", user.id)
          .eq("status", "pago") // Filtrando apenas pedidos pagos
          .order("created_at", { ascending: false });
        
        if (pedidosError) throw pedidosError;
        
        console.log("Dados dos pedidos:", pedidosData);
        
        // Buscar item de cada pedido
        const pedidosComItem = await Promise.all(
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
              bar: {
                id: pedido.bar.id,
                name: pedido.bar.name,
                address: pedido.bar.address
              },
              itens: itensData || []
            };
          })
        );
        
        setPedidos(pedidosComItem);
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
    agregarItemDeTodosPedidos();
    
    // Verificar se já existe um código de retirada não utilizado para este pedido
    // Esta função agora sempre verifica e recupera códigos não utilizados
    verificarCodigoExistente(pedido.id);
    
    // Resetar as seleções apenas se não houver código existente
    // As seleções serão preenchidas na função verificarCodigoExistente se houver código
    const initialSelections: Record<string, number> = {};
    setItensSelecionados(initialSelections);
    
    setRetirarSheetOpen(true);
  };
  
  // Função para verificar se já existe um código de retirada não utilizado
  const verificarCodigoExistente = async (pedidoId: string) => {
    try {
      // Buscar o código de retirada mais recente que não foi usado nem invalidado
      const { data, error } = await supabaseExtended
        .from("codigos_retirada")
        .select("*")
        .eq("pedido_id", pedidoId)
        .eq("usado", false)
        .eq("invalidado", false)
        .order("created_at", { ascending: false })
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        // Existe um código não utilizado, vamos usá-lo
        setCodigoRetirada(data.codigo);
        setQrVisible(true);
        
        // Preencher os itens selecionados com base no código existente
        if (data.itens && typeof data.itens === 'object') {
          setItensSelecionados(data.itens as Record<string, number>);
        }
        
        toast({
          title: "Código de retirada recuperado",
          description: "Você já possui um código de retirada ativo para este pedido.",
          variant: "default"
        });
        
        console.log("Código de retirada recuperado:", data.codigo);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Erro ao verificar código de retirada existente:", error);
      return false;
    }
  };
  
  // Função para agregar item iguais e calcular o total disponível de TODOS os pedidos
  const agregarItemDeTodosPedidos = () => {
    // Primeiro vamos coletar todos os item com quantidade_restante > 0 de TODOS os pedidos
const itensDisponiveis = pedidos
  .flatMap(p => p.itens)
  .filter(item => item.quantidade_restante > 0);
    
    // Agrupar por nome de produto
    const itensPorNome: Record<string, ItemAgregado> = {};
    
    itensDisponiveis.forEach(item => {
      if (!itensPorNome[item.nome_produto]) {
  itensPorNome[item.nome_produto] = {
    nome_produto: item.nome_produto,
    itens: [], // Alterado para "itens"
    total_disponivel: 0
  };
}

itensPorNome[item.nome_produto].itens.push(item);
      itensPorNome[item.nome_produto].total_disponivel += item.quantidade_restante;
    });
    
    // Converter o objeto em array
    const todosItemAgregados = Object.values(itensPorNome);
    setItensAgregados(todosItemAgregados);
  };
  
  const gerarCodigoRetirada = () => {
    // Gerar código numérico de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    setCodigoRetirada(codigo);
    return codigo;
  };
  
  // Modified function to update quantidade_restante when generating a code
  const gerarCodigoParaBar = async (barId: string, itensSelecionados: Record<string, number>) => {
    if (Object.keys(itensSelecionados).length === 0) return;
    
    try {
      // Buscar pedidos do usuário para este bar
      const { data: pedidosData, error: pedidosError } = await supabaseExtended
        .from("pedidos")
        .select("id")
        .eq("user_id", user.id)
        .eq("bar_id", barId)
        .eq("status", "pago");
      
      if (pedidosError) throw pedidosError;
      
      if (!pedidosData || pedidosData.length === 0) {
        toast({
          title: "Erro ao gerar código",
          description: "Não foi possível encontrar pedidos para este bar",
          variant: "destructive"
        });
        return;
      }
      
      // Obter todos os pedidos IDs para este bar do usuário
      const pedidosIds = pedidosData.map(p => p.id);
      
      // Buscar todos os itens disponíveis para estes pedidos
      const { data: itensDisponiveis, error: itensError } = await supabaseExtended
        .from("pedido_itens")
        .select("*")
        .in("pedido_id", pedidosIds)
        .gt("quantidade_restante", 0);
      
      if (itensError) throw itensError;
      
      if (!itensDisponiveis || itensDisponiveis.length === 0) {
        toast({
          title: "Erro ao gerar código",
          description: "Não há itens disponíveis para retirada",
          variant: "destructive"
        });
        return;
      }
      
      // Agrupar itens por nome de produto
      const itensPorNome: Record<string, PedidoItem[]> = {};
      itensDisponiveis.forEach(item => {
        if (!itensPorNome[item.nome_produto]) {
          itensPorNome[item.nome_produto] = [];
        }
        itensPorNome[item.nome_produto].push(item);
      });
      
      // Verificar se temos quantidade suficiente para cada item selecionado
      for (const [nomeProduto, quantidadeSolicitada] of Object.entries(itensSelecionados)) {
        const itensDisponivelProduto = itensPorNome[nomeProduto] || [];
        const quantidadeDisponivel = itensDisponivelProduto.reduce(
          (total, item) => total + item.quantidade_restante, 
          0
        );
        
        if (quantidadeSolicitada > quantidadeDisponivel) {
          toast({
            title: "Quantidade insuficiente",
            description: `Apenas ${quantidadeDisponivel} unidades de ${nomeProduto} disponíveis para retirada`,
            variant: "destructive"
          });
          return;
        }
      }
      
      // Verificar se já existe um código não utilizado para invalidá-lo
      const { data: existingCodes, error: codesError } = await supabaseExtended
        .from("codigos_retirada")
        .select("id")
        .in("pedido_id", pedidosIds)
        .eq("usado", false);
      
      if (codesError) throw codesError;
      
      // Se existir algum código não utilizado, vamos marcá-lo como inválido
      if (existingCodes && existingCodes.length > 0) {
        for (const codigo of existingCodes) {
          await supabaseExtended
            .from("codigos_retirada")
            .update({ invalidado: true })
            .eq("id", codigo.id);
        }
      }
      
      // Gerar código de retirada
      const codigo = gerarCodigoRetirada();
      
      // Usar o primeiro pedido como referência para o código
      const pedidoId = pedidosIds[0];
      
      // ATUALIZAÇÃO: Reduzir as quantidades disponíveis nos itens dos pedidos
      // Para cada produto selecionado, distribuir a quantidade entre os itens disponíveis
      const updatedItens: Record<string, PedidoItem[]> = { ...itensPorNome };
      
      for (const [nomeProduto, quantidadeSolicitada] of Object.entries(itensSelecionados)) {
        let quantidadeRestante = quantidadeSolicitada;
        const itensDoProduto = updatedItens[nomeProduto] || [];
        
        for (const item of itensDoProduto.sort((a, b) => a.id.localeCompare(b.id))) {
          if (quantidadeRestante <= 0) break;
          
          // Calcular quanto retirar deste item específico
          const quantidadeRetirada = Math.min(item.quantidade_restante, quantidadeRestante);
          const novaQuantidade = item.quantidade_restante - quantidadeRetirada;
          
          // Atualizar no banco de dados
          await supabaseExtended
            .from("pedido_itens")
            .update({ quantidade_restante: novaQuantidade })
            .eq("id", item.id);
          
          // Atualizar na cópia local
          item.quantidade_restante = novaQuantidade;
          
          // Reduzir a quantidade restante a ser distribuída
          quantidadeRestante -= quantidadeRetirada;
        }
      }
      
      // Salvar o código de retirada no banco de dados
      const { error: codigoError } = await supabaseExtended
        .from("codigos_retirada")
        .insert({
          codigo: codigo,
          pedido_id: pedidoId,
          itens: itensSelecionados,
          usado: false,
          invalidado: false
        });
      
      if (codigoError) throw codigoError;
      
      // Mostrar o código gerado
      setCodigoRetirada(codigo);
      setQrVisible(true);
      setRetirarSheetOpen(true);
      
      // Buscar o pedido completo para exibir na sheet
      const { data: pedidoCompleto, error: pedidoError } = await supabaseExtended
        .from("pedidos")
        .select(`
          id, 
          created_at, 
          valor_total, 
          bar_id,
          bar:bar_id (id, name, address),
          status
        `)
        .eq("id", pedidoId)
        .single();
      
      if (pedidoError) throw pedidoError;
      
      // Buscar itens do pedido
      const { data: itensData, error: itensError } = await supabaseExtended
        .from("pedido_itens")
        .select("*")
        .eq("pedido_id", pedidoId);
      
      if (itensError) throw itensError;
      
      // Definir o pedido selecionado
      setSelectedPedido({
        ...pedidoCompleto,
        itens: itensData || []
      });
      
      // Atualizar os itens agregados
      agregarItemDeTodosPedidos();
      
      // Atualizar a lista de pedidos para refletir as mudanças nas quantidades
      setPedidos(prevPedidos => {
        return prevPedidos.map(pedido => {
          if (pedidosIds.includes(pedido.id)) {
            // Atualizar os itens deste pedido
            const updatedPedidoItens = pedido.itens.map(item => {
              const updatedItensForProduto = updatedItens[item.nome_produto] || [];
              const updatedItem = updatedItensForProduto.find(i => i.id === item.id);
              if (updatedItem) {
                return { ...item, quantidade_restante: updatedItem.quantidade_restante };
              }
              return item;
            });
            
            return { ...pedido, itens: updatedPedidoItens };
          }
          return pedido;
        });
      });
      
      toast({
        title: "Código de retirada gerado",
        description: "Seu código de retirada foi gerado com sucesso!",
        variant: "default"
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao gerar código de retirada",
        description: error.message,
        variant: "destructive"
      });
      console.error("Error generating withdrawal code:", error);
    }
  };
  
  const confirmarRetirada = async () => {
    if (!selectedPedido || Object.keys(itensSelecionados).length === 0) return;
    
    try {
      // Verificar se já existe um código não utilizado para invalidá-lo
      const { data: existingCodes, error: codesError } = await supabaseExtended
        .from("codigos_retirada")
        .select("id")
        .eq("pedido_id", selectedPedido.id)
        .eq("usado", false);
      
      if (codesError) throw codesError;
      
      // Se existir algum código não utilizado, vamos marcá-lo como inválido
      if (existingCodes && existingCodes.length > 0) {
        for (const codigo of existingCodes) {
          await supabaseExtended
            .from("codigos_retirada")
            .update({ usado: true, invalidado: true })
            .eq("id", codigo.id);
        }
      }
      
      // Gerar código de retirada
      const codigo = gerarCodigoRetirada();
      
      // Para cada produto selecionado, precisamos distribuir a quantidade entre os item disponíveis
      for (const [nomeProduto, quantidadeTotal] of Object.entries(itensSelecionados)) {
        let quantidadeRestante = quantidadeTotal;
        
        // Encontrar todos os item desse produto
        const itemAgregado = itensAgregados.find(i => i.nome_produto === nomeProduto);
        if (!itemAgregado) continue;

        for (const pedidoItem of itemAgregado.itens.sort((a, b) => a.id.localeCompare(b.id))) {
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
      
      console.log("Salvando código de retirada:", codigo, "com item:", itensSelecionados);
      
      // Salvar o código de retirada no banco de dados
      const { error: codigoError } = await supabaseExtended
        .from("codigos_retirada")
        .insert({
          codigo: codigo,
          pedido_id: selectedPedido.id,
          itens: itensSelecionados,
          usado: false,
          invalidado: false
          // Removida referência a data_geracao, usando created_at automático do Supabase
        });
      
      if (codigoError) throw codigoError;
      
      console.log("Código de retirada salvo com sucesso");
      
      // Atualizar os pedidos no estado
      setPedidos(prevPedidos => {
        return prevPedidos.map(pedido => {
          // Encontrar os item atualizados que pertencem a este pedido
          const updatedItens = pedido.itens.map(item => {
            const agregado = itensAgregados.find(a => a.nome_produto === item.nome_produto);
            if (!agregado) return item;
            
            const updatedItem = agregado.itens.find(i => i.id === item.id);
            if (updatedItem) {
              return { ...item, quantidade_restante: updatedItem.quantidade_restante };
            }
            return item;
          });
          
          return {
            ...pedido,
            itens: updatedItens
          };
        });
      });
      
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
    // Não limpar o código de retirada ao fechar o sheet
    // para garantir que ele permaneça disponível na próxima vez
    setRetirarSheetOpen(false);
    setQrVisible(false);
    
    // Manter o código e os itens selecionados em memória
    // setCodigoRetirada("");
    
    setSelectedPedido(null);
    setItensAgregados([]);
    
    // Não limpar os itens selecionados para manter a seleção
    // setItensSelecionados({});
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
    setItensSelecionados,
    gerarCodigoParaBar
  };
};
