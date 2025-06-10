import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  ShoppingBag, 
  Filter, 
  Plus, 
  Minus 
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface Bar {
  id: string;
  name: string;
  address: string;
  phone: string | null;
}

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string;
}

interface CartItem extends Produto {
  quantidade: number;
}

interface Cart {
  [barId: string]: CartItem[];
}

const Cardapio = () => {
  const { barId } = useParams<{ barId: string }>();
  const navigate = useNavigate();
  const [bar, setBar] = useState<Bar | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<string[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("Todos");
  const [cart, setCart] = useLocalStorage<Cart>("cart", {});
  const [produtosFiltrados, setProdutosFiltrados] = useState<Produto[]>([]);
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const fetchBarEProdutos = async () => {
      if (!barId) return;
      
      setLoading(true);
      try {
        // Buscar informações do bar
        const { data: barData, error: barError } = await supabase
          .from("bars")
          .select("id, name, address, phone")
          .eq("id", barId)
          .single();
        
        if (barError) throw barError;
        setBar(barData);
        
        // Buscar produtos do cardápio
        const { data: produtosData, error: produtosError } = await supabase
          .from("produtos")
          .select("*")
          .eq("bar_id", barId)
          .eq("ativo", true)
          .order("categoria")
          .order("nome");
        
        if (produtosError) throw produtosError;
        setProdutos(produtosData || []);
        
        // Extrair categorias únicas para organizar o cardápio
        const categoriasUnicas = ["Todos", ...new Set(produtosData?.map(p => p.categoria) || [])];
        setCategorias(categoriasUnicas);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar o cardápio",
          description: error.message,
          variant: "destructive"
        });
        console.error("Error fetching cardapio:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBarEProdutos();
  }, [barId]);
  
  useEffect(() => {
    if (categoriaSelecionada === "Todos") {
      setProdutosFiltrados(produtos);
    } else {
      setProdutosFiltrados(produtos.filter(p => p.categoria === categoriaSelecionada));
    }
  }, [categoriaSelecionada, produtos]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    getUser();
  }, []);

  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const getQuantidade = (produtoId: string) => {
    const barCart = cart[barId as string] || [];
    const item = barCart.find(item => item.id === produtoId);
    return item ? item.quantidade : 0;
  };

  const adicionarAoCarrinho = (produto: Produto) => {
    setCart(prevCart => {
      const barCart = prevCart[barId as string] || [];
      const existingItemIndex = barCart.findIndex(item => item.id === produto.id);

      let updatedBarCart;
      if (existingItemIndex >= 0) {
        updatedBarCart = [...barCart];
        updatedBarCart[existingItemIndex] = {
          ...updatedBarCart[existingItemIndex],
          quantidade: updatedBarCart[existingItemIndex].quantidade + 1
        };
      } else {
        updatedBarCart = [...barCart, { ...produto, quantidade: 1 }];
      }

      return { 
        ...prevCart, 
        [barId as string]: updatedBarCart 
      };
    });

    toast({
      title: "Produto adicionado",
      description: `${produto.nome} foi adicionado ao carrinho!`,
    });
  };

  const removerDoCarrinho = (produto: Produto) => {
    setCart(prevCart => {
      const barCart = prevCart[barId as string] || [];
      const existingItemIndex = barCart.findIndex(item => item.id === produto.id);

      if (existingItemIndex === -1) return prevCart;

      let updatedBarCart;
      if (barCart[existingItemIndex].quantidade > 1) {
        updatedBarCart = [...barCart];
        updatedBarCart[existingItemIndex] = {
          ...updatedBarCart[existingItemIndex],
          quantidade: updatedBarCart[existingItemIndex].quantidade - 1
        };
      } else {
        updatedBarCart = barCart.filter(item => item.id !== produto.id);
      }

      if (updatedBarCart.length === 0) {
        const { [barId as string]: _, ...restCart } = prevCart;
        return restCart;
      }

      return { 
        ...prevCart, 
        [barId as string]: updatedBarCart 
      };
    });
  };

  const getCarrinhoTotal = () => {
    const barCart = cart[barId as string] || [];
    return barCart.reduce((total, item) => total + item.quantidade, 0);
  };

  const getCarrinhoValorTotal = () => {
    const barCart = cart[barId as string] || [];
    return barCart.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  };

  const irParaCheckout = () => {
    navigate(`/checkout/${barId}`);
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
        <p className="text-lg text-gray-600">Carregando cardápio...</p>
      </div>
    );
  }
  
  if (!bar) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center">
        <p className="text-lg text-red-500 mb-4">Bar não encontrado</p>
        <Button asChild>
          <Link to="/">Voltar para a home</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 relative overflow-hidden">
      <Header user={user} loading={false} />
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-green-600/10 blur-3xl"></div>
      <div className="relative z-10 container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            asChild
          >
            <Link to="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" /> Categorias
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56">
              <div className="space-y-2">
                {categorias.map((categoria) => (
                  <Button
                    key={categoria}
                    variant={categoriaSelecionada === categoria ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setCategoriaSelecionada(categoria)}
                  >
                    {categoria}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <Card className="mb-8 shadow-none border-0 bg-green-50/40">
          <CardHeader className="bg-green-100/60 rounded-t-2xl">
            <CardTitle className="text-2xl text-green-900 font-bold">{bar.name}</CardTitle>
            <CardDescription className="text-green-800">
              {bar.address}
              {bar.phone && ` | ${bar.phone}`}
            </CardDescription>
          </CardHeader>
        </Card>
        
        {produtosFiltrados.length > 0 ? (
          <div className="space-y-8">
            {Array.from(new Set(produtosFiltrados.map(p => p.categoria))).map(categoria => (
              <div key={categoria}>
                <h2 className="text-xl font-bold mb-4 text-green-800 border-b pb-2">{categoria}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {produtosFiltrados
                    .filter(produto => produto.categoria === categoria)
                    .map(produto => (
                      <Card key={produto.id} className="h-full border border-green-100/80 shadow-md bg-white/80 hover:shadow-lg transition-all rounded-2xl">
                        <CardContent className="p-5">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold text-lg text-green-900">{produto.nome}</h3>
                              {produto.descricao && (
                                <p className="text-green-800/80 text-sm mt-1">{produto.descricao}</p>
                              )}
                            </div>
                            <div className="text-green-700 font-bold text-lg">
                              {formatarPreco(produto.preco)}
                            </div>
                          </div>
                          <div className="flex items-center justify-end">
                            <div className="flex items-center gap-3">
                              <Button
                                variant="outline"
                                size="icon"
                                disabled={getQuantidade(produto.id) === 0}
                                onClick={() => removerDoCarrinho(produto)}
                                className="border-green-200 text-green-700 hover:bg-green-50"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-6 text-center text-green-900 font-semibold">{getQuantidade(produto.id)}</span>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => adicionarAoCarrinho(produto)}
                                className="border-green-200 text-green-700 hover:bg-green-50"
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white rounded-lg shadow">
            <p className="text-lg text-gray-600">
              {categorias.length > 1 
                ? "Nenhum produto encontrado nesta categoria." 
                : "Este bar ainda não possui produtos no cardápio."}
            </p>
          </div>
        )}
      </div>

      {/* Botão flutuante do carrinho */}
      {getCarrinhoTotal() > 0 && (
        <div className="fixed bottom-6 right-6">
          <Button 
            className="h-14 px-4 rounded-full shadow-lg flex items-center gap-2"
            onClick={irParaCheckout}
          >
            <ShoppingBag className="h-5 w-5" /> 
            <span>Finalizar ({getCarrinhoTotal()})</span>
            <span className="ml-1">{formatarPreco(getCarrinhoValorTotal())}</span>
          </Button>
        </div>
      )}
    </div>
  );
};

export default Cardapio;
