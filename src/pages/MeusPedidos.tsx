import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, QrCode, Clipboard, ShoppingBag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface PedidoItem {
  id: string;
  nome_produto: string;
  quantidade: number;
  quantidade_restante: number;
  preco_unitario: number;
}

interface Pedido {
  id: string;
  created_at: string;
  valor_total: number;
  bar: {
    id: string;
    name: string;
    address: string;
  };
  itens: PedidoItem[];
}

const MeusPedidos = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, number>>({});
  const [retirarSheetOpen, setRetirarSheetOpen] = useState(false);
  const [codigoRetirada, setCodigoRetirada] = useState("");
  const [qrVisible, setQrVisible] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        toast({
          title: "Login necessário",
          description: "Você precisa estar logado para ver seus pedidos",
          variant: "destructive"
        });
        navigate('/login');
      }
    };
    
    getUser();
  }, [navigate]);
  
  useEffect(() => {
    const fetchPedidos = async () => {
      if (!user) return;
      
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
    const initialSelections: Record<string, number> = {};
    
    pedido.itens.forEach(item => {
      if (item.quantidade_restante > 0) {
        initialSelections[item.id] = 1; // Iniciar com uma unidade selecionada
      }
    });
    
    setItensSelecionados(initialSelections);
    setRetirarSheetOpen(true);
  };
  
  const handleQuantidadeChange = (itemId: string, value: string) => {
    const quantidade = parseInt(value);
    
    setItensSelecionados(prev => ({
      ...prev,
      [itemId]: quantidade
    }));
  };
  
  const gerarCodigoRetirada = () => {
    // Gerar código numérico de 6 dígitos
    const codigo = Math.floor(100000 + Math.random() * 900000).toString();
    setCodigoRetirada(codigo);
  };
  
  const confirmarRetirada = async () => {
    if (!selectedPedido) return;
    
    try {
      const itensParaAtualizar = Object.entries(itensSelecionados).map(([itemId, quantidade]) => {
        const item = selectedPedido.itens.find(i => i.id === itemId);
        if (!item) return null;
        
        return {
          id: itemId,
          quantidade_restante: item.quantidade_restante - quantidade
        };
      }).filter(Boolean) as { id: string; quantidade_restante: number }[];
      
      // Atualizar quantidades restantes
      for (const item of itensParaAtualizar) {
        const { error } = await supabaseExtended
          .from("pedido_itens")
          .update({ quantidade_restante: item.quantidade_restante })
          .eq("id", item.id);
        
        if (error) throw error;
      }
      
      // Gerar código de retirada
      gerarCodigoRetirada();
      setQrVisible(true);
      
      // Atualizar a lista de pedidos
      setPedidos(prevPedidos => {
        return prevPedidos.map(pedido => {
          if (pedido.id === selectedPedido.id) {
            return {
              ...pedido,
              itens: pedido.itens.map(item => {
                const quantidadeRetirada = itensSelecionados[item.id] || 0;
                return {
                  ...item,
                  quantidade_restante: item.quantidade_restante - quantidadeRetirada
                };
              })
            };
          }
          return pedido;
        });
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao processar retirada",
        description: error.message,
        variant: "destructive"
      });
      console.error("Error processing withdrawal:", error);
    }
  };
  
  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoRetirada);
    toast({
      title: "Código copiado",
      description: "O código de retirada foi copiado para a área de transferência."
    });
  };
  
  const fecharSheet = () => {
    setRetirarSheetOpen(false);
    setQrVisible(false);
    setCodigoRetirada("");
    setSelectedPedido(null);
    setItensSelecionados({});
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
        <p className="text-lg text-gray-600">Carregando pedidos...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            asChild
          >
            <Link to="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
          
          <h1 className="text-2xl font-bold">Meus Pedidos</h1>
        </div>
        
        {pedidos.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow">
            <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-lg text-gray-600 mb-4">Você ainda não fez nenhum pedido.</p>
            <Button asChild>
              <Link to="/dashboard">Encontrar bares</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {pedidos.map((pedido) => {
              // Verificar se há itens disponíveis para retirada
              const temItensDisponiveis = pedido.itens.some(item => item.quantidade_restante > 0);
              
              return (
                <Card key={pedido.id} className="overflow-hidden">
                  <CardHeader className="bg-purple-50">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{formatarData(pedido.created_at)}</CardTitle>
                        <CardDescription className="text-purple-700">
                          {pedido.bar.name}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatarPreco(pedido.valor_total)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-6">
                    <h3 className="font-semibold text-lg mb-3">Itens do pedido</h3>
                    
                    <div className="space-y-3">
                      {pedido.itens.map((item) => (
                        <div key={item.id} className="flex justify-between items-center">
                          <div>
                            <p>{item.nome_produto}</p>
                            <p className="text-sm text-gray-500">
                              Quantidade: {item.quantidade} | Disponível: {item.quantidade_restante}
                            </p>
                          </div>
                          <p className="font-medium">{formatarPreco(item.preco_unitario * item.quantidade)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      disabled={!temItensDisponiveis} 
                      className="w-full"
                      onClick={() => iniciarRetirada(pedido)}
                    >
                      {temItensDisponiveis ? "Retirar pedido" : "Todos os itens retirados"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Sheet para retirada de pedidos */}
      <Sheet open={retirarSheetOpen} onOpenChange={setRetirarSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Retirar pedido</SheetTitle>
            <SheetDescription>
              Selecione os itens e a quantidade que deseja retirar agora.
            </SheetDescription>
          </SheetHeader>
          
          {!qrVisible ? (
            <>
              <div className="py-4">
                {selectedPedido?.itens
                  .filter(item => item.quantidade_restante > 0)
                  .map((item) => (
                    <div key={item.id} className="py-4 border-b">
                      <div className="flex justify-between mb-2">
                        <p className="font-medium">{item.nome_produto}</p>
                        <p className="text-sm text-gray-500">Disponível: {item.quantidade_restante}</p>
                      </div>
                      
                      <Select 
                        value={itensSelecionados[item.id]?.toString() || "1"}
                        onValueChange={(value) => handleQuantidadeChange(item.id, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Quantidade" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: item.quantidade_restante }, (_, i) => i + 1).map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
              </div>
              
              <SheetFooter className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={confirmarRetirada}
                  disabled={Object.keys(itensSelecionados).length === 0}
                >
                  Gerar código de retirada
                </Button>
              </SheetFooter>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <QrCode className="h-32 w-32 text-purple-700 mx-auto" />
              </div>
              
              <div className="text-center mb-6">
                <p className="text-gray-500 mb-1">Código de retirada</p>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-2xl font-bold tracking-wider">{codigoRetirada}</p>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8" 
                    onClick={copiarCodigo}
                  >
                    <Clipboard className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <p className="text-center text-sm text-gray-500 mb-8">
                Apresente este código ao atendente para retirar seus itens.
              </p>
              
              <Button 
                variant="outline" 
                onClick={fecharSheet}
              >
                Concluir
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MeusPedidos;
