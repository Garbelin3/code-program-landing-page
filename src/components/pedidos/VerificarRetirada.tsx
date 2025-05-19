
import { useState } from "react";
import { QrCodeIcon } from "lucide-react";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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

export const VerificarRetirada = () => {
  const [codigoInput, setCodigoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [codigoRetirada, setCodigoRetirada] = useState<CodigoRetirada | null>(null);
  const [itemsRetirados, setItemsRetirados] = useState<ItemRetirada[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
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
      const { data, error } = await supabaseExtended
        .from("codigos_retirada")
        .select("*")
        .eq("codigo", codigoInput)
        .single();
      
      if (error) throw error;
      
      if (data.usado) {
        setError("Este código já foi utilizado para retirada.");
        return;
      }
      
      setCodigoRetirada(data);
      
      // Converter o objeto de itens para um array mais fácil de usar
      const items: ItemRetirada[] = Object.entries(data.itens).map(([nome, quantidade]) => ({
        nome_produto: nome,
        quantidade: quantidade as number
      })).filter(item => item.quantidade > 0);
      
      setItemsRetirados(items);
      
    } catch (error: any) {
      setError("Código de retirada não encontrado ou inválido.");
      console.error("Error fetching pickup code:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const confirmarEntrega = async () => {
    if (!codigoRetirada) return;
    
    setLoading(true);
    try {
      const { error } = await supabaseExtended
        .from("codigos_retirada")
        .update({ usado: true })
        .eq("id", codigoRetirada.id);
      
      if (error) throw error;
      
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
    setItemsRetirados([]);
    setError(null);
    setSuccess(false);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Verificar Retirada</CardTitle>
        <CardDescription>
          Digite o código de retirada ou escaneie o QR code
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {!codigoRetirada ? (
          <div className="space-y-4">
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
            
            <div className="flex justify-center py-2">
              <p className="text-center text-sm text-gray-500">ou</p>
            </div>
            
            <Button variant="outline" className="w-full" onClick={() => alert("Funcionalidade de escaneamento a implementar")}>
              <QrCodeIcon className="mr-2 h-4 w-4" />
              Escanear QR Code
            </Button>
            
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
              <AlertTitle>Retirada confirmada</AlertTitle>
              <AlertDescription>
                Os itens foram entregues com sucesso.
              </AlertDescription>
            </Alert>
            
            <Button variant="outline" className="w-full" onClick={resetForm}>
              Verificar outro código
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md bg-gray-50 p-4">
              <h3 className="font-medium text-lg">Itens para retirada</h3>
              <ul className="mt-2 space-y-2">
                {itemsRetirados.map((item, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{item.nome_produto}</span>
                    <span className="font-semibold">{item.quantidade}x</span>
                  </li>
                ))}
              </ul>
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
            Confirmar entrega
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
