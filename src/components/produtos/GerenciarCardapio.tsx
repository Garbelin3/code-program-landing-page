
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
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-xl">Gerenciar Cardápio</CardTitle>
          <CardDescription>
            Adicione e gerencie os produtos do cardápio de {barName}
          </CardDescription>
        </div>
        <Button 
          onClick={() => setFormOpen(true)}
          className="flex items-center gap-1 bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="h-4 w-4" /> Adicionar Produto
        </Button>
      </CardHeader>
      <CardContent>
        <ListaProdutos barId={barId} />
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
