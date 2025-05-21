
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

export default function PedidoConfirmado() {
  const { id: pedidoId } = useParams();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    const fetchPedido = async () => {
      if (!pedidoId) return;
      
      try {
        // Fetch order details
        const { data, error } = await supabase
          .from("pedidos")
          .select(`
            id,
            valor_total,
            status,
            data_pagamento,
            stripe_session_id,
            bar:bar_id (name, address)
          `)
          .eq("id", pedidoId)
          .single();

        if (error) throw error;
        setPedido(data);
        
        // If the order is not paid yet, verify payment status
        if (data && data.status !== "pago") {
          verifyPayment();
        }
      } catch (error: any) {
        toast({
          title: "Erro ao carregar pedido",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
    
    // Set up interval to check payment status every 5 seconds if not paid
    const intervalId = setInterval(() => {
      if (pedido && pedido.status !== "pago") {
        verifyPayment();
      } else {
        clearInterval(intervalId);
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [pedidoId, pedido?.status]);
  
  const verifyPayment = async () => {
    if (!pedidoId || verifying) return;
    
    try {
      setVerifying(true);
      
      const { data, error } = await supabase.functions.invoke("verify-payment", {
        body: { pedidoId }
      });
      
      if (error) throw error;
      
      if (data.status === "success") {
        setPedido(data.order);
        toast({
          title: "Pagamento confirmado",
          description: "Seu pagamento foi processado com sucesso!",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Error verifying payment:", error);
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-12 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Carregando pedido...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="container mx-auto py-12 max-w-md">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Pedido não encontrado</CardTitle>
            <CardDescription>O pedido solicitado não existe ou foi removido.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link to="/">
              <Button>Voltar para a página inicial</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card>
        <CardHeader className="text-center">
          {pedido.status === "pago" ? (
            <>
              <CheckCircle className="mx-auto text-green-500 h-16 w-16 mb-4" />
              <CardTitle>Pedido confirmado!</CardTitle>
              <CardDescription>Seu pagamento foi processado com sucesso.</CardDescription>
            </>
          ) : (
            <>
              <Clock className="mx-auto text-yellow-500 h-16 w-16 mb-4" />
              <CardTitle>Aguardando confirmação</CardTitle>
              <CardDescription>Estamos processando seu pagamento.</CardDescription>
              <div className="mt-4">
                <Button 
                  variant="outline" 
                  disabled={verifying} 
                  onClick={verifyPayment}
                  className="mt-2"
                >
                  {verifying ? "Verificando..." : "Verificar pagamento"}
                </Button>
              </div>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-t pt-4">
            <h3 className="font-medium text-lg">{pedido.bar.name}</h3>
            <p className="text-muted-foreground text-sm">{pedido.bar.address}</p>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Valor total:</span>
            <span className="font-semibold">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(pedido.valor_total)}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Status:</span>
            <span className={`font-semibold ${pedido.status === "pago" ? "text-green-600" : "text-yellow-600"}`}>
              {pedido.status === "pago" ? "Pago" : "Aguardando pagamento"}
            </span>
          </div>
          
          <div className="mt-6 pt-4 border-t text-center">
            <Link to="/meus-pedidos">
              <Button className="w-full">Ver meus pedidos</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
