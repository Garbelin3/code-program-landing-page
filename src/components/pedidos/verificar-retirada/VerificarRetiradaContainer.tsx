
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrScanner } from "./QrScanner";
import { CodigoForm } from "./CodigoForm";
import { EntregaConfirmada } from "./EntregaConfirmada";
import { DetalhesRetirada } from "./DetalhesRetirada";
import { useCodigoRetirada } from "./useCodigoRetirada";
import { toast } from "@/components/ui/use-toast";

export const VerificarRetiradaContainer = () => {
  const {
    codigoInput,
    loading,
    confirmado,
    erro,
    pedido,
    codigoValidado,
    itensRetirada,
    handleCodigo,
    validarCodigo,
    confirmarRetirada,
    resetarCodigo,
    setCodigoInput
  } = useCodigoRetirada();

  // Processamento dos itens no container para evitar problemas de estado
  const itensRetirados = codigoValidado?.itens 
    ? Object.entries(codigoValidado.itens).map(([nome, quantidade]) => ({
        nome_produto: nome,
        quantidade: typeof quantidade === 'number' ? quantidade : Number(quantidade)
      })).filter(item => item.quantidade > 0)
    : [];

  console.log("itensRetirados processados no container:", itensRetirados);
  
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [resetKey, setResetKey] = useState(0); // Chave para forçar re-renderização
  const [autoVerificando, setAutoVerificando] = useState(false);
  const codigoRecuperadoRef = useRef<string | null>(null);
  
  // Função para escanear código com memoização para evitar recriações
  const handleCodeScanned = useCallback((codigo: string) => {
    console.log("Código escaneado:", codigo);
    // Salvar o código no localStorage e recarregar a página
    if (codigo && codigo.trim() !== "") {
      localStorage.setItem('lastCode', codigo.trim());
      console.log("Código salvo no localStorage:", codigo.trim());
      window.location.reload();
    } else {
      toast({
        title: "Código inválido",
        description: "O código escaneado está vazio ou inválido",
        variant: "destructive"
      });
    }
  }, []);

  // Função de reset aprimorada
  const handleReset = useCallback(() => {
    resetarCodigo();
    // Recarregar a página ao resetar
    window.location.reload();
  }, [resetarCodigo]);

  // Função para verificar código com recarregamento automático
  const verificarComRecarregamento = useCallback(() => {
    console.log("Verificando código com recarregamento:", codigoInput);
    // Salvar o código no localStorage e recarregar a página
    if (codigoInput && codigoInput.trim() !== "") {
      localStorage.setItem('lastCode', codigoInput.trim());
      console.log("Código salvo no localStorage:", codigoInput.trim());
      window.location.reload();
    } else {
      toast({
        title: "Código inválido",
        description: "Por favor, digite um código válido",
        variant: "destructive"
      });
    }
  }, [codigoInput]);

  // Verificar código salvo no localStorage e executar busca automaticamente
  useEffect(() => {
    const lastCode = localStorage.getItem('lastCode');
    
    if (lastCode && lastCode.trim() !== "") {
      const codigoLimpo = lastCode.trim();
      console.log("Código recuperado do localStorage:", codigoLimpo);
      
      // Salvar o código recuperado na ref para uso posterior
      codigoRecuperadoRef.current = codigoLimpo;
      
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
          // Passar o código diretamente para evitar problemas de sincronização
          validarCodigo(codigoLimpo);
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
  }, [validarCodigo, setCodigoInput]);
  
  return (
    <Card className="w-full max-w-md mx-auto" key={resetKey}>
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
            <p>Verificando código automaticamente: {codigoRecuperadoRef.current}</p>
          </div>
        )}
        
        {!autoVerificando && !codigoValidado ? (
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
                  onChange={handleCodigo}
                  onSubmit={verificarComRecarregamento}
                  error={erro}
                  loading={loading}
                  disableValidation={false}
                />
              </TabsContent>
              
              <TabsContent value="scanner">
                <QrScanner onCodeScanned={handleCodeScanned} />
              </TabsContent>
            </Tabs>
          </div>
        ) : confirmado ? (
          <EntregaConfirmada onReset={handleReset} />
        ) : codigoValidado ? (
          <DetalhesRetirada
            pedido={pedido}
            itensRetirados={itensRetirada}
            codigoRetirada={codigoValidado}
            onConfirmar={confirmarRetirada}
            onReset={handleReset}
            loading={loading}
          />
        ) : null}
      </CardContent>
      
      {codigoValidado && !confirmado && (
        <CardFooter>
          {/* Removed button as it's now part of DetalhesRetirada component */}
        </CardFooter>
      )}
    </Card>
  );
};
