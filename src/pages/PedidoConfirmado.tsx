import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const PedidoConfirmado = () => {
  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card>
        <CardHeader className="text-center">
          <CheckCircle className="mx-auto text-green-500 h-16 w-16 mb-4" />
          <CardTitle>Pedido confirmado!</CardTitle>
          <CardDescription>Seu pagamento foi processado com sucesso.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Link to="/meus-pedidos">
            <Button className="w-full mt-4">Ver meus pedidos</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

export default PedidoConfirmado;
