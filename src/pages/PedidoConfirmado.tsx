
import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PedidoConfirmado = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [pedido, setPedido] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get status from URL params for immediate feedback
  const urlParams = new URLSearchParams(location.search);
  const statusFromUrl = urlParams.get('status');

  const fetchPedido = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("pedidos")
        .select(`
          id,
          valor_total,
          status,
          data_pagamento,
          mercadopago_preference_id,
          bar:bar_id (name, address)
        `)
        .eq("id", id)
        .single();

      if (error) {
        console.error("Erro ao buscar pedido:", error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os dados do pedido.",
          variant: "destructive",
        });
        return;
      }

      setPedido(data);
      
      // If payment is confirmed, stop polling
      if (data.status === "pago") {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (error) {
      console.error("Erro inesperado:", error);
    } finally {
      setLoading(false);
    }
  };

  const verifyMercadoPagoPayment = async () => {
    if (!pedido?.mercadopago_preference_id) return false;

    try {
      const { data, error } = await supabase.functions.invoke(
        "verify-mercadopago-payment",
        {
          body: { preferenceId: pedido.mercadopago_preference_id }
        }
      );

      if (error) {
        console.error("Erro na verificação MercadoPago:", error);
        return false;
      }

      return data?.paid || false;
    } catch (error) {
      console.error("Erro ao verificar pagamento MercadoPago:", error);
      return false;
    }
  };

  const handleVerifyPaymentClick = async () => {
    setVerifying(true);
    
    try {
      const isPaid = await verifyMercadoPagoPayment();
      
      if (isPaid) {
        // Update pedido status locally
        setPedido(prev => ({ ...prev, status: "pago" }));
        toast({
          title: "Pagamento confirmado!",
          description: "Seu pedido foi processado com sucesso.",
        });
      } else {
        toast({
          title: "Pagamento ainda pendente",
          description: "O pagamento ainda não foi processado. Tente novamente em alguns minutos.",
        });
      }
    } catch (error) {
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar o status do pagamento.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    fetchPedido();

    // Set up polling for payment status updates
    intervalRef.current = setInterval(() => {
      fetchPedido();
    }, 5000); // Poll every 5 seconds

    // Clean up interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [id]);

  // Update status immediately if provided in URL
  useEffect(() => {
    if (statusFromUrl === 'success' && pedido) {
      setPedido(prev => ({ ...prev, status: "pago" }));
    }
  }, [statusFromUrl, pedido]);

  if (loading) {
    return (
      <div className="container mx-auto py-12 max-w-md flex justify-center">
        <p className="text-lg text-gray-600">Carregando pedido...</p>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="container mx-auto py-12 max-w-md text-center">
        <p className="text-lg text-gray-600 mb-4">Pedido não encontrado.</p>
        <Link to="/dashboard">
          <Button>Voltar ao início</Button>
        </Link>
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
                  onClick={handleVerifyPaymentClick}
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
};

export default PedidoConfirmado;
