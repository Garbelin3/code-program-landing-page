
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ItemCarrinho } from '@/types/pdv';

interface Produto {
  id: string;
  nome: string;
  preco: number;
  categoria: string;
  descricao?: string;
  ativo: boolean;
}

interface CardapioSeletorProps {
  barId: string;
  onAdicionarItem: (produto: Omit<ItemCarrinho, 'quantidade'>) => void;
}

export const CardapioSeletor = ({ barId, onAdicionarItem }: CardapioSeletorProps) => {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('');

  useEffect(() => {
    const fetchProdutos = async () => {
      try {
        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .eq('bar_id', barId)
          .eq('ativo', true)
          .order('categoria')
          .order('nome');

        if (error) throw error;
        setProdutos(data || []);
      } catch (error: any) {
        console.error('Erro ao buscar produtos:', error);
        toast({
          title: 'Erro ao carregar produtos',
          description: error.message,
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProdutos();
  }, [barId]);

  const categorias = [...new Set(produtos.map(p => p.categoria))];
  
  const produtosFiltrados = produtos.filter(produto => {
    const matchBusca = produto.nome.toLowerCase().includes(busca.toLowerCase()) ||
                      produto.categoria.toLowerCase().includes(busca.toLowerCase());
    const matchCategoria = !categoriaFiltro || produto.categoria === categoriaFiltro;
    return matchBusca && matchCategoria;
  });

  const handleAdicionarProduto = (produto: Produto) => {
    onAdicionarItem({
      produto_id: produto.id,
      nome: produto.nome,
      preco: produto.preco,
      categoria: produto.categoria,
      descricao: produto.descricao
    });

    toast({
      title: 'Item adicionado',
      description: `${produto.nome} foi adicionado ao carrinho`,
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <p className="text-muted-foreground">Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Busca e Filtros */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={categoriaFiltro === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setCategoriaFiltro('')}
          >
            Todas
          </Button>
          {categorias.map(categoria => (
            <Button
              key={categoria}
              variant={categoriaFiltro === categoria ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCategoriaFiltro(categoria)}
            >
              {categoria}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
        {produtosFiltrados.map(produto => (
          <Card key={produto.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-medium text-sm">{produto.nome}</h3>
                  {produto.descricao && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {produto.descricao}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="ml-2 text-xs">
                  {produto.categoria}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg text-green-600">
                  R$ {produto.preco.toFixed(2)}
                </span>
                <Button
                  size="sm"
                  onClick={() => handleAdicionarProduto(produto)}
                  className="h-8 w-8 p-0"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {produtosFiltrados.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            {busca || categoriaFiltro ? 'Nenhum produto encontrado com os filtros aplicados' : 'Nenhum produto disponível'}
          </p>
        </div>
      )}
    </div>
  );
};
