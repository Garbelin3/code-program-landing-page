import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, ArrowLeft, Trash, CreditCard } from "lucide-react";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface Bar {
  id: string;
  name: string;
  address: string;
  phone: string | null;
}

interface CartItem {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string;
  quantidade: number;
}

interface Cart {
  [barId: string]: CartItem[];
}

const Checkout = () => {
  const { barId } = useParams<{ barId: string }>();
  const navigate = useNavigate();
  const [bar, setBar] = useState<Bar | null>(null);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [cart, setCart] = useLocalStorage<Cart>("cart", {});
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      } else {
        toast({
          title: "Login necessário",
          description: "Você precisa estar logado para finalizar o pedido",
          variant: "destructive"
        });
        navigate('/login');
      }
    };
    
    getUser();
  }, [navigate]);

  useEffect(() => {
    const fetchBar = async () => {
      if (!barId) return;
      
      setLoading(true);
      try {
        const { data: barData, error: barError } = await supabase
          .from("bars")
          .select("id, name, address, phone")
          .eq("id", barId)
          .single();
        
        if (barError) throw barError;
        setBar(barData);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar informações do bar",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBar();
  }, [barId]);

  const carrinhoItens = cart[barId as string] || [];

  const getCarrinhoValorTotal = () => {
    return carrinhoItens.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  };

  const removerItem = (id: string) => {
    setCart((prevCart) => {
      const updatedBarCart = prevCart[barId as string].filter(item => item.id !== id);
      
      if (updatedBarCart.length === 0) {
        const { [barId as string]: _, ...restCart } = prevCart;
        return restCart;
      }
      
      return { ...prevCart, [barId as string]: updatedBarCart };
    });
  };

  const processarPedido = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para finalizar o pedido",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }
    
    setProcessando(true);
    
    try {
      // Salvar o pedido no banco de dados SEM status inicial (deixar NULL)
      const { data: pedido, error: pedidoError } = await supabaseExtended
        .from("pedidos")
        .insert({
          user_id: user.id,
          bar_id: barId,
          valor_total: getCarrinhoValorTotal()
          // Removido: status: 'pendente' - deixar NULL por padrão
        })
        .select()
        .single();
        
      if (pedidoError) throw pedidoError;
      
      // Salvar os itens do pedido
      const itensPedido = carrinhoItens.map(item => ({
        pedido_id: pedido.id,
        produto_id: item.id,
        quantidade: item.quantidade,
        quantidade_restante: item.quantidade,
        preco_unitario: item.preco,
        nome_produto: item.nome
      }));
      
      const { error: itensError } = await supabaseExtended
        .from("pedido_itens")
        .insert(itensPedido);
        
      if (itensError) throw itensError;
      
      // Redirecionar para o pagamento com Mercado Pago
      const { data: mpData, error: mpError } = await supabase.functions.invoke(
        "create-mercadopago-payment",
        {
          body: {
            pedidoId: pedido.id,
            barId: barId,
            valorTotal: getCarrinhoValorTotal(),
            items: carrinhoItens
          }
        }
      );

      if (mpError) {
        throw mpError;
      }

      if (mpData.url) {
        // Limpar o carrinho após a criação do pedido
        setCart((prevCart) => {
          const { [barId as string]: _, ...restCart } = prevCart;
          return restCart;
        });
        
        // Redirecionar para a página de pagamento do Mercado Pago
        window.location.href = mpData.url;
      } else {
        throw new Error("Não foi possível criar a preferência de pagamento");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao processar o pedido",
        description: error.message,
        variant: "destructive"
      });
      console.error("Error processing order:", error);
      setProcessando(false);
    }
  };
  
  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
        <p className="text-lg text-gray-600">Carregando...</p>
      </div>
    );
  }
  
  if (carrinhoItens.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600 mb-4">Seu carrinho está vazio</p>
        <Button asChild>
          <Link to={`/cardapio/${barId}`}>Voltar ao Cardápio</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <Button 
          variant="outline" 
          className="mb-6"
          asChild
        >
          <Link to={`/cardapio/${barId}`} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar ao Cardápio
          </Link>
        </Button>
        
        <Card className="mb-8">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" /> Finalize seu pedido
            </CardTitle>
            {bar && (
              <CardDescription className="text-purple-700">
                {bar.name} | {bar.address}
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold mb-4">Itens do pedido</h2>
            
            <div className="space-y-4">
              {carrinhoItens.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <h3 className="font-semibold">{item.nome}</h3>
                    <p className="text-sm text-gray-500">{item.quantidade} x {formatarPreco(item.preco)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="font-bold">{formatarPreco(item.preco * item.quantidade)}</p>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-red-500"
                      onClick={() => removerItem(item.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-between items-center font-bold text-lg">
              <span>Total a pagar:</span>
              <span>{formatarPreco(getCarrinhoValorTotal())}</span>
            </div>
          </CardContent>
          
          <CardFooter className="pt-4">
            <Button 
              className="w-full"
              onClick={processarPedido}
              disabled={processando}
            >
              {processando ? "Processando..." : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" /> Pagar com Mercado Pago
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Checkout;
