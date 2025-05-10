
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pedido } from "@/types/pedidos";

interface PedidoCardProps {
  pedido: Pedido;
  iniciarRetirada: (pedido: Pedido) => void;
  formatarPreco: (preco: number) => string;
  formatarData: (dataString: string) => string;
}

export const PedidoCard = ({ 
  pedido, 
  iniciarRetirada, 
  formatarPreco, 
  formatarData 
}: PedidoCardProps) => {
  // Verificar se há itens disponíveis para retirada
  const temItensDisponiveis = pedido.itens.some(item => item.quantidade_restante > 0);

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
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        <h3 className="font-semibold text-lg mb-3">Itens do pedido</h3>
        
        <div className="space-y-3">
          {pedido.itens.map((item) => (
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
        </div>
      </CardContent>
      
      <CardFooter>
        <Button 
          disabled={!temItensDisponiveis} 
          className="w-full"
          onClick={() => iniciarRetirada(pedido)}
        >
          {temItensDisponiveis ? "Retirar pedido" : "Todos os itens retirados"}
        </Button>
      </CardFooter>
    </Card>
  );
};
