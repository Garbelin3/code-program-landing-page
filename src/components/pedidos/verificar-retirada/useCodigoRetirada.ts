
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { formatarPreco } from "./utils";
import { CodigoRetirada, ItemRetirada, BarInfo } from "./types";

export const useCodigoRetirada = () => {
  const [codigoInput, setCodigoInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [codigo, setCodigo] = useState<string>("");
  const [codigoValidado, setCodigoValidado] = useState<CodigoRetirada>({
    codigo: "",
    id: "",
    pedido_id: "",
    itens: {},
    usado: false,
    invalidado: false,
    created_at: ""
  });
  const [pedido, setPedido] = useState<any>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [scannerActive, setScannerActive] = useState(false);
  const [itensRetirada, setItensRetirada] = useState<ItemRetirada[]>([]);
  const [barInfo, setBarInfo] = useState<BarInfo>({
    id: "",
    name: "",
    address: ""
  });
  const [codigoRetirada, setCodigoRetirada] = useState<string | null>(null);
  
  const handleCodigo = (value: string) => {
    setCodigoInput(value);
  };

  const resetarCodigo = () => {
    setCodigo("");
    setCodigoInput("");
    setCodigoValidado({
      codigo: "",
      id: "",
      pedido_id: "",
      itens: {},
      usado: false,
      invalidado: false,
      created_at: ""
    });
    setPedido(null);
    setError("");
    setSuccess(false);
    setItensRetirada([]);
    setBarInfo({
      id: "",
      name: "",
      address: ""
    });
  };
  
  const resetarEstado = () => {
    resetarCodigo();
    setSuccess(false);
  };
  
  const verificarCodigo = async (codigoInput: string) => {
    if (!codigoInput) {
      setError("Digite um código de retirada");
      return;
    }
    
    setCodigo(codigoInput);
    setLoading(true);
    setError("");
    
    try {
      // Verificar se o código de retirada existe e não foi usado
      const { data: codigoData, error: codigoError } = await supabaseExtended
        .from("codigos_retirada")
        .select("*")
        .eq("codigo", codigoInput)
        .eq("usado", false)
        .eq("invalidado", false)
        .maybeSingle();
      
      if (codigoError) throw codigoError;
      
      if (!codigoData) {
        setError("Código de retirada inválido ou já utilizado");
        return;
      }
      
      setCodigoValidado(codigoData);
      
      // Buscar detalhes do pedido
      const { data: pedidoData, error: pedidoError } = await supabaseExtended
        .from("pedidos")
        .select(`
          *,
          bar:bar_id (
            id,
            name,
            address
          )
        `)
        .eq("id", codigoData.pedido_id)
        .single();
      
      if (pedidoError) throw pedidoError;
      
      setPedido(pedidoData);
      
      // Formatar os itens para exibição
      const itensFormattados: ItemRetirada[] = Object.entries(codigoData.itens || {}).map(
        ([nome, quantidade]) => ({
          nome,
          quantidade: Number(quantidade)
        })
      );
      
      setItensRetirada(itensFormattados);
      
      // Salvar informações do bar
      if (pedidoData.bar) {
        setBarInfo({
          id: pedidoData.bar.id,
          name: pedidoData.bar.name,
          address: pedidoData.bar.address
        });
      }
      
      // Código validado com sucesso
      setCodigoRetirada(codigoInput);
    } catch (error: any) {
      console.error("Erro ao verificar código:", error);
      setError("Erro ao verificar código");
    } finally {
      setLoading(false);
    }
  };
  
  const confirmarRetirada = async () => {
    setLoading(true);
    try {
      // Marcar o código como usado
      const { error } = await supabaseExtended
        .from("codigos_retirada")
        .update({ usado: true })
        .eq("id", codigoValidado.id);
      
      if (error) throw error;
      
      setSuccess(true);
      
      // Limpar código de input mas manter os dados para exibição
      setCodigoInput("");
    } catch (error) {
      console.error("Erro ao confirmar retirada:", error);
      setError("Erro ao confirmar retirada");
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
    success,
    codigo,
    pedido,
    error,
    codigoRetirada,
    handleCodigo,
    verificarCodigo,
    confirmarRetirada,
    resetarCodigo,
    setCodigoInput,
    formatarPreco,
    setScannerActive,
    resetarEstado
  };
};
