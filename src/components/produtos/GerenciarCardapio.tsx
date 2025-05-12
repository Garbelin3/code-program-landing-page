import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { ProdutoForm } from "./ProdutoForm";
import { ListaProdutos } from "./ListaProdutos";

interface GerenciarCardapioProps {
  barId: string;
  barName: string;
}

export function GerenciarCardapio({ barId, barName }: GerenciarCardapioProps) {
  const [formOpen, setFormOpen] = useState(false);
  
  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pb-2">
        <div>
          <CardTitle className="text-xl sm:text-2xl">Gerenciar Cardápio</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            Adicione e gerencie os produtos do cardápio de {barName}
          </CardDescription>
        </div>
        <Button 
          onClick={() => setFormOpen(true)}
          className="w-full sm:w-auto flex items-center gap-1 bg-purple-600 hover:bg-purple-700 mt-2 sm:mt-0"
        >
          <Plus className="h-4 w-4" /> Adicionar Produto
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <ListaProdutos barId={barId} />
        </div>
      </CardContent>
      
      <ProdutoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        barId={barId}
        onProdutoCadastrado={() => {}}
      />
    </Card>
  );
}
