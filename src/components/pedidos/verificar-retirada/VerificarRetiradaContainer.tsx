
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrScanner } from "./QrScanner";
import { CodigoForm } from "./CodigoForm";
import { EntregaConfirmada } from "./EntregaConfirmada";
import { DetalhesRetirada } from "./DetalhesRetirada";
import { useCodigoRetirada } from "./useCodigoRetirada";
import { toast } from "@/components/ui/use-toast";
import { ItemRetirada } from "./types";

export const VerificarRetiradaContainer = () => {
  const {
    codigoInput,
    loading,
    codigoRetirada,
    pedido,
    error,
    success,
    handleCodigoChange,
    buscarCodigo,
    confirmarEntrega,
    resetForm,
    setCodigoInput
  } = useCodigoRetirada();

  // Processamento dos itens no container para evitar problemas de estado
  const itensRetirados: ItemRetirada[] = codigoRetirada && typeof codigoRetirada !== 'string' && codigoRetirada.itens 
    ? Object.entries(codigoRetirada.itens).map(([nome_produto, quantidade]) => ({
        nome_produto,
        quantidade: typeof quantidade === 'number' ? quantidade : Number(quantidade)
      })).filter(item => item.quantidade > 0)
    : [];

  console.log("itensRetirados processados no container:", itensRetirados);
  
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [autoVerificando, setAutoVerificando] = useState(false);
  
  // Função para escanear código com memoização para evitar recriações
  const handleCodeScanned = useCallback((codigo: string) => {
    console.log("Código escaneado:", codigo);
    
    if (codigo && codigo.trim() !== "") {
      const codigoLimpo = codigo.trim();
      setCodigoInput(codigoLimpo);
      
      // Verificar o código diretamente sem recarregar
      setAutoVerificando(true);
      
      setTimeout(() => {
        buscarCodigo(false, codigoLimpo);
        setAutoVerificando(false);
      }, 500);
    } else {
      toast({
        title: "Código inválido",
        description: "O código escaneado está vazio ou inválido",
        variant: "destructive"
      });
    }
  }, [buscarCodigo, setCodigoInput]);

  // Função de reset aprimorada
  const handleReset = useCallback(() => {
    resetForm();
  }, [resetForm]);

  // Função para verificar código sem recarregamento
  const verificarComMelhoria = useCallback(() => {
    console.log("Verificando código sem recarregamento:", codigoInput);
    
    if (codigoInput && codigoInput.trim() !== "") {
      buscarCodigo(false, codigoInput.trim());
    } else {
      toast({
        title: "Código inválido",
        description: "Por favor, digite um código válido",
        variant: "destructive"
      });
    }
  }, [codigoInput, buscarCodigo]);

  // Verificar código salvo no localStorage e executar busca automaticamente
  useEffect(() => {
    const lastCode = localStorage.getItem('lastCode');
    
    if (lastCode && lastCode.trim() !== "") {
      const codigoLimpo = lastCode.trim();
      console.log("Código recuperado do localStorage:", codigoLimpo);
      
      // Mostrar indicador de carregamento
      setAutoVerificando(true);
      
      // Definir o código no input para exibição
      setCodigoInput(codigoLimpo);
      
      // Limpar localStorage para evitar loops
      localStorage.removeItem('lastCode');
      
      // Usar um timeout para garantir que o estado foi atualizado
      setTimeout(() => {
        console.log("Iniciando busca automática com código explícito:", codigoLimpo);
        
        try {
          // Usar o parâmetro codigoExplicito para passar o código diretamente
          buscarCodigo(true, codigoLimpo);
        } catch (error) {
          console.error("Erro ao buscar código:", error);
          toast({
            title: "Erro ao processar código",
            description: "Ocorreu um erro ao processar o código. Por favor, tente novamente.",
            variant: "destructive"
          });
        } finally {
          // Desativar indicador de carregamento após a busca
          setTimeout(() => {
            setAutoVerificando(false);
          }, 1000);
        }
      }, 800);
    }
  }, [buscarCodigo, setCodigoInput]);
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Verificar Retirada</CardTitle>
        <CardDescription>
          Digite o código de retirada ou escaneie o QR code
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {autoVerificando && (
          <div className="p-4 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Verificando código...</p>
          </div>
        )}
        
        {!autoVerificando && !codigoRetirada ? (
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
                  onSubmit={verificarComMelhoria}
                  error={error}
                  loading={loading}
                  disableValidation={false}
                />
              </TabsContent>
              
              <TabsContent value="scanner">
                <QrScanner onCodeScanned={handleCodeScanned} />
              </TabsContent>
            </Tabs>
          </div>
        ) : success ? (
          <EntregaConfirmada onReset={handleReset} />
        ) : codigoRetirada ? (
          <DetalhesRetirada
            pedido={pedido}
            itensRetirados={itensRetirados}
            codigoRetirada={codigoRetirada}
            onConfirmar={confirmarEntrega}
            onReset={handleReset}
            loading={loading}
          />
        ) : null}
      </CardContent>
      
      {codigoRetirada && !success && (
        <CardFooter>
          {/* No content needed here as buttons are in DetalhesRetirada */}
        </CardFooter>
      )}
    </Card>
  );
};
