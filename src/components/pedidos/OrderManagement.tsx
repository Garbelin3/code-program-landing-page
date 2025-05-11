
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { QrCode, Check, X, PackageCheck } from "lucide-react";
import { HTML5QrcodeScanner } from "html5-qrcode";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

interface OrderItem {
  name: string;
  quantity: number;
}

interface OrderDetails {
  id: string;
  items: OrderItem[];
  customerId: string;
}

export const OrderManagement = () => {
  const [pickupCode, setPickupCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);

  // Handle scanner initialization
  const startScanner = () => {
    setIsScanning(true);
    setError(null);
    
    // Add a small delay to ensure the DOM element is ready
    setTimeout(() => {
      try {
        const qrScanner = new HTML5QrcodeScanner(
          "qr-reader", 
          { fps: 10, qrbox: 250 },
          /* verbose= */ false);

        qrScanner.render((decodedText) => {
          // Success callback
          if (decodedText && /^\d{6}$/.test(decodedText)) {
            setPickupCode(decodedText);
            setIsScanning(false);
            // Clean up the scanner
            qrScanner.clear();
            // Optionally auto-verify
            handleVerifyOrder(decodedText);
          } else {
            toast({
              title: "Formato inválido",
              description: "O QR code deve conter um código de 6 dígitos.",
              variant: "destructive"
            });
          }
        }, (errorMessage) => {
          // On error, just log to console
          console.error("QR code scanning error:", errorMessage);
        });
      } catch (err) {
        console.error("Failed to initialize QR scanner:", err);
        toast({
          title: "Erro no escaneamento",
          description: "Não foi possível inicializar o scanner de QR code.",
          variant: "destructive"
        });
        setIsScanning(false);
      }
    }, 100);
  };
  
  // Validate input is 6 digits
  const isValidCode = (code: string): boolean => {
    return /^\d{6}$/.test(code);
  };

  // Handle code input changes
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits and max length of 6
    if (/^\d*$/.test(value) && value.length <= 6) {
      setPickupCode(value);
      setError(null);
    }
  };

  // Handle order verification
  const handleVerifyOrder = async (code = pickupCode) => {
    if (!isValidCode(code)) {
      setError("Por favor, digite um código de 6 dígitos numéricos.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setOrderDetails(null);
    setIsFinalized(false);
    
    try {
      // API call to validate the code
      const { data, error } = await supabase.functions.invoke("validate-pickup-code", {
        body: { code }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.success) {
        setError(data.error || "Código inválido ou já utilizado.");
        return;
      }
      
      setOrderDetails({
        id: data.order.id,
        items: data.order.items,
        customerId: data.order.customer_id
      });
      
      toast({
        title: "Pedido encontrado",
        description: "Os detalhes do pedido foram carregados.",
      });
      
    } catch (err: any) {
      console.error("Error verifying order:", err);
      setError(err.message || "Ocorreu um erro ao verificar o código. Tente novamente.");
      
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar o código. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle order finalization
  const handleFinalizeOrder = async () => {
    if (!orderDetails || !pickupCode) return;
    
    setIsLoading(true);
    
    try {
      // API call to finalize the order
      const { data, error } = await supabase.functions.invoke("finalize-pickup", {
        body: { code: pickupCode }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.success) {
        throw new Error(data.error || "Não foi possível finalizar o pedido.");
      }
      
      setIsFinalized(true);
      toast({
        title: "Pedido finalizado",
        description: "A retirada do pedido foi registrada com sucesso.",
      });
      
      // Reset after a delay
      setTimeout(() => {
        setPickupCode("");
        setOrderDetails(null);
        setIsFinalized(false);
      }, 3000);
      
    } catch (err: any) {
      console.error("Error finalizing order:", err);
      
      toast({
        title: "Erro na finalização",
        description: err.message || "Ocorreu um erro ao finalizar o pedido.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset all state
  const handleReset = () => {
    setPickupCode("");
    setOrderDetails(null);
    setError(null);
    setIsFinalized(false);
    setIsScanning(false);
  };
  
  return (
    <div>
      {!isScanning && !orderDetails && (
        <div className="space-y-4">
          <div className="grid gap-2">
            <label htmlFor="pickup-code" className="text-sm font-medium">
              Código de retirada
            </label>
            <Input
              id="pickup-code"
              placeholder="Digite o código de 6 dígitos"
              value={pickupCode}
              onChange={handleCodeChange}
              className={error ? "border-red-500" : ""}
              maxLength={6}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => handleVerifyOrder()} 
              disabled={!isValidCode(pickupCode) || isLoading}
              className="flex-1"
            >
              <Check className="mr-2 h-4 w-4" />
              Verificar Pedido
            </Button>
            <Button 
              onClick={startScanner} 
              variant="outline" 
              className="flex-1"
              disabled={isLoading}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Escanear QR Code
            </Button>
          </div>
        </div>
      )}

      {isScanning && (
        <div className="space-y-4">
          <div id="qr-reader" className="w-full max-w-md mx-auto"></div>
          <Button 
            onClick={() => setIsScanning(false)} 
            variant="outline" 
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            Cancelar Escaneamento
          </Button>
        </div>
      )}

      {orderDetails && (
        <div className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-medium">Detalhes do Pedido</h3>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-500">Itens para retirada:</p>
                <ul className="divide-y">
                  {orderDetails.items.map((item, index) => (
                    <li key={index} className="py-2 flex justify-between">
                      <span>{item.name}</span>
                      <span className="font-medium">{item.quantity}x</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              {isFinalized ? (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <AlertDescription className="text-green-800">
                    Pedido finalizado com sucesso!
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="mt-6 flex gap-2">
                  <Button 
                    onClick={handleFinalizeOrder} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    <PackageCheck className="mr-2 h-4 w-4" />
                    Finalizar Pedido
                  </Button>
                  <Button 
                    onClick={handleReset} 
                    variant="outline" 
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          
          {isFinalized && (
            <Button 
              onClick={handleReset} 
              className="w-full"
            >
              Novo Pedido
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
