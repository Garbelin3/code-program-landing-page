
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ItemAgregado } from "@/types/pedidos";

interface RetirarQuantidadeSelectorProps {
  item: ItemAgregado;
  selectedValue: string;
  onValueChange: (value: string) => void;
}

export const RetirarQuantidadeSelector = ({
  item,
  selectedValue,
  onValueChange
}: RetirarQuantidadeSelectorProps) => {
  return (
    <div className="py-4 border-b">
      <div className="flex justify-between mb-2">
        <p className="font-medium">{item.nome_produto}</p>
        <p className="text-sm text-gray-500">Disponível: {item.total_disponivel}</p>
      </div>
      
      <Select 
        value={selectedValue}
        onValueChange={onValueChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Quantidade" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="0">Selecione</SelectItem>
          {Array.from({ length: item.total_disponivel }, (_, i) => i + 1).map((num) => (
            <SelectItem key={num} value={num.toString()}>
              {num}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
