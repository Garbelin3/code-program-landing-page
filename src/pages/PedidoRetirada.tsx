
import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { ArrowLeft, QrCode, Clipboard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { formatarPreco, formatarData } from "@/utils/formatters";
import { Pedido, ItemAgregado } from "@/types/pedidos";
import { ItemQuantidadeSelector } from "@/components/pedidos/ItemQuantidadeSelector";

const PedidoRetirada = () => {
  const { pedidoId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, number>>({});
  const [codigoRetirada, setCodigoRetirada] = useState("");
  const [retiradaConfirmada, setRetiradaConfirmada] = useState(false);
  const { user, signOut } = useAuth();
  
  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const { data: pedidoData, error: pedidoError } = await supabase
          .from("pedidos")
          .select("*, bar_id")
          .eq("id", pedidoId)
          .single();
          
        if (pedidoError) throw pedidoError;
        
        // Fetch bar details
        const { data: barData, error: barError } = await supabase
          .from("bars")
          .select("id, name, address")
          .eq("id", pedidoData.bar_id)
          .single();
          
        if (barError) throw barError;
        
        // Fetch pedido items
        const { data: itensData, error: itensError } = await supabase
          .from("pedido_itens")
          .select("*")
          .eq("pedido_id", pedidoId);
          
        if (itensError) throw itensError;
        
        // Filtrar apenas itens com quantidade_restante > 0
        const itensDisponiveis = itensData.filter(item => item.quantidade_restante > 0);
        
        // Se não houver itens disponíveis, redirecionar para a página de detalhes
        if (itensDisponiveis.length === 0) {
          navigate(`/pedido/${pedidoId}`);
          return;
        }
        
        const novoPedido = {
          id: pedidoData.id,
          created_at: pedidoData.created_at,
          valor_total: pedidoData.valor_total,
          bar: {
            id: barData.id,
            name: barData.name,
            address: barData.address
          },
          itens: itensData
        };
        
        setPedido(novoPedido);
        
        // Inicializar o objeto itensSelecionados com 0 para cada item disponível
        const initialSelections: Record<string, number> = {};
        itensDisponiveis.forEach(item => {
          initialSelections[item.id] = 0;
        });
        setItensSelecionados(initialSelections);
        
      } catch (error: any) {
        console.error("Erro ao carregar detalhes do pedido:", error);
        toast({
          title: "Erro ao carregar pedido",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (pedidoId) {
      fetchPedido();
    }
  }, [pedidoId, navigate]);

  const handleQuantidadeChange = (itemId: string, value: number) => {
    setItensSelecionados(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  const gerarCodigoRetirada = () => {
    // Gerar código numérico de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    setCodigoRetirada(codigo);
  };
  
  const confirmarRetirada = async () => {
    if (!pedido) return;
    
    // Verificar se pelo menos 1 item foi selecionado
    const totalItens = Object.values(itensSelecionados).reduce((a, b) => a + b, 0);
    if (totalItens === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Selecione pelo menos um item para retirar.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Para cada item selecionado, atualizar a quantidade_restante no banco de dados
      for (const [itemId, quantidade] of Object.entries(itensSelecionados)) {
        if (quantidade > 0) {
          const item = pedido.itens.find(i => i.id === itemId);
          if (!item) continue;
          
          const novaQuantidade = item.quantidade_restante - quantidade;
          
          // Atualizar no banco de dados
          const { error } = await supabase
            .from("pedido_itens")
            .update({ quantidade_restante: novaQuantidade })
            .eq("id", itemId);
          
          if (error) throw error;
          
          // Atualizar localmente
          item.quantidade_restante = novaQuantidade;
        }
      }
      
      // Gerar código de retirada
      gerarCodigoRetirada();
      setRetiradaConfirmada(true);
      
      toast({
        title: "Retirada confirmada",
        description: "Use o código gerado para retirar seus itens.",
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao processar retirada",
        description: error.message,
        variant: "destructive",
      });
      console.error("Erro ao processar retirada:", error);
    }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoRetirada);
    toast({
      title: "Código copiado",
      description: "O código de retirada foi copiado para a área de transferência."
    });
  };

  const concluirRetirada = () => {
    navigate("/meus-pedidos");
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={signOut} />
        <div className="container mx-auto py-8 px-4">
          <p className="text-center text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!pedido) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={signOut} />
        <div className="container mx-auto py-8 px-4">
          <p className="text-center text-red-500 mb-4">Pedido não encontrado</p>
          <div className="flex justify-center">
            <Button asChild>
              <Link to="/meus-pedidos">Voltar para Meus Pedidos</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Filtrar apenas itens com quantidade_restante > 0
  const itensDisponiveis = pedido.itens.filter(item => item.quantidade_restante > 0);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={signOut} />
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="mb-6 flex justify-between items-center">
          <Button variant="outline" asChild>
            <Link to={`/pedido/${pedido.id}`} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar para detalhes
            </Link>
          </Button>
        </div>
        
        {!retiradaConfirmada ? (
          <Card>
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-xl">Retirar itens</CardTitle>
              <p className="text-gray-600 mt-1">Selecione a quantidade de cada item que deseja retirar</p>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="space-y-4">
                {itensDisponiveis.map((item) => (
                  <div key={item.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between mb-2">
                      <div>
                        <p className="font-medium">{item.nome_produto}</p>
                        <p className="text-sm text-gray-600">
                          Disponível: {item.quantidade_restante}
                        </p>
                      </div>
                      <p className="font-medium">{formatarPreco(item.preco_unitario)}</p>
                    </div>
                    
                    <div className="mt-3">
                      <ItemQuantidadeSelector 
                        max={item.quantidade_restante}
                        value={itensSelecionados[item.id] || 0}
                        onChange={(value) => handleQuantidadeChange(item.id, value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-end">
              <Button 
                onClick={confirmarRetirada}
                disabled={Object.values(itensSelecionados).every(v => v === 0)}
              >
                Gerar código de retirada
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center bg-purple-50">
              <CardTitle className="text-xl">Código de retirada</CardTitle>
              <p className="text-gray-600 mt-1">Apresente este código ao atendente</p>
            </CardHeader>
            
            <CardContent className="py-8">
              <div className="flex flex-col items-center">
                <div className="bg-gray-100 p-6 rounded-lg mb-4">
                  <QrCode className="h-32 w-32 text-purple-700" />
                </div>
                
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <p className="text-3xl font-bold tracking-wider">{codigoRetirada}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={copiarCodigo}
                    >
                      <Clipboard className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-center">
              <Button onClick={concluirRetirada}>
                Concluir
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PedidoRetirada;
