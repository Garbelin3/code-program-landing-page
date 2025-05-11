
import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ItemQuantidadeSelectorProps {
  max: number;
  value: number;
  onChange: (value: number) => void;
}

export const ItemQuantidadeSelector = ({ max, value, onChange }: ItemQuantidadeSelectorProps) => {
  const decrementar = () => {
    if (value > 0) {
      onChange(value - 1);
    }
  };
  
  const incrementar = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };
  
  return (
    <div className="flex items-center justify-center">
      <Button 
        variant="outline" 
        size="icon" 
        onClick={decrementar}
        disabled={value === 0}
        className="rounded-full h-8 w-8"
      >
        <Minus className="h-4 w-4" />
      </Button>
      
      <span className="mx-4 font-medium text-lg min-w-[40px] text-center">
        {value}
      </span>
      
      <Button 
        variant="outline"
        size="icon"
        onClick={incrementar}
        disabled={value >= max}
        className="rounded-full h-8 w-8"
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
};
