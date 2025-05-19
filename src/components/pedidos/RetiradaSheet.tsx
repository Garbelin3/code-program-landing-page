
import { useState } from "react";
import { ShoppingBag, Clipboard } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Pedido } from "@/types/pedidos";
import { ItemAgregado } from "@/types/pedidos";
import { QRCodeSVG } from "qrcode.react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription, 
  SheetFooter 
} from "@/components/ui/sheet";
import { RetirarQuantidadeSelector } from "./RetirarQuantidadeSelector";

interface RetiradaSheetProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedPedido: Pedido | null;
  itensAgregados: ItemAgregado[];
  itensSelecionados: Record<string, number>;
  codigoRetirada: string;
  qrVisible: boolean;
  onConfirmarRetirada: () => void;
  onClose: () => void;
  setItensSelecionados: (itens: Record<string, number>) => void;
}

export const RetiradaSheet = ({
  open,
  setOpen,
  selectedPedido,
  itensAgregados,
  itensSelecionados,
  codigoRetirada,
  qrVisible,
  onConfirmarRetirada,
  onClose,
  setItensSelecionados
}: RetiradaSheetProps) => {
  const handleQuantidadeChange = (nomeProduto: string, value: string) => {
    const quantidade = parseInt(value);
    
    setItensSelecionados({
      ...itensSelecionados,
      [nomeProduto]: quantidade
    });
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(codigoRetirada);
    toast({
      title: "Código copiado",
      description: "O código de retirada foi copiado para a área de transferência."
    });
  };

  // Generate data for QR code in JSON format
  const qrCodeData = JSON.stringify({
    codigo: codigoRetirada,
    pedido_id: selectedPedido?.id || "",
    itens: itensSelecionados
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Retirar pedido</SheetTitle>
          <SheetDescription>
            Selecione os itens e a quantidade que deseja retirar agora.
          </SheetDescription>
        </SheetHeader>
        
        {!qrVisible ? (
          <>
            <div className="py-4">
              {itensAgregados.length > 0 ? (
                itensAgregados.map((item) => (
                  <RetirarQuantidadeSelector 
                    key={item.nome_produto}
                    item={item}
                    selectedValue={itensSelecionados[item.nome_produto]?.toString() || "0"}
                    onValueChange={(value) => handleQuantidadeChange(item.nome_produto, value)}
                  />
                ))
              ) : (
                <p className="text-center py-4 text-gray-500">Não há itens disponíveis para retirada</p>
              )}
            </div>
            
            <SheetFooter className="pt-4">
              <Button 
                className="w-full" 
                onClick={onConfirmarRetirada}
                disabled={Object.keys(itensSelecionados).length === 0 || 
                  Object.values(itensSelecionados).every(v => v === 0)}
              >
                Gerar código de retirada
              </Button>
            </SheetFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <QRCodeSVG 
                value={qrCodeData}
                size={200}
                bgColor={"#ffffff"}
                fgColor={"#000000"}
                level={"L"}
                className="mx-auto"
              />
            </div>
            
            <div className="text-center mb-6">
              <p className="text-gray-500 mb-1">Código de retirada</p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-2xl font-bold tracking-wider">{codigoRetirada}</p>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8" 
                  onClick={copiarCodigo}
                >
                  <Clipboard className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <p className="text-center text-sm text-gray-500 mb-8">
              Apresente este código ao atendente para retirar seus itens.
            </p>
            
            <Button 
              variant="outline" 
              onClick={onClose}
            >
              Concluir
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
