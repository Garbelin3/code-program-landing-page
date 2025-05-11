
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderManagement } from "@/components/pedidos/OrderManagement";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Package } from "lucide-react";

const GerenciarPedidos = () => {
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={signOut} />
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center mb-6">
          <Package className="mr-2 h-5 w-5" />
          <h1 className="text-2xl font-bold">Gerenciar Pedidos</h1>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Verificação de Pedidos</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4">
              <AlertDescription>
                Digite o código de 6 dígitos ou escaneie o QR Code para verificar um pedido.
              </AlertDescription>
            </Alert>
            
            <OrderManagement />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default GerenciarPedidos;
