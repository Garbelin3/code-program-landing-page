
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

const produtoSchema = z.object({
  nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  descricao: z.string().optional(),
  preco: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Preço deve ser um número positivo"
  }),
  categoria: z.string().min(1, "Selecione uma categoria")
});

type ProdutoFormValues = z.infer<typeof produtoSchema>;

interface ProdutoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barId: string;
  produtoAtual?: {
    id: string;
    nome: string;
    descricao?: string;
    preco: number;
    categoria: string;
  };
  onProdutoCadastrado: () => void;
}

const categorias = [
  "Bebidas",
  "Comidas",
  "Petiscos",
  "Sobremesas",
  "Promoções",
  "Outros"
];

export function ProdutoForm({ 
  open, 
  onOpenChange, 
  barId,
  produtoAtual,
  onProdutoCadastrado
}: ProdutoFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const isEditing = !!produtoAtual;

  const form = useForm<ProdutoFormValues>({
    resolver: zodResolver(produtoSchema),
    defaultValues: {
      nome: produtoAtual?.nome || "",
      descricao: produtoAtual?.descricao || "",
      preco: produtoAtual?.preco ? String(produtoAtual.preco) : "",
      categoria: produtoAtual?.categoria || ""
    }
  });

  const onSubmit = async (data: ProdutoFormValues) => {
    setSubmitting(true);
    try {
      const produtoData = {
        nome: data.nome,
        descricao: data.descricao || null,
        preco: parseFloat(data.preco),
        categoria: data.categoria,
        bar_id: barId,
      };

      let resultado;
      
      if (isEditing) {
        resultado = await supabase
          .from("produtos")
          .update(produtoData)
          .eq("id", produtoAtual.id);
      } else {
        resultado = await supabase
          .from("produtos")
          .insert(produtoData);
      }

      if (resultado.error) {
        throw resultado.error;
      }

      toast({
        title: isEditing ? "Produto atualizado" : "Produto cadastrado",
        description: isEditing 
          ? `${data.nome} foi atualizado com sucesso` 
          : `${data.nome} foi adicionado ao cardápio`,
      });
      
      onOpenChange(false);
      form.reset();
      onProdutoCadastrado();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Produto" : "Adicionar Produto ao Cardápio"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Produto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Cerveja Pilsen" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva o produto..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="preco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preço (R$)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      placeholder="0,00" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      {...field}
                    >
                      <option value="" disabled>Selecione uma categoria</option>
                      {categorias.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
              >
                {submitting 
                  ? "Salvando..." 
                  : isEditing ? "Atualizar Produto" : "Adicionar Produto"
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
