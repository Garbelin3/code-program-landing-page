
import { useState, useRef, useEffect } from "react";
import { QrCodeIcon, ScanLine, X, Check } from "lucide-react";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Html5Qrcode } from "html5-qrcode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

interface ItemRetirada {
  nome_produto: string;
  quantidade: number;
}

interface CodigoRetirada {
  id: string;
  codigo: string;
  pedido_id: string;
  itens: Record<string, number>;
  usado: boolean;
  created_at: string;
}

interface BarInfo {
  name: string;
  address: string;
}

interface PedidoBasic {
  id: string;
  created_at: string;
  valor_total: number;
  status: string;
  user_id: string;
  bars: BarInfo; // Changed from array to object
}

export const VerificarRetirada = () => {
  const [codigoInput, setCodigoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [codigoRetirada, setCodigoRetirada] = useState<CodigoRetirada | null>(null);
  const [pedido, setPedido] = useState<PedidoBasic | null>(null);
  const [itemsRetirados, setItemsRetirados] = useState<ItemRetirada[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivId = useRef<string>(`qr-reader-${Math.random().toString(36).substring(2, 9)}`);
  
  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodigoInput(e.target.value);
  };
  
  const buscarCodigo = async () => {
    if (!codigoInput || codigoInput.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código de retirada deve ter 6 dígitos",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    setError(null);
    setCodigoRetirada(null);
    setItemsRetirados([]);
    setSuccess(false);
    
    try {
      // Buscar o código na tabela codigos_retirada
      const { data, error } = await supabaseExtended
        .from("codigos_retirada")
        .select("*")
        .eq("codigo", codigoInput)
        .single();
      
      if (error) throw error;
      
      console.log("Código encontrado:", data);
      
      if (data.usado) {
        setError("Este código já foi utilizado para retirada.");
        setLoading(false);
        return;
      }
      
      // Guardar os dados do código de retirada
      setCodigoRetirada(data);
      
      // Buscar informações do pedido
      const { data: pedidoData, error: pedidoError } = await supabaseExtended
        .from("pedidos")
        .select(`
          id,
          created_at,
          valor_total,
          status,
          user_id,
          bars:bar_id (name, address)
        `)
        .eq("id", data.pedido_id)
        .single();
      
      if (pedidoError) throw pedidoError;
      
      console.log("Dados do pedido:", pedidoData);
      
      // Configurar o objeto de pedido com a estrutura correta
      setPedido({
        id: pedidoData.id,
        created_at: pedidoData.created_at,
        valor_total: pedidoData.valor_total,
        status: pedidoData.status,
        user_id: pedidoData.user_id,
        bars: {
          name: pedidoData.bars?.name || "",
          address: pedidoData.bars?.address || ""
        }
      });
      
      // Processar os itens do código de retirada
      console.log("Dados de itens brutos:", data.itens);
      
      // Converter o objeto de itens para um array mais fácil de usar
      if (data.itens && typeof data.itens === 'object') {
        // Garantir que estamos trabalhando com um objeto para converter em array
        const items: ItemRetirada[] = Object.entries(data.itens).map(([nome, quantidade]) => ({
          nome_produto: nome,
          quantidade: typeof quantidade === 'number' ? quantidade : Number(quantidade)
        })).filter(item => item.quantidade > 0);
        
        console.log("Items processados para exibição:", items);
        setItemsRetirados(items);
      } else {
        console.error("Nenhum item encontrado ou formato inválido no código de retirada");
        // Atribuir array vazio para evitar erros de renderização
        setItemsRetirados([]);
      }
      
    } catch (error: any) {
      console.error("Error fetching pickup code:", error);
      setError("Código de retirada não encontrado ou inválido.");
    } finally {
      setLoading(false);
    }
  };
  
  const confirmarEntrega = async () => {
    if (!codigoRetirada) return;
    
    setLoading(true);
    try {
      // Atualizar a coluna "usado" para true
      const { error } = await supabaseExtended
        .from("codigos_retirada")
        .update({ usado: true })
        .eq("id", codigoRetirada.id);
      
      if (error) {
        console.error("Erro ao atualizar status do código:", error);
        throw error;
      }
      
      console.log("Entrega confirmada com sucesso, código marcado como usado");
      setSuccess(true);
      setCodigoInput("");
      
      toast({
        title: "Retirada confirmada",
        description: "Os itens foram entregues com sucesso."
      });
      
    } catch (error: any) {
      toast({
        title: "Erro ao confirmar retirada",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const resetForm = () => {
    setCodigoInput("");
    setCodigoRetirada(null);
    setPedido(null);
    setItemsRetirados([]);
    setError(null);
    setSuccess(false);
    setScanning(false);
    
    // Make sure to stop the scanner if it's running
    stopScanner();
  };
  
  const startScanner = async () => {
    if (scannerRef.current) {
      // Scanner already running
      return;
    }
    
    // Create scanner container if it doesn't exist
    const scannerContainer = document.getElementById("scanner-container");
    if (!scannerContainer) {
      console.error("Scanner container not found");
      toast({
        title: "Erro",
        description: "Container para o scanner não encontrado",
        variant: "destructive"
      });
      return;
    }
    
    // Clear existing content
    scannerContainer.innerHTML = "";
    
    // Create a new div for the scanner
    const scannerDiv = document.createElement("div");
    scannerDiv.id = scannerDivId.current;
    scannerContainer.appendChild(scannerDiv);
    
    try {
      // Initialize the scanner with the ID of the div
      const scanner = new Html5Qrcode(scannerDivId.current);
      scannerRef.current = scanner;
      setScanning(true);
      
      console.log("Starting QR scanner");
      
      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        (decodedText) => {
          console.log("QR Code decoded:", decodedText);
          // Verificar se o texto do QR é um JSON válido
          try {
            const qrData = JSON.parse(decodedText);
            console.log("Parsed QR data:", qrData);
            if (qrData.codigo && qrData.codigo.length === 6) {
              stopScanner();
              setCodigoInput(qrData.codigo);
              // Pequeno delay para garantir que o estado seja atualizado
              setTimeout(() => {
                buscarCodigo();
              }, 100);
            } else {
              toast({
                title: "QR Code inválido",
                description: "O QR code não contém um código de retirada válido",
                variant: "destructive"
              });
            }
          } catch (error) {
            console.error("Error parsing QR data:", error);
            toast({
              title: "QR Code inválido",
              description: "Não foi possível ler os dados do QR code",
              variant: "destructive"
            });
          }
        },
        (errorMessage) => {
          console.error("QR Scanner error:", errorMessage);
        }
      ).catch(error => {
        console.error("Failed to start scanner:", error);
        toast({
          title: "Erro ao iniciar scanner",
          description: "Verifique se você concedeu permissão para usar a câmera",
          variant: "destructive"
        });
        setScanning(false);
      });
    } catch (err) {
      console.error("Erro ao iniciar scanner:", err);
      setScanning(false);
      toast({
        title: "Erro ao iniciar câmera",
        description: "Verifique se você concedeu permissão para usar a câmera",
        variant: "destructive"
      });
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current
        .stop()
        .then(() => {
          setScanning(false);
        })
        .catch((err) => {
          console.error("Erro ao parar scanner:", err);
        });
      scannerRef.current = null;
    }
  };

  // Limpar scanner quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(err => console.error(err));
      }
    };
  }, []);

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', { 
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
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
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Código Manual</TabsTrigger>
                <TabsTrigger value="scanner">Scanner QR</TabsTrigger>
              </TabsList>
              
              <TabsContent value="manual" className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Digite o código de 6 dígitos"
                    value={codigoInput}
                    onChange={handleCodigoChange}
                    className="flex-1"
                    maxLength={6}
                  />
                  <Button onClick={buscarCodigo} disabled={loading}>
                    Verificar
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="scanner">
                <div className="space-y-4">
                  {!scanning ? (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={startScanner}
                    >
                      <ScanLine className="mr-2 h-4 w-4" />
                      Iniciar Scanner
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div 
                        id="scanner-container" 
                        className="w-full rounded-md overflow-hidden"
                        style={{ maxWidth: "100%", margin: "0 auto", height: "300px" }}
                      ></div>
                      <Button 
                        variant="destructive"
                        className="w-full" 
                        onClick={stopScanner}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Parar Scanner
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        ) : success ? (
          <div className="space-y-4">
            <Alert>
              <AlertTitle className="flex items-center text-green-600">
                <Check className="h-4 w-4 mr-2" />
                Retirada confirmada
              </AlertTitle>
              <AlertDescription>
                Os itens foram entregues com sucesso.
              </AlertDescription>
            </Alert>
            
            <Button variant="outline" className="w-full" onClick={resetForm}>
              Verificar outro código
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                <div>
                  <h3 className="font-semibold text-lg text-blue-900">Pedido #{pedido?.id.substring(0, 8)}</h3>
                  <p className="text-sm text-blue-700">
                    Realizado em {pedido ? formatarData(pedido.created_at) : ''}
                  </p>
                  <p className="text-sm mt-1 font-medium">
                    Local: {pedido?.bars.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pedido?.bars.address}
                  </p>
                </div>
                <Badge className="bg-amber-500 mt-2 sm:mt-0 self-start">
                  Código: {codigoRetirada.codigo}
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-lg mb-2">Itens para retirada</h3>
              <div className="border rounded-md divide-y">
                {itemsRetirados && itemsRetirados.length > 0 ? (
                  itemsRetirados.map((item, i) => (
                    <div key={i} className="p-3 flex justify-between items-center">
                      <span className="font-medium">{item.nome_produto}</span>
                      <Badge variant="outline" className="ml-2">
                        {item.quantidade}x
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum item para retirada
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
      
      {codigoRetirada && !success && (
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={confirmarEntrega}
            disabled={loading}
          >
            <Check className="mr-2 h-4 w-4" />
            Confirmar entrega
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
