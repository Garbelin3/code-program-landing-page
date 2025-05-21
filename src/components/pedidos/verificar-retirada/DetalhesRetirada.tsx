
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, RefreshCw } from "lucide-react";
import { ItemRetirada, PedidoBasic, CodigoRetirada } from "./types";
import { formatarData, formatarPreco } from "./utils";

interface DetalhesRetiradaProps {
  pedido: PedidoBasic | null; // Alterado para aceitar null
  itensRetirados: ItemRetirada[];
  codigoRetirada: CodigoRetirada;
  onConfirmar: () => void;
  onReset: () => void;
  loading: boolean;
}

export const DetalhesRetirada = ({ 
  pedido, 
  itensRetirados, 
  codigoRetirada,
  onConfirmar,
  onReset,
  loading
}: DetalhesRetiradaProps) => {
  // Verificação de segurança para evitar o erro
  if (!pedido) {
    return (
      <div className="space-y-6">
        <div className="p-4 text-center text-gray-500">
          Carregando detalhes do pedido...
        </div>
        
        <div>
          <h3 className="font-medium text-lg mb-2">Itens para retirada</h3>
          <div className="border rounded-md divide-y">
            {itensRetirados && itensRetirados.length > 0 ? (
              itensRetirados.map((item, i) => (
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
        
        <div className="space-y-3">
          <Button 
            className="w-full" 
            onClick={onConfirmar}
            disabled={loading}
          >
            <Check className="mr-2 h-4 w-4" />
            Confirmar entrega
          </Button>
          
        </div>
      </div>
    );
  }
  
  // Renderização normal quando pedido não é null
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
          <div>
            <h3 className="font-semibold text-lg text-blue-900">Pedido #{pedido.id.substring(0, 8)}</h3>
            <p className="text-sm text-blue-700">
              Realizado em {formatarData(pedido.created_at)}
            </p>
            <p className="text-sm mt-1 font-medium">
              Local: {pedido.bar.name}
            </p>
            <p className="text-xs text-gray-500">
              {pedido.bar.address}
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
          {itensRetirados && itensRetirados.length > 0 ? (
            itensRetirados.map((item, i) => (
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
      
      <div className="space-y-3">
        <Button 
          className="w-full" 
          onClick={onConfirmar}
          disabled={loading}
        >
          <Check className="mr-2 h-4 w-4" />
          Confirmar entrega
        </Button>
        
      </div>
    </div>
  );
};
