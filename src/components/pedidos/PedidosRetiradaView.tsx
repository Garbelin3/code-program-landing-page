
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, QrCode, Clock } from "lucide-react";
import { formatarPreco, formatarData } from "@/components/pedidos/verificar-retirada/utils";
import { Pedido } from "@/types/pedidos";

interface PedidosRetiradaViewProps {
  onGerarCodigo: (barId: string, itensSelecionados: Record<string, number>) => void;
}

export const PedidosRetiradaView = ({ onGerarCodigo }: PedidosRetiradaViewProps) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, number>>({});
  const [debugInfo, setDebugInfo] = useState<string>("");
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        console.log("User authenticated:", session.user.id);
      } else {
        console.log("No authenticated user found");
      }
    };
    
    getUser();
  }, []);
  
  useEffect(() => {
    if (!user) return;
    
    const fetchPedidos = async () => {
      setLoading(true);
      setDebugInfo("");
      try {
        console.log("Fetching orders for user:", user.id);
        
        // Buscar pedidos pagos do usuário
        const { data: pedidosData, error: pedidosError } = await supabaseExtended
          .from("pedidos")
          .select(`
            id, 
            created_at, 
            valor_total,
            status, 
            bar_id,
            bar:bar_id (id, name, address)
          `)
          .eq("user_id", user.id)
          .eq("status", "pago")
          .order("created_at", { ascending: false });
        
        if (pedidosError) {
          setDebugInfo(`Error fetching orders: ${pedidosError.message}`);
          throw pedidosError;
        }
        
        console.log("Orders fetched:", pedidosData?.length || 0);
        setDebugInfo(prev => prev + `\nFound ${pedidosData?.length || 0} paid orders`);
        
        if (pedidosData && pedidosData.length > 0) {
          // Log the IDs of the fetched orders for debugging
          const orderIds = pedidosData.map(p => p.id);
          console.log("Order IDs found:", orderIds);
          
          // Check if the specific order ID is in the results
          const targetOrderId = "fcfa66f6-4e52-4478-a0e5-1796b0277b3c";
          const hasTargetOrder = orderIds.includes(targetOrderId);
          console.log(`Order ${targetOrderId} found:`, hasTargetOrder);
          setDebugInfo(prev => prev + `\nTargeted order found: ${hasTargetOrder}`);
        }
        
        // Buscar item de cada pedido
        const pedidosComItem = await Promise.all(
          (pedidosData || []).map(async (pedido: any) => {
            const { data: itensData, error: itensError } = await supabaseExtended
              .from("pedido_itens")
              .select("*")
              .eq("pedido_id", pedido.id);
            
            if (itensError) {
              setDebugInfo(prev => prev + `\nError fetching items for order ${pedido.id}: ${itensError.message}`);
              throw itensError;
            }
            
            console.log(`Order ${pedido.id} has ${itensData?.length || 0} items`);
            
            // Count items that are available for retrieval
            const availableItems = itensData?.filter(item => item.quantidade_restante > 0) || [];
            console.log(`Order ${pedido.id} has ${availableItems.length} items available for retrieval`);
            
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
        
        // Count how many orders have available items for retrieval
        const ordersWithAvailableItems = pedidosComItem.filter(pedido => 
          pedido.itens.some(item => item.quantidade_restante > 0)
        );
        console.log(`Total orders with available items: ${ordersWithAvailableItems.length}`);
        setDebugInfo(prev => prev + `\nOrders with available items: ${ordersWithAvailableItems.length}`);
        
        setPedidos(pedidosComItem);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar pedidos",
          description: error.message,
          variant: "destructive"
        });
        console.error("Error fetching orders:", error);
        setDebugInfo(prev => prev + `\nError: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchPedidos();
    }
  }, [user]);
  
  const selecionarPedido = (pedido: Pedido) => {
    setSelectedPedido(pedido);
    
    // Inicializar os itens selecionados com todos os itens disponíveis do pedido
    const itensSelecionadosInicial: Record<string, number> = {};
    
    pedido.itens.forEach(item => {
      if (item.quantidade_restante > 0) {
        itensSelecionadosInicial[item.nome_produto] = 
          (itensSelecionadosInicial[item.nome_produto] || 0) + item.quantidade_restante;
      }
    });
    
    setItensSelecionados(itensSelecionadosInicial);
  };
  
  const confirmarSelecao = () => {
    if (!selectedPedido) return;
    
    // Verificar se há itens selecionados
    if (Object.keys(itensSelecionados).length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para gerar o código de retirada",
        variant: "destructive"
      });
      return;
    }
    
    // Chamar função para gerar código
    onGerarCodigo(selectedPedido.bar.id, itensSelecionados);
    
    // Limpar seleção
    setSelectedPedido(null);
    setItensSelecionados({});
  };
  
  const cancelarSelecao = () => {
    setSelectedPedido(null);
    setItensSelecionados({});
  };
  
  const atualizarQuantidade = (nomeProduto: string, quantidade: number) => {
    if (quantidade <= 0) {
      const { [nomeProduto]: _, ...resto } = itensSelecionados;
      setItensSelecionados(resto);
    } else {
      setItensSelecionados(prev => ({
        ...prev,
        [nomeProduto]: quantidade
      }));
    }
  };
  
  const incrementarQuantidade = (nomeProduto: string, max: number) => {
    const atual = itensSelecionados[nomeProduto] || 0;
    if (atual < max) {
      atualizarQuantidade(nomeProduto, atual + 1);
    }
  };
  
  const decrementarQuantidade = (nomeProduto: string) => {
    const atual = itensSelecionados[nomeProduto] || 0;
    if (atual > 0) {
      atualizarQuantidade(nomeProduto, atual - 1);
    }
  };
  
  const getTotalItens = () => {
    return Object.values(itensSelecionados).reduce((total, quantidade) => total + quantidade, 0);
  };
  
  // Agrupar itens por nome de produto para o pedido selecionado
  const getItensAgrupados = () => {
    if (!selectedPedido) return [];
    
    const itemPorNome: Record<string, { nome: string, quantidade: number, disponivel: number }> = {};
    
    selectedPedido.itens.forEach(item => {
      if (item.quantidade_restante > 0) {
        if (!itemPorNome[item.nome_produto]) {
          itemPorNome[item.nome_produto] = {
            nome: item.nome_produto,
            quantidade: 0,
            disponivel: 0
          };
        }
        
        itemPorNome[item.nome_produto].disponivel += item.quantidade_restante;
      }
    });
    
    return Object.values(itemPorNome);
  };
  
  // Filtrar apenas pedidos com itens disponíveis para retirada
  const pedidosDisponiveis = pedidos.filter(pedido => 
    pedido.itens.some(item => item.quantidade_restante > 0)
  );
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-500">Carregando seus pedidos disponíveis para retirada...</p>
      </div>
    );
  }
  
  // Add debugging info display on the page when there are no orders
  if (pedidosDisponiveis.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum pedido disponível para retirada</h3>
        <p className="text-sm text-gray-500 mt-2">
          Você não tem nenhum pedido disponível para retirada no momento.
        </p>
        
        {/* Debug info - will be shown only when no orders are displayed */}
        {debugInfo && (
          <div className="mt-8 p-4 border border-gray-300 rounded-md bg-gray-50 text-left">
            <p className="font-semibold mb-2">Informações de depuração:</p>
            <pre className="whitespace-pre-wrap text-xs text-gray-600">
              {debugInfo}
            </pre>
          </div>
        )}
      </div>
    );
  }
  
  if (selectedPedido) {
    const itensAgrupados = getItensAgrupados();
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Selecionar itens para retirada</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={cancelarSelecao}
          >
            Voltar
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Pedido em {selectedPedido.bar.name}
            </CardTitle>
            <p className="text-sm text-gray-500">
              Feito em {formatarData(selectedPedido.created_at)}
            </p>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {itensAgrupados.map((item) => (
                <div key={item.nome} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-sm text-gray-500">
                      Disponível: {item.disponivel}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => decrementarQuantidade(item.nome)}
                      disabled={!itensSelecionados[item.nome]}
                    >
                      -
                    </Button>
                    
                    <span className="w-8 text-center">
                      {itensSelecionados[item.nome] || 0}
                    </span>
                    
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => incrementarQuantidade(item.nome, item.disponivel)}
                      disabled={
                        (itensSelecionados[item.nome] || 0) >= item.disponivel
                      }
                    >
                      +
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium">Total de itens:</span>
                <span className="font-bold">{getTotalItens()}</span>
              </div>
              
              <Button 
                className="w-full"
                onClick={confirmarSelecao}
                disabled={getTotalItens() === 0}
              >
                <QrCode className="mr-2 h-4 w-4" /> Gerar código de retirada
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Seus pedidos disponíveis para retirada</h2>
      
      <div className="space-y-4">
        {pedidosDisponiveis.map((pedido) => {
          // Calcular quantos itens estão disponíveis para retirada neste pedido
          const itensDisponiveis = pedido.itens.reduce((total, item) => 
            total + (item.quantidade_restante > 0 ? 1 : 0), 0
          );
          
          // Calcular o total de unidades disponíveis para retirada
          const unidadesDisponiveis = pedido.itens.reduce((total, item) => 
            total + item.quantidade_restante, 0
          );
          
          return (
            <Card 
              key={pedido.id} 
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => selecionarPedido(pedido)}
            >
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-lg">{pedido.bar.name}</h3>
                    <p className="text-sm text-gray-500 flex items-center">
                      <Clock className="h-3 w-3 mr-1" /> 
                      {formatarData(pedido.created_at)}
                    </p>
                    <p className="text-sm mt-2">
                      <span className="font-medium">{unidadesDisponiveis}</span> itens disponíveis para retirada
                    </p>
                    <p className="font-medium text-sm mt-1">
                      Total do pedido: {formatarPreco(pedido.valor_total)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      ID: {pedido.id}
                    </p>
                  </div>
                  
                  <Button className="mt-1">
                    <QrCode className="h-4 w-4 mr-2" /> Retirar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
