import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Store, ChevronRight, ArrowLeft, ShoppingBag, QrCode } from "lucide-react";
import { formatarPreco } from "@/components/pedidos/verificar-retirada/utils";

interface Bar {
  id: string;
  name: string;
  address: string;
}

interface ProdutoDisponivel {
  id: string;
  nome_produto: string;
  quantidade_disponivel: number;
  preco_unitario: number;
}

interface BarProdutos {
  bar: Bar;
  produtos: ProdutoDisponivel[];
}

export const BarCardapioView = ({ 
  onGerarCodigo 
}: { 
  onGerarCodigo: (barId: string, itensSelecionados: Record<string, number>) => void 
}) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [bares, setBares] = useState<BarProdutos[]>([]);
  const [barSelecionado, setBarSelecionado] = useState<BarProdutos | null>(null);
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, number>>({});
  
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
    
    const fetchBaresProdutos = async () => {
      setLoading(true);
      try {
        // Buscar pedidos pagos do usuário
        const { data: pedidosData, error: pedidosError } = await supabaseExtended
          .from("pedidos")
          .select(`
            id, 
            bar_id,
            bar:bar_id (id, name, address)
          `)
          .eq("user_id", user.id)
          .eq("status", "pago");
        
        if (pedidosError) throw pedidosError;
        
        // Agrupar pedidos por bar
        const pedidosPorBar: Record<string, { bar: Bar, pedidoIds: string[] }> = {};
        
        pedidosData.forEach((pedido: any) => {
          if (!pedidosPorBar[pedido.bar_id]) {
            pedidosPorBar[pedido.bar_id] = {
              bar: {
                id: pedido.bar.id,
                name: pedido.bar.name,
                address: pedido.bar.address
              },
              pedidoIds: []
            };
          }
          
          pedidosPorBar[pedido.bar_id].pedidoIds.push(pedido.id);
        });
        
        // Para cada bar, buscar produtos disponíveis
        const baresProdutos: BarProdutos[] = [];
        
        for (const barId in pedidosPorBar) {
          const { bar, pedidoIds } = pedidosPorBar[barId];
          
          // Buscar itens com quantidade_restante > 0 para os pedidos deste bar
          const { data: itensData, error: itensError } = await supabaseExtended
            .from("pedido_itens")
            .select("*")
            .in("pedido_id", pedidoIds)
            .gt("quantidade_restante", 0);
          
          if (itensError) throw itensError;
          
          // Agrupar itens por nome_produto
          const produtosPorNome: Record<string, ProdutoDisponivel> = {};
          
          itensData.forEach((item: any) => {
            if (!produtosPorNome[item.nome_produto]) {
              produtosPorNome[item.nome_produto] = {
                id: item.id,
                nome_produto: item.nome_produto,
                quantidade_disponivel: 0,
                preco_unitario: item.preco_unitario
              };
            }
            
            produtosPorNome[item.nome_produto].quantidade_disponivel += item.quantidade_restante;
          });
          
          // Adicionar bar e seus produtos à lista
          if (Object.keys(produtosPorNome).length > 0) {
            baresProdutos.push({
              bar,
              produtos: Object.values(produtosPorNome)
            });
          }
        }
        
        setBares(baresProdutos);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar bares e produtos",
          description: error.message,
          variant: "destructive"
        });
        console.error("Error fetching bars and products:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBaresProdutos();
  }, [user]);
  
  const selecionarBar = (bar: BarProdutos) => {
    setBarSelecionado(bar);
    setItensSelecionados({});
  };
  
  const voltarParaBares = () => {
    setBarSelecionado(null);
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
  
  const confirmarSelecao = () => {
    if (!barSelecionado) return;
    
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
    onGerarCodigo(barSelecionado.bar.id, itensSelecionados);
    
    // Limpar seleção
    setBarSelecionado(null);
    setItensSelecionados({});
  };
  
  const getTotalItens = () => {
    return Object.values(itensSelecionados).reduce((total, quantidade) => total + quantidade, 0);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-500">Carregando bares e produtos disponíveis...</p>
      </div>
    );
  }
  
  if (bares.length === 0) {
    return (
      <div className="text-center py-12">
        <Store className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum item disponível para retirada</h3>
        <p className="text-sm text-gray-500 mt-2">
          Você não tem nenhum item disponível para retirada em nenhum bar.
        </p>
      </div>
    );
  }
  
  if (barSelecionado) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={voltarParaBares}
            className="flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          
          <h2 className="text-lg font-semibold">{barSelecionado.bar.name}</h2>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Selecione os itens para retirada</CardTitle>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {barSelecionado.produtos.map((produto) => (
                <div key={produto.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{produto.nome_produto}</p>
                    <p className="text-sm text-gray-500">
                      Disponível: {produto.quantidade_disponivel} | {formatarPreco(produto.preco_unitario)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => decrementarQuantidade(produto.nome_produto)}
                      disabled={!itensSelecionados[produto.nome_produto]}
                    >
                      -
                    </Button>
                    
                    <span className="w-8 text-center">
                      {itensSelecionados[produto.nome_produto] || 0}
                    </span>
                    
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => incrementarQuantidade(produto.nome_produto, produto.quantidade_disponivel)}
                      disabled={
                        (itensSelecionados[produto.nome_produto] || 0) >= produto.quantidade_disponivel
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
      <h2 className="text-lg font-semibold">Selecione um bar para retirar itens</h2>
      
      {bares.map((barProdutos) => (
        <Card 
          key={barProdutos.bar.id} 
          className="cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => selecionarBar(barProdutos)}
        >
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">{barProdutos.bar.name}</h3>
              <p className="text-sm text-gray-500">{barProdutos.bar.address}</p>
              <p className="text-sm mt-1">
                <span className="font-medium">{barProdutos.produtos.length}</span> produtos disponíveis
              </p>
            </div>
            
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
  