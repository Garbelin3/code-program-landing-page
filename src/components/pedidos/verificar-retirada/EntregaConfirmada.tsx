
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Check } from "lucide-react";

interface EntregaConfirmadaProps {
  onReset: () => void;
}

export const EntregaConfirmada = ({ onReset }: EntregaConfirmadaProps) => {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertTitle className="flex items-center text-green-600">
          <Check className="h-4 w-4 mr-2" />
          Retirada confirmada
        </AlertTitle>
        <AlertDescription>
          Os itens foram entregues com sucesso.
        </AlertDescription>
      </Alert>
      
      <Button variant="outline" className="w-full" onClick={onReset}>
        Verificar outro código
      </Button>
    </div>
  );
};
