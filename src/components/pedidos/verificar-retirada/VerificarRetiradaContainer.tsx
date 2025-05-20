
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrScanner } from "./QrScanner";
import { CodigoForm } from "./CodigoForm";
import { EntregaConfirmada } from "./EntregaConfirmada";
import { DetalhesRetirada } from "./DetalhesRetirada";
import { useCodigoRetirada } from "./useCodigoRetirada";

export const VerificarRetiradaContainer = () => {
  const {
    codigoInput,
    loading,
    codigoRetirada,
    pedido,
    itemRetirados,
    error,
    success,
    handleCodigoChange,
    buscarCodigo,
    confirmarEntrega,
    resetForm,
    setCodigoInput
  } = useCodigoRetirada();
  
  const [activeTab, setActiveTab] = useState<string>("manual");
  
  const handleCodeScanned = (codigo: string) => {
    setCodigoInput(codigo);
    setTimeout(() => {
      buscarCodigo();
    }, 100);
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Verificar Retirada</CardTitle>
        <CardDescription>
          Digite o código de retirada ou escaneie o QR code
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!codigoRetirada ? (
          <div className="space-y-4">
            <Tabs 
              defaultValue="manual" 
              className="w-full"
              value={activeTab}
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Código Manual</TabsTrigger>
                <TabsTrigger value="scanner">Scanner QR</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-4">
                <CodigoForm
                  codigoInput={codigoInput}
                  onChange={handleCodigoChange}
                  onSubmit={buscarCodigo}
                  error={error}
                  loading={loading}
                />
              </TabsContent>
              
              <TabsContent value="scanner">
                <QrScanner onCodeScanned={handleCodeScanned} />
              </TabsContent>
            </Tabs>
          </div>
        ) : success ? (
          <EntregaConfirmada onReset={resetForm} />
        ) : (
          pedido && (
            <DetalhesRetirada
              pedido={pedido}
              itensRetirados={itensRetirados}
              codigoRetirada={codigoRetirada}
              onConfirmar={confirmarEntrega}
              loading={loading}
            />
          )
        )}
      </CardContent>
      
      {codigoRetirada && !success && (
        <CardFooter>
          {/* Removed button as it's now part of DetalhesRetirada component */}
        </CardFooter>
      )}
    </Card>
  );
};
