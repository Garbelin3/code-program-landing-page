
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { ItemRetirada, PedidoBasic, CodigoRetirada } from "./types";
import { formatarData, formatarPreco } from "./utils";

interface DetalhesRetiradaProps {
  pedido: PedidoBasic;
  itensRetirados: ItemRetirada[]; // Deve ser itensRetirados, não itemRetirados
  codigoRetirada: CodigoRetirada;
  onConfirmar: () => void;
  loading: boolean;
}

export const DetalhesRetirada = ({ 
  pedido, 
  itensRetirados, // Deve ser itensRetirados, não itemRetirados
  codigoRetirada,
  onConfirmar,
  loading
}: DetalhesRetiradaProps) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          <div>
            <h3 className="font-semibold text-lg text-blue-900">Pedido #{pedido?.id.substring(0, 8)}</h3>
            <p className="text-sm text-blue-700">
              Realizado em {formatarData(pedido.created_at)}
            </p>
            <p className="text-sm mt-1 font-medium">
              Local: {pedido.bars.name}
            </p>
            <p className="text-xs text-gray-500">
              {pedido.bars.address}
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
          {itemRetirados && itemRetirados.length > 0 ? (
            itemRetirados.map((item, i) => (
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
      
      <Button 
        className="w-full" 
        onClick={onConfirmar}
        disabled={loading}
      >
        <Check className="mr-2 h-4 w-4" />
        Confirmar entrega
      </Button>
    </div>
  );
};
