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
  
  // Versão modificada de buscarCodigo que aceita um parâmetro de código explícito
  const buscarCodigo = async (skipValidation = false, codigoExplicito?: string) => {
    // Usar o código explícito se fornecido, caso contrário usar o codigoInput do estado
    const codigoParaBuscar = codigoExplicito ? codigoExplicito.trim() : codigoInput.trim();
    console.log("Buscando código (explícito ou do estado):", codigoParaBuscar);
    
    // Verificar se o código está vazio
    if (!codigoParaBuscar) {
      toast({
        title: "Código inválido",
        description: "O código de retirada não pode estar vazio",
        variant: "destructive"
      });
      return;
    }
    
    // Pular a validação de 6 dígitos se skipValidation for true
    if (!skipValidation && codigoParaBuscar.length !== 6) {
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
      console.log("Iniciando busca no Supabase para código:", codigoParaBuscar);
      
      // Buscar o código na tabela codigos_retirada
      const { data, error } = await supabaseExtended
        .from("codigos_retirada")
        .select("*")
        .eq("codigo", codigoParaBuscar)
        .maybeSingle();
      
      console.log("Resposta do Supabase:", { data, error });
      
      if (error) {
        console.error("Erro do Supabase:", error);
        throw error;
      }
      
      if (!data) {
        console.log("Código não encontrado no banco de dados:", codigoParaBuscar);
        setError("Código de retirada não encontrado.");
        setLoading(false);
        return;
      }
      
      console.log("Código encontrado com sucesso:", data);
      
      if (data.usado) {
        setError("Este código já foi utilizado para retirada.");
        setLoading(false);
        return;
      }
      
      // Guardar os dados do código de retirada
      setCodigoRetirada(data);
      
      // Buscar informações do pedido
      console.log("Buscando informações do pedido ID:", data.pedido_id);
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
      
      console.log("Resposta do pedido:", { pedidoData, pedidoError });
      
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
      console.log("Dados do bar:", pedidoData.bar);
      
      // Configurar o objeto de pedido com a estrutura correta e acesso seguro às propriedades
      setPedido({
        id: pedidoData.id,
        created_at: pedidoData.created_at,
        valor_total: pedidoData.valor_total,
        status: pedidoData.status,
        user_id: pedidoData.user_id,
        bars: {
          name: pedidoData.bar?.name || "",
          address: pedidoData.bar?.address || ""
        }
      });
      
      // Processar os itens do código de retirada
      console.log("Dados de itens brutos:", data.itens);
      
      // Converter o objeto de itens para um array mais fácil de usar
      if (data.itens && typeof data.itens === 'object') {
        // Garantir que estamos trabalhando com um objeto para converter em array
        const itens: ItemRetirada[] = Object.entries(data.itens).map(([nome, quantidade]) => ({
          nome_produto: nome,
          quantidade: typeof quantidade === 'number' ? quantidade : Number(quantidade)
        })).filter(item => item.quantidade > 0);
        
        console.log("Itens processados para exibição:", itens);
        setItensRetirados(itens);
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
