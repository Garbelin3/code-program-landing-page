
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface CodigoFormProps {
  codigoInput: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  error: string | null;
  loading: boolean;
}

export const CodigoForm = ({ 
  codigoInput, 
  onChange, 
  onSubmit, 
  error, 
  loading 
}: CodigoFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Digite o código de 6 dígitos"
          value={codigoInput}
          onChange={onChange}
          className="flex-1"
          maxLength={6}
        />
        <Button onClick={onSubmit} disabled={loading}>
          Verificar
        </Button>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};
