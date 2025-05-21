
import { useState } from "react";
import { supabaseExtended } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { CodigoRetirada, ItemRetirada, BarInfo } from "./types";

export const useCodigoRetirada = () => {
  const [codigoInput, setCodigoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [codigoValidado, setCodigoValidado] = useState<CodigoRetirada | null>(null);
  const [itensRetirada, setItensRetirada] = useState<ItemRetirada[]>([]);
  const [barInfo, setBarInfo] = useState<BarInfo | null>(null);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  const resetarEstado = () => {
    setCodigoInput("");
    setCodigoValidado(null);
    setItensRetirada([]);
    setBarInfo(null);
    setPedidoId(null);
    setConfirmado(false);
  };

  const handleCodigoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodigoInput(e.target.value);
  };
  
  const validarCodigo = async (codigo: string = codigoInput) => {
    if (!codigo) {
      toast({
        title: "Código inválido",
        description: "Por favor, insira um código de retirada.",
        variant: "destructive"
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Verificar se o código existe e não foi usado
      const { data: codigoData, error: codigoError } = await supabaseExtended
        .from("codigos_retirada")
        .select("*")
        .eq("codigo", codigo)
        .eq("usado", false)
        .eq("invalidado", false)
        .maybeSingle();
      
      if (codigoError) throw codigoError;
      
      if (!codigoData) {
        toast({
          title: "Código inválido",
          description: "Este código não existe ou já foi utilizado.",
          variant: "destructive"
        });
        return;
      }
      
      setPedidoId(codigoData.pedido_id);
      setCodigoValidado(codigoData);
      
      // Buscar detalhes do pedido para exibir
      const { data: pedidoData, error: pedidoError } = await supabaseExtended
        .from("pedidos")
        .select(`
          id,
          bar:bar_id (id, name, address)
        `)
        .eq("id", codigoData.pedido_id)
        .maybeSingle();
      
      if (pedidoError) throw pedidoError;
      
      if (!pedidoData || !pedidoData.bar) {
        throw new Error("Não foi possível obter detalhes do pedido");
      }
      
      // Extrair informações do bar do pedido
      const bar = {
        id: pedidoData.bar.id,
        name: pedidoData.bar.name,
        address: pedidoData.bar.address
      };
      
      setBarInfo(bar);
      
      // Preparar lista de itens para retirada
      const itensList: ItemRetirada[] = [];
      
      if (codigoData.itens && typeof codigoData.itens === 'object') {
        for (const [nomeProduto, quantidade] of Object.entries(codigoData.itens)) {
          itensList.push({
            nome_produto: nomeProduto,
            quantidade: Number(quantidade)
          });
        }
      }
      
      setItensRetirada(itensList);
      
    } catch (error: any) {
      toast({
        title: "Erro ao validar código",
        description: error.message,
        variant: "destructive"
      });
      console.error("Error validating code:", error);
    } finally {
      setLoading(false);
      setScannerActive(false);
    }
  };
  
  const confirmarRetirada = async () => {
    if (!codigoValidado || !codigoValidado.id) return;
    
    setLoading(true);
    
    try {
      // Atualizar o código para usado
      const { error } = await supabaseExtended
        .from("codigos_retirada")
        .update({ usado: true })
        .eq("id", codigoValidado.id);
      
      if (error) throw error;
      
      setConfirmado(true);
      
      toast({
        title: "Retirada confirmada",
        description: "Os itens foram entregues com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao confirmar retirada",
        description: error.message,
        variant: "destructive"
      });
      console.error("Error confirming withdrawal:", error);
    } finally {
      setLoading(false);
    }
  };

  return {
    codigoInput,
    loading,
    scannerActive,
    codigoValidado,
    itensRetirada,
    barInfo,
    confirmado,
    handleCodigoChange,
    validarCodigo,
    confirmarRetirada,
    setScannerActive,
    resetarEstado
  };
};
