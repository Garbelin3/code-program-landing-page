
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { useToast } from "@/hooks/use-toast";
import { formatarPreco } from "./utils";

interface Item {
  id: string;
  nome_produto: string;
  quantidade: number;
  quantidade_restante: number;
  preco_unitario: number;
  quantidade_selecionada?: number;
}

interface ItemRetirada {
  produto: string;
  quantidade: number;
}

interface InfoPedido {
  valor_total: number;
  bar_id: string;
  bar_name: string;
  bar_address: string;
  itens: Item[];
}

export const useCodigoRetirada = () => {
  const { toast } = useToast();
  const [codigo, setCodigo] = useState("");
  const [pedido, setPedido] = useState<InfoPedido | null>(null);
  const [itensRetirada, setItensRetirada] = useState<ItemRetirada[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [barId, setBarId] = useState<string | null>(null);
  const [codigoId, setCodigoId] = useState<string | null>(null);

  const handleCodigo = async (input: string) => {
    setCodigo(input);
  };

  const verificarCodigo = async () => {
    try {
      if (!codigo || codigo.length < 6) {
        toast({
          title: "Código inválido",
          description: "Por favor, insira um código de 6 dígitos",
          variant: "destructive",
        });
        return false;
      }

      setIsLoading(true);

      // Buscar o código na tabela de codigos_retirada
      const { data: codigoData, error: codigoError } = await supabaseExtended
        .from("codigos_retirada")
        .select("*")
        .eq("codigo", codigo)
        .eq("usado", false)
        .eq("invalidado", false)
        .maybeSingle();

      if (codigoError) {
        throw codigoError;
      }

      if (!codigoData) {
        toast({
          title: "Código inválido",
          description: "Este código não existe ou já foi utilizado",
          variant: "destructive",
        });
        return false;
      }

      setCodigoId(codigoData.id);
      setPedidoId(codigoData.pedido_id);

      // Buscar informações do pedido
      const { data: pedidoData, error: pedidoError } = await supabaseExtended
        .from("pedidos")
        .select(`
          id,
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
          produto: nomeProduto,
          quantidade: quantidade as number,
        });
      }

      setItensRetirada(itensParaRetirar);

      setPedido({
        valor_total: pedidoData.valor_total,
        bar_id: pedidoData.bar_id,
        bar_name: pedidoData.bar?.name || "",
        bar_address: pedidoData.bar?.address || "",
        itens: itensData.map((item) => ({
          ...item,
          quantidade_selecionada:
            itensSelecionados[item.nome_produto] || 0,
        })),
      });

      return true;
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      toast({
        title: "Erro ao verificar código",
        description:
          "Ocorreu um erro ao verificar o código. Por favor, tente novamente.",
        variant: "destructive",
      });
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
          (item) => item.nome_produto === itemRetirada.produto
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
    } catch (error) {
      console.error("Erro ao confirmar retirada:", error);
      toast({
        title: "Erro ao confirmar retirada",
        description:
          "Ocorreu um erro ao confirmar a retirada. Por favor, tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetarCodigo = () => {
    setCodigo("");
    setPedido(null);
    setItensRetirada([]);
    setIsSuccess(false);
    setPedidoId(null);
    setBarId(null);
    setCodigoId(null);
  };

  return {
    codigo,
    handleCodigo,
    verificarCodigo,
    confirmarRetirada,
    resetarCodigo,
    pedido,
    itensRetirada,
    isLoading,
    isSuccess,
    formatarPreco,
  };
};
