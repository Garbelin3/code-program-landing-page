import { useEffect, useRef, useState } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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
