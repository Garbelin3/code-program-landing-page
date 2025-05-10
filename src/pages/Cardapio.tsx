
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

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

const Cardapio = () => {
  const { barId } = useParams<{ barId: string }>();
  const [bar, setBar] = useState<Bar | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [categorias, setCategorias] = useState<string[]>([]);
  
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
        const categoriasUnicas = [...new Set(produtosData?.map(p => p.categoria) || [])];
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
  
  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <Button 
          variant="outline" 
          className="mb-6"
          asChild
        >
          <Link to="/dashboard" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        
        <Card className="mb-8">
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-2xl text-purple-900">{bar.name}</CardTitle>
            <CardDescription className="text-purple-700">
              {bar.address}
              {bar.phone && ` | ${bar.phone}`}
            </CardDescription>
          </CardHeader>
        </Card>
        
        {produtos.length > 0 ? (
          <div className="space-y-8">
            {categorias.map(categoria => (
              <div key={categoria}>
                <h2 className="text-xl font-bold mb-4 text-purple-800 border-b pb-2">{categoria}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {produtos
                    .filter(produto => produto.categoria === categoria)
                    .map(produto => (
                      <Card key={produto.id} className="h-full">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-lg">{produto.nome}</h3>
                              {produto.descricao && (
                                <p className="text-gray-600 text-sm mt-1">{produto.descricao}</p>
                              )}
                            </div>
                            <div className="text-purple-700 font-bold">
                              {formatarPreco(produto.preco)}
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
            <p className="text-lg text-gray-600">Este bar ainda não possui produtos no cardápio.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cardapio;
