
import { useState } from "react";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { toast } from "@/hooks/use-toast";
import { CodigoRetirada, PedidoBasic, ItemRetirada } from "./types";

export const useCodigoRetirada = () => {
  const [codigoInput, setCodigoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [codigoRetirada, setCodigoRetirada] = useState<CodigoRetirada | null>(null);
  const [pedido, setPedido] = useState<PedidoBasic | null>(null);
  const [itensRetirados, setItensRetirados] = useState<ItemRetirada[]>([]);
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
    setItensRetirados([]);
    setSuccess(false);
    
    try {
    // Buscar o código na tabela codigos_retirada
    const { data, error } = await supabaseExtended
      .from("codigos_retirada")
      .select("*")
      .eq("codigo", codigoInput)
      .maybeSingle();

      
      if (error) throw error;
      if (!data) {
        setError("Código de retirada não encontrado.");
        setLoading(false);
        return;
      }
      
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
          bar:bar_id (
            name,
            address
          )
        `)
        .eq("id", data.pedido_id)
        .maybeSingle(); // Usando maybeSingle em vez de single
      
      if (pedidoError) {
        console.error("Erro ao buscar pedido:", pedidoError);
        throw pedidoError;
      }
      
      if (!pedidoData) {
        setError("Pedido não encontrado para este código.");
        setLoading(false);
        return;
      }
      
      console.log("Dados do pedido:", pedidoData);
      
      // Configurar o objeto de pedido com a estrutura correta
      setPedido({
        id: pedidoData.id,
        created_at: pedidoData.created_at,
        valor_total: pedidoData.valor_total,
        status: pedidoData.status,
        user_id: pedidoData.user_id,
        bars: {
          name: pedidoData.bar ? pedidoData.bar.name || "" : "",
          address: pedidoData.bar ? pedidoData.bar.address || "" : ""
        }
      });
      
      // Processar os item do código de retirada
      console.log("Dados de item brutos:", data.itens);
      
      // Converter o objeto de item para um array mais fácil de usar
      if (data.itens && typeof data.itens === 'object') {
        // Garantir que estamos trabalhando com um objeto para converter em array
        const item: ItemRetirada[] = Object.entries(data.itens).map(([nome, quantidade]) => ({
          nome_produto: nome,
          quantidade: typeof quantidade === 'number' ? quantidade : Number(quantidade)
        })).filter(item => item.quantidade > 0);
        
        console.log("Itens processados para exibição:", item);
        setItensRetirados(item);
      } else {
        console.error("Nenhum item encontrado ou formato inválido no código de retirada");
        // Atribuir array vazio para evitar erros de renderização
        setItensRetirados([]);
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
        description: "Os item foram entregues com sucesso."
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
    setItensRetirados([]);
    setError(null);
    setSuccess(false);
  };
  
  return {
    codigoInput,
    setCodigoInput,
    loading,
    codigoRetirada,
    pedido,
    itensRetirados,
    error,
    success,
    handleCodigoChange,
    buscarCodigo,
    confirmarEntrega,
    resetForm
  };
};
