import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ProdutoForm } from "./ProdutoForm";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Edit, Trash } from "lucide-react";

interface Produto {
  id: string;
  nome: string;
  descricao: string | null;
  preco: number;
  categoria: string;
  ativo: boolean;
}

interface ListaProdutosProps {
  barId: string;
}

export function ListaProdutos({ barId }: ListaProdutosProps) {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [produtoParaEditar, setProdutoParaEditar] = useState<Produto | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [produtoParaDeletar, setProdutoParaDeletar] = useState<Produto | null>(null);

  const fetchProdutos = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("bar_id", barId)
        .order("categoria")
        .order("nome");

      if (error) {
        throw error;
      }

      setProdutos(data || []);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar produtos",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos();
  }, [barId]);

  const handleEditar = (produto: Produto) => {
    setProdutoParaEditar(produto);
    setEditModalOpen(true);
  };

  const handleExcluir = (produto: Produto) => {
    setProdutoParaDeletar(produto);
    setDeleteModalOpen(true);
  };

  const confirmarExclusao = async () => {
    if (!produtoParaDeletar) return;
    
    try {
      const { error } = await supabase
        .from("produtos")
        .delete()
        .eq("id", produtoParaDeletar.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Produto excluído",
        description: `${produtoParaDeletar.nome} foi removido do cardápio`
      });

      fetchProdutos();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir produto",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setDeleteModalOpen(false);
      setProdutoParaDeletar(null);
    }
  };

  const formatarPreco = (preco: number) => {
    return preco.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <>
      {produtos.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="border rounded-md min-w-[400px]">
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead className="w-[120px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {produtos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm sm:text-base">{produto.nome}</p>
                      {produto.descricao && (
                        <p className="text-xs text-gray-500 mt-1 truncate max-w-[180px] sm:max-w-[250px]">
                          {produto.descricao}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-xs sm:text-base">{produto.categoria}</TableCell>
                  <TableCell className="text-xs sm:text-base">{formatarPreco(produto.preco)}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditar(produto)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleExcluir(produto)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <p className="text-gray-500">Nenhum produto cadastrado</p>
          <p className="text-sm mt-2">Clique em "Adicionar Produto" para começar</p>
        </div>
      )}

      {/* Formulário de edição */}
      {produtoParaEditar && (
        <ProdutoForm
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          barId={barId}
          produtoAtual={{
            id: produtoParaEditar.id,
            nome: produtoParaEditar.nome,
            descricao: produtoParaEditar.descricao || undefined,
            preco: produtoParaEditar.preco,
            categoria: produtoParaEditar.categoria
          }}
          onProdutoCadastrado={fetchProdutos}
        />
      )}

      {/* Modal de confirmação de exclusão */}
      <Sheet open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Excluir Produto</SheetTitle>
            <SheetDescription>
              Tem certeza que deseja excluir {produtoParaDeletar?.nome}? Essa ação não pode ser desfeita.
            </SheetDescription>
          </SheetHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button 
              variant="outline" 
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmarExclusao}
            >
              Excluir
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
