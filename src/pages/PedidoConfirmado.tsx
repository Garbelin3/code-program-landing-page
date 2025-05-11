
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { useAuth } from "@/hooks/useAuth";

interface PedidoConfirmado {
  id: string;
  bar: {
    name: string;
    address: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: string;
  created_at: string;
}

interface PedidoResponse {
  id: string;
  bar: {
    name: string;
    address: string;
  };
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: string;
  created_at: string;
}

const PedidoConfirmado = () => {
  const { pedidoId } = useParams();
  const [loading, setLoading] = useState(true);
  const [pedido, setPedido] = useState<PedidoConfirmado | null>(null);
  const { user, signOut } = useAuth();
  
  useEffect(() => {
    const fetchPedido = async () => {
      try {
        const { data, error } = await supabase
          .from("pedidos")
          .select(`
            id,
            bar:bars(name, address),
            items:pedido_items(
              name,
              quantity,
              price
            ),
            total,
            status,
            created_at
          `)
          .eq("id", pedidoId)
          .single();

        if (error) throw error;
        
        if (data) {
          const pedidoData = data as PedidoResponse;
          setPedido({
            id: pedidoData.id,
            bar: {
              name: pedidoData.bar?.[0]?.name || "",
              address: pedidoData.bar?.[0]?.address || ""
            },
            items: pedidoData.items,
            total: pedidoData.total,
            status: pedidoData.status,
            created_at: pedidoData.created_at
          });
        }
      } catch (error) {
        console.error("Erro ao carregar pedido:", error);
        toast({
          title: "Erro ao carregar pedido",
          description: "Não foi possível carregar as informações do pedido.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
  }, [pedidoId]);
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
        <p className="text-lg text-gray-600">Carregando...</p>
      </div>
    );
  }
  
  if (!pedido) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center justify-center">
        <p className="text-lg text-red-500 mb-4">Pedido não encontrado</p>
        <Button asChild>
          <Link to="/dashboard">Voltar para o Dashboard</Link>
        </Button>
      </div>
    );
  }
  
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
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={signOut} />
      <div className="container mx-auto py-8 px-4 max-w-md">
        <Card className="mb-8">
          <CardHeader className="text-center bg-green-50">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-20 w-20 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">Pedido confirmado!</CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-gray-500 text-sm">Pedido realizado em</p>
                <p className="font-medium">{formatarData(pedido?.created_at || '')}</p>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm">Local</p>
                <p className="font-medium">{pedido?.bar?.name}</p>
                <p className="text-sm text-gray-600">{pedido?.bar?.address}</p>
              </div>
              
              <div>
                <p className="text-gray-500 text-sm">Valor total</p>
                <p className="font-bold text-lg">{formatarPreco(pedido?.total || 0)}</p>
              </div>
              
              <div className="pt-4 flex flex-col gap-3">
                <Button asChild className="w-full">
                  <Link to="/meus-pedidos">
                    <ShoppingBag className="mr-2 h-4 w-4" /> Ver meus pedidos
                  </Link>
                </Button>
                
                <Button asChild variant="outline">
                  <Link to="/dashboard">Voltar ao início</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PedidoConfirmado;
