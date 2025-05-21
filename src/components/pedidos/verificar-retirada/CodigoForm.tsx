
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import React from "react";

interface CodigoFormProps {
  codigoInput: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
  error: string | null;
  loading: boolean;
  disableValidation?: boolean;
}

export const CodigoForm = ({
  codigoInput,
  onChange,
  onSubmit,
  error,
  loading,
  disableValidation = false
}: CodigoFormProps) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulário submetido, código:", codigoInput);
    onSubmit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Input
          type="text"
          placeholder="Digite o código de 6 dígitos"
          value={codigoInput}
          onChange={onChange}
          maxLength={6}
          className="text-center text-lg tracking-widest"
          disabled={loading}
          autoFocus
        />
        
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
      
      <Button 
        type="submit" 
        className="w-full"
        disabled={loading || (!disableValidation && (!codigoInput || codigoInput.length !== 6))}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
        Verificar
      </Button>
    </form>
  );
};
