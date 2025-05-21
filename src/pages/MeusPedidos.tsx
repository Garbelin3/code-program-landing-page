import { Link } from "react-router-dom";
import { ArrowLeft, Clock, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PedidoCard } from "@/components/pedidos/PedidoCard";
import { EmptyPedidos } from "@/components/pedidos/EmptyPedidos";
import { RetiradaSheet } from "@/components/pedidos/RetiradaSheet";
import { MeusCodigosTab } from "@/components/pedidos/MeusCodigosTab";
import { BarCardapioView } from "@/components/pedidos/BarCardapioView";
import { usePedidos } from "@/hooks/usePedidos";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

const MeusPedidos = () => {
  const { 
    pedidos, 
    loading, 
    selectedPedido,
    itensSelecionados,
    retirarSheetOpen,
    codigoRetirada,
    qrVisible,
    itensAgregados,
    formatarPreco,
    formatarData,
    iniciarRetirada,
    confirmarRetirada,
    fecharSheet,
    setRetirarSheetOpen,
    setItensSelecionados,
    gerarCodigoParaBar
  } = usePedidos();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex justify-center items-center">
        <p className="text-lg text-gray-600">Carregando pedidos...</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            asChild
          >
            <Link to="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
          
          <h1 className="text-2xl font-bold">Meus Pedidos</h1>
        </div>
        
        <Tabs defaultValue="retirada" className="w-full mb-6">
          <TabsList className="flex flex-wrap w-full mb-4 overflow-x-auto">
            <TabsTrigger className="flex-1 min-w-[100px]" value="retirada">Retirar</TabsTrigger>
            {/* <TabsTrigger className="flex-1 min-w-[100px]" value="pedidos">Pedidos</TabsTrigger> */}
            <TabsTrigger className="flex-1 min-w-[100px]" value="codigos">Códigos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="retirada">
            <BarCardapioView onGerarCodigo={gerarCodigoParaBar} />
          </TabsContent>
          
          <TabsContent value="pedidos">
            {pedidos.length === 0 ? (
              <EmptyPedidos />
            ) : (
              <div className="space-y-6">
                {pedidos.map((pedido) => (
                  <PedidoCard
                    key={pedido.id}
                    pedido={pedido}
                    iniciarRetirada={iniciarRetirada}
                    formatarPreco={formatarPreco}
                    formatarData={formatarData}
                  />
                ))}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="codigos">
            <MeusCodigosTab />
          </TabsContent>
        </Tabs>
      </div>
      
      <RetiradaSheet 
        open={retirarSheetOpen}
        setOpen={setRetirarSheetOpen}
        selectedPedido={selectedPedido}
        itensAgregados={itensAgregados}
        itensSelecionados={itensSelecionados}
        codigoRetirada={codigoRetirada}
        qrVisible={qrVisible}
        onConfirmarRetirada={confirmarRetirada}
        onClose={fecharSheet}
        setItensSelecionados={setItensSelecionados}
      />
    </div>
  );
};

export default MeusPedidos;
