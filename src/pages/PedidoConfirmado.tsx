
import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export default function PedidoConfirmado() {
  const { id: pedidoId } = useParams();
  const [pedido, setPedido] = useState<any>(null);
  const pedidoRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Parse URL query parameters for Mercado Pago response
  const searchParams = new URLSearchParams(location.search);
  const paymentId = searchParams.get("payment_id");
  const status = searchParams.get("status");
  const collectionStatus = searchParams.get("collection_status");
  const preferenceId = searchParams.get("preference_id");
  const externalReference = searchParams.get("external_reference");

  useEffect(() => {
    const fetchPedido = async () => {
      if (!pedidoId) return;

      try {
        console.log("Fetching pedido:", pedidoId);
        const { data, error } = await supabase
          .from("pedidos")
          .select(`
            id,
            valor_total,
            status,
            data_pagamento,
            stripe_session_id,
            mercadopago_preference_id,
            bar:bar_id (name, address)
          `)
          .eq("id", pedidoId)
          .single();

        if (error) throw error;

        console.log("Pedido fetched:", data);
        setPedido(data);
        pedidoRef.current = data;

        // Process URL parameters from Mercado Pago
        if (data && paymentId && (status === "approved" || collectionStatus === "approved")) {
          console.log("Payment approved via URL parameters. Updating pedido status...");
          await updatePedidoStatus(pedidoId);
          return;
        }

        // Handle pending payments from URL parameters
        if (data && paymentId && (status === "pending" || collectionStatus === "pending")) {
          console.log("Payment pending via URL parameters. Will verify status...");
          toast({
            title: "Pagamento pendente",
            description: "Seu pagamento está sendo processado. A página será atualizada automaticamente quando confirmado.",
            variant: "default",
          });
        }

        // Continue with regular verification
        if (data) {
          if (data.stripe_session_id) {
            await verifyStripePayment(data.stripe_session_id);
          } else if (data.mercadopago_preference_id) {
            await verifyMercadoPagoPayment(data.mercadopago_preference_id);
          }
        }
      } catch (error: any) {
        console.error("Error fetching pedido:", error);
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

    // More aggressive polling for payment status
    const intervalId = setInterval(async () => {
      const currentPedido = pedidoRef.current;

      if (currentPedido && currentPedido.status !== "pago") {
        console.log("Polling payment status...");
        if (currentPedido.stripe_session_id) {
          const checkPaid = await verifyStripePayment(currentPedido.stripe_session_id);
          if (checkPaid) {
            clearInterval(intervalId);
          }
        } else if (currentPedido.mercadopago_preference_id || preferenceId) {
          // Use either stored preference ID or the one from URL
          const prefId = currentPedido.mercadopago_preference_id || preferenceId;
          const checkPaid = await verifyMercadoPagoPayment(prefId);
          if (checkPaid) {
            clearInterval(intervalId);
          }
        }
      } else if (currentPedido?.status === "pago") {
        clearInterval(intervalId);
      }
    }, 3000); // Check every 3 seconds

    return () => clearInterval(intervalId);
  }, [pedidoId, paymentId, status, collectionStatus, preferenceId, externalReference]);

  // Atualiza a ref sempre que o estado do pedido muda
  useEffect(() => {
    pedidoRef.current = pedido;
  }, [pedido]);

  // New function to directly update pedido status based on URL parameters
  const updatePedidoStatus = async (pedidoId: string) => {
    try {
      console.log("Updating pedido status directly from URL parameters");
      setVerifying(true);
      
      // Update pedido status directly in database
      const { data, error } = await supabase
        .from("pedidos")
        .update({
          status: "pago",
          data_pagamento: new Date().toISOString(),
        })
        .eq("id", pedidoId)
        .select();
      
      if (error) {
        console.error("Error updating pedido status:", error);
        throw error;
      }
      
      console.log("Successfully updated pedido status:", data);
      
      // Refresh pedido data
      const { data: refreshedPedido, error: refreshError } = await supabase
        .from("pedidos")
        .select(`
          id,
          valor_total,
          status,
          data_pagamento,
          stripe_session_id,
          mercadopago_preference_id,
          bar:bar_id (name, address)
        `)
        .eq("id", pedidoId)
        .single();
        
      if (!refreshError && refreshedPedido) {
        setPedido(refreshedPedido);
        pedidoRef.current = refreshedPedido;
        
        toast({
          title: "Pagamento confirmado",
          description: "Seu pagamento foi processado com sucesso!",
          variant: "default",
        });
        
        return true;
      }
      
      return false;
    } catch (error: any) {
      console.error("Error in updatePedidoStatus:", error);
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const verifyStripePayment = async (sessionId: string) => {
    if (verifying) return false;

    try {
      setVerifying(true);
      console.log("Verificando pagamento Stripe:", sessionId);

      const { data, error } = await supabase.functions.invoke("verify-stripe-payment", {
        body: { 
          sessionId,
          pedidoId
         }
      });

      if (error) {
        console.error("Erro ao chamar verify-stripe-payment:", error);
        throw error;
      }

      console.log("Resultado da verificação Stripe:", data);

      if (data.paid) {
        const { data: updatedOrder, error: refreshError } = await supabase
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

        if (!refreshError && updatedOrder) {
          setPedido(updatedOrder);
          pedidoRef.current = updatedOrder;

          if (updatedOrder.status === "pago") {
            toast({
              title: "Pagamento confirmado",
              description: "Seu pagamento foi processado com sucesso!",
              variant: "default",
            });

            return true;
          }
        }
      }

      return false;
    } catch (error: any) {
      console.error("Erro ao verificar pagamento Stripe:", error);
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const verifyMercadoPagoPayment = async (preferenceId: string) => {
    if (verifying) return false;

    try {
      setVerifying(true);
      console.log("Verificando pagamento Mercado Pago:", preferenceId);

      const { data, error } = await supabase.functions.invoke("verify-mercadopago-payment", {
        body: { 
          preferenceId,
          pedidoId
         }
      });

      if (error) {
        console.error("Erro ao chamar verify-mercadopago-payment:", error);
        throw error;
      }

      console.log("Resultado da verificação Mercado Pago:", data);

      if (data.paid) {
        const { data: updatedOrder, error: refreshError } = await supabase
          .from("pedidos")
          .select(`
            id,
            valor_total,
            status,
            data_pagamento,
            mercadopago_preference_id,
            bar:bar_id (name, address)
          `)
          .eq("id", pedidoId)
          .single();

        if (!refreshError && updatedOrder) {
          setPedido(updatedOrder);
          pedidoRef.current = updatedOrder;

          if (updatedOrder.status === "pago") {
            toast({
              title: "Pagamento confirmado",
              description: "Seu pagamento foi processado com sucesso!",
              variant: "default",
            });

            return true;
          }
        }
      }

      return false;
    } catch (error: any) {
      console.error("Erro ao verificar pagamento Mercado Pago:", error);
      return false;
    } finally {
      setVerifying(false);
    }
  };

  const handleVerifyPaymentClick = () => {
    const currentPedido = pedidoRef.current;
    if (!currentPedido) return;

    if (currentPedido.stripe_session_id) {
      verifyStripePayment(currentPedido.stripe_session_id);
    } else if (currentPedido.mercadopago_preference_id) {
      verifyMercadoPagoPayment(currentPedido.mercadopago_preference_id);
    } else if (preferenceId) {
      // Use preference ID from URL if available
      verifyMercadoPagoPayment(preferenceId);
    } else {
      toast({
        title: "Informações de pagamento não encontradas",
        description: "Não foi possível verificar o status do pagamento",
        variant: "destructive",
      });
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
}
