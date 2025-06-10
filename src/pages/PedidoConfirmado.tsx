
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

const PedidoConfirmado = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 via-transparent to-black/30"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto py-12 max-w-md flex items-center justify-center min-h-screen">
        <Card className="glass-card backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto text-green-400 h-16 w-16 mb-4 drop-shadow-lg" />
            <CardTitle className="text-white text-2xl font-bold">Pedido confirmado!</CardTitle>
            <CardDescription className="text-green-100/80 text-lg">
              Seu pagamento foi processado com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link to="/meus-pedidos">
              <Button className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl">
                Ver meus pedidos
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PedidoConfirmado;
