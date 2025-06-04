
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Trash2, Minus, Plus, ShoppingCart } from 'lucide-react';
import type { ItemCarrinho } from '@/types/pdv';

interface CarrinhoItensProps {
  itens: ItemCarrinho[];
  onRemoverItem: (produtoId: string) => void;
  onAlterarQuantidade: (produtoId: string, quantidade: number) => void;
  onLimparCarrinho: () => void;
}

export const CarrinhoItens = ({
  itens,
  onRemoverItem,
  onAlterarQuantidade,
  onLimparCarrinho
}: CarrinhoItensProps) => {
  const calcularTotal = () => {
    return itens.reduce((total, item) => total + (item.preco * item.quantidade), 0);
  };

  if (itens.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground">Carrinho vazio</p>
        <p className="text-sm text-muted-foreground">Adicione produtos do cardápio</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Botão para limpar carrinho */}
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Itens no carrinho</span>
        <Button
          variant="outline"
          size="sm"
          onClick={onLimparCarrinho}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Limpar
        </Button>
      </div>

      {/* Lista de itens */}
      <div className="space-y-3 max-h-64 overflow-y-auto">
        {itens.map(item => (
          <div key={item.produto_id} className="flex items-center gap-2 p-2 border rounded-lg">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{item.nome}</h4>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {item.categoria}
                </Badge>
                <span className="text-sm text-green-600 font-medium">
                  R$ {item.preco.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAlterarQuantidade(item.produto_id, item.quantidade - 1)}
                className="h-7 w-7 p-0"
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <Input
                type="number"
                value={item.quantidade}
                onChange={(e) => {
                  const novaQuantidade = parseInt(e.target.value) || 1;
                  onAlterarQuantidade(item.produto_id, novaQuantidade);
                }}
                className="w-16 h-7 text-center text-sm"
                min="1"
              />
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onAlterarQuantidade(item.produto_id, item.quantidade + 1)}
                className="h-7 w-7 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="text-right min-w-0">
              <div className="font-medium text-sm">
                R$ {(item.preco * item.quantidade).toFixed(2)}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoverItem(item.produto_id)}
                className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Separator />

      {/* Total */}
      <div className="flex justify-between items-center font-bold text-lg">
        <span>Total:</span>
        <span className="text-green-600">R$ {calcularTotal().toFixed(2)}</span>
      </div>
    </div>
  );
};
