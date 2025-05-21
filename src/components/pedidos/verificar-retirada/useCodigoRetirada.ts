
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { useToast } from "@/hooks/use-toast";
import { formatarPreco } from "./utils";
import { PedidoBasic, BarInfo, ItemRetirada } from "./types";

interface Item {
  id: string;
  nome_produto: string;
  quantidade: number;
  quantidade_restante: number;
  preco_unitario: number;
  quantidade_selecionada?: number;
}

interface InfoPedido {
  id: string;
  created_at: string;
  valor_total: number;
  status: string;
  user_id: string;
  bar: BarInfo;
  itens: Item[];
}

export const useCodigoRetirada = () => {
  const { toast } = useToast();
  const [codigo, setCodigoInput] = useState("");
  const [loading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pedido, setPedido] = useState<InfoPedido | null>(null);
  const [itensRetirada, setItensRetirada] = useState<ItemRetirada[]>([]);
  const [success, setIsSuccess] = useState(false);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [barId, setBarId] = useState<string | null>(null);
  const [codigoId, setCodigoId] = useState<string | null>(null);
  const [codigoRetirada, setCodigoRetirada] = useState<any | null>(null);

  const handleCodigo = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodigoInput(e.target.value);
    setError(null);
  };

  const verificarCodigo = async (automatico = false, codigoExplicito?: string) => {
    try {
      const codigoAtual = codigoExplicito || codigo;
      if (!codigoAtual || codigoAtual.length < 6) {
        setError("Por favor, insira um código de 6 dígitos");
        return false;
      }

      setIsLoading(true);
      setError(null);

      // Buscar o código na tabela de codigos_retirada
      const { data: codigoData, error: codigoError } = await supabaseExtended
        .from("codigos_retirada")
        .select("*")
        .eq("codigo", codigoAtual)
        .eq("usado", false)
        .eq("invalidado", false)
        .maybeSingle();

      if (codigoError) {
        throw codigoError;
      }

      if (!codigoData) {
        setError("Este código não existe ou já foi utilizado");
        return false;
      }

      setCodigoRetirada(codigoData);
      setCodigoId(codigoData.id);
      setPedidoId(codigoData.pedido_id);

      // Buscar informações do pedido
      const { data: pedidoData, error: pedidoError } = await supabaseExtended
        .from("pedidos")
        .select(`
          id,
          created_at,
          status,
          user_id,
          valor_total,
          bar_id,
          bar:bar_id (id, name, address)
        `)
        .eq("id", codigoData.pedido_id)
        .single();

      if (pedidoError) {
        throw pedidoError;
      }

      setBarId(pedidoData.bar_id);

      // Buscar itens do pedido que estão no código de retirada
      const { data: itensData, error: itensError } = await supabaseExtended
        .from("pedido_itens")
        .select("*")
        .eq("pedido_id", codigoData.pedido_id);

      if (itensError) {
        throw itensError;
      }

      // Filtrar os itens com base no que está definido no código de retirada
      const itensSelecionados = codigoData.itens;
      const itensParaRetirar: ItemRetirada[] = [];

      for (const [nomeProduto, quantidade] of Object.entries(
        itensSelecionados
      )) {
        itensParaRetirar.push({
          nome_produto: nomeProduto,
          quantidade: quantidade as number,
        });
      }

      setItensRetirada(itensParaRetirar);

      setPedido({
        id: pedidoData.id,
        created_at: pedidoData.created_at,
        status: pedidoData.status,
        user_id: pedidoData.user_id,
        valor_total: pedidoData.valor_total,
        bar: {
          id: pedidoData.bar.id,
          name: pedidoData.bar.name,
          address: pedidoData.bar.address
        },
        itens: itensData.map((item: any) => ({
          ...item,
          quantidade_selecionada:
            itensSelecionados[item.nome_produto] || 0,
        })),
      });

      return true;
    } catch (error: any) {
      console.error("Erro ao verificar código:", error);
      setError("Ocorreu um erro ao verificar o código. Por favor, tente novamente.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const confirmarRetirada = async () => {
    try {
      if (!codigoId || !pedidoId) {
        throw new Error("Código ou pedido não identificado");
      }

      setIsLoading(true);

      // Marcar o código como usado
      const { error: updateCodigoError } = await supabaseExtended
        .from("codigos_retirada")
        .update({ usado: true })
        .eq("id", codigoId);

      if (updateCodigoError) {
        throw updateCodigoError;
      }

      // Para cada item retirado, atualizar a quantidade_restante no pedido_itens
      for (const itemRetirada of itensRetirada) {
        const itensPedido = pedido?.itens.filter(
          (item) => item.nome_produto === itemRetirada.nome_produto
        );

        if (!itensPedido || itensPedido.length === 0) continue;

        let quantidadeRestante = itemRetirada.quantidade;

        for (const item of itensPedido.sort((a, b) => a.id.localeCompare(b.id))) {
          if (quantidadeRestante <= 0) break;

          const quantidadeRetirada = Math.min(
            item.quantidade_restante,
            quantidadeRestante
          );
          const novaQuantidade = item.quantidade_restante - quantidadeRetirada;

          // Atualizar no banco de dados
          const { error } = await supabaseExtended
            .from("pedido_itens")
            .update({ quantidade_restante: novaQuantidade })
            .eq("id", item.id);

          if (error) throw error;

          quantidadeRestante -= quantidadeRetirada;
        }
      }

      setIsSuccess(true);
    } catch (error: any) {
      console.error("Erro ao confirmar retirada:", error);
      setError("Ocorreu um erro ao confirmar a retirada. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetarCodigo = () => {
    setCodigoInput("");
    setPedido(null);
    setItensRetirada([]);
    setIsSuccess(false);
    setPedidoId(null);
    setBarId(null);
    setCodigoId(null);
    setCodigoRetirada(null);
    setError(null);
  };

  return {
    codigo,
    loading,
    codigoRetirada,
    pedido,
    error,
    success,
    handleCodigo,
    verificarCodigo,
    confirmarRetirada,
    resetarCodigo,
    setCodigoInput,
    formatarPreco,
  };
};
