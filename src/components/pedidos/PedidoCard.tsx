
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pedido } from "@/types/pedidos";

interface PedidoCardProps {
  pedido: Pedido;
  formatarPreco: (preco: number) => string;
  formatarData: (dataString: string) => string;
}

export const PedidoCard = ({ 
  pedido, 
  formatarPreco, 
  formatarData 
}: PedidoCardProps) => {
  // Verificar se há itens disponíveis para retirada
  const temItensDisponiveis = pedido.itens.some(item => item.quantidade_restante > 0);
  const totalItensDisponiveis = pedido.itens.reduce((total, item) => total + item.quantidade_restante, 0);

  return (
    <Card key={pedido.id} className="overflow-hidden">
      <CardHeader className="bg-purple-50">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{formatarData(pedido.created_at)}</CardTitle>
            <CardDescription className="text-purple-700">
              {pedido.bar.name}
            </CardDescription>
          </div>
          <div className="text-right">
            <p className="font-bold">{formatarPreco(pedido.valor_total)}</p>
            {temItensDisponiveis && (
              <span className="text-sm text-green-600">
                {totalItensDisponiveis} {totalItensDisponiveis === 1 ? 'item disponível' : 'itens disponíveis'}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <h3 className="font-semibold text-lg mb-3">Itens do pedido</h3>
        
        <div className="space-y-3">
          {pedido.itens.slice(0, 3).map((item) => (
            <div key={item.id} className="flex justify-between items-center">
              <div>
                <p>{item.nome_produto}</p>
                <p className="text-sm text-gray-500">
                  Quantidade: {item.quantidade} | Disponível: {item.quantidade_restante}
                </p>
              </div>
              <p className="font-medium">{formatarPreco(item.preco_unitario * item.quantidade)}</p>
            </div>
          ))}
          
          {pedido.itens.length > 3 && (
            <p className="text-sm text-gray-500 italic">
              E mais {pedido.itens.length - 3} {pedido.itens.length - 3 === 1 ? 'item' : 'itens'}...
            </p>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button 
          variant="outline" 
          className="w-full"
          asChild
        >
          <Link to={`/pedido/${pedido.id}`}>
            Ver detalhes
          </Link>
        </Button>
        
        {temItensDisponiveis && (
          <Button 
            className="w-full"
            asChild
          >
            <Link to={`/pedido/${pedido.id}/retirar`}>
              Retirar itens
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
