
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { formatarPreco, formatarData } from "@/utils/formatters";
import { Pedido } from "@/types/pedidos";

const PedidoDetalhes = () => {
  const { pedidoId } = useParams();
  const [loading, setLoading] = useState(true);
  const [pedido, setPedido] = useState<Pedido | null>(null);
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
        
        setPedido({
          id: pedidoData.id,
          created_at: pedidoData.created_at,
          valor_total: pedidoData.valor_total,
          bar: {
            id: barData.id,
            name: barData.name,
            address: barData.address
          },
          itens: itensData
        });
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
  }, [pedidoId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={signOut} />
        <div className="container mx-auto py-8 px-4">
          <p className="text-center text-gray-600">Carregando detalhes do pedido...</p>
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

  // Verifica se há itens disponíveis para retirada
  const temItensDisponiveis = pedido.itens.some(item => item.quantidade_restante > 0);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={signOut} />
      <div className="container mx-auto py-8 px-4 max-w-2xl">
        <div className="mb-6 flex justify-between items-center">
          <Button variant="outline" asChild>
            <Link to="/meus-pedidos" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
          
          {temItensDisponiveis && (
            <Button asChild>
              <Link to={`/pedido/${pedido.id}/retirar`}>
                Retirar itens
              </Link>
            </Button>
          )}
        </div>
        
        <Card>
          <CardHeader className="bg-purple-50">
            <CardTitle className="text-xl">Detalhes do Pedido</CardTitle>
            <div className="flex justify-between items-start mt-2">
              <div>
                <p className="text-sm text-gray-600">Pedido realizado em</p>
                <p className="font-medium">{formatarData(pedido.created_at)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Valor total</p>
                <p className="font-bold text-xl">{formatarPreco(pedido.valor_total)}</p>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Estabelecimento</h3>
              <p className="font-medium">{pedido.bar.name}</p>
              <p className="text-gray-600">{pedido.bar.address}</p>
            </div>
            
            <h3 className="text-lg font-semibold mb-4">Itens do pedido</h3>
            <div className="space-y-4">
              {pedido.itens.map((item) => (
                <div key={item.id} className="flex justify-between p-3 border-b">
                  <div>
                    <p className="font-medium">{item.nome_produto}</p>
                    <p className="text-sm text-gray-600">
                      Quantidade: {item.quantidade}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatarPreco(item.preco_unitario * item.quantidade)}</p>
                    <p className="text-sm text-green-600">
                      Disponível: {item.quantidade_restante}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PedidoDetalhes;
