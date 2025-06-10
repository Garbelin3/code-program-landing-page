
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
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 via-transparent to-black/30"></div>
        <div className="relative z-10 p-4 flex justify-center items-center min-h-screen">
          <p className="text-lg text-white/80">Carregando pedidos...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 via-transparent to-black/30"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="outline" 
            asChild
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 backdrop-blur-md"
          >
            <Link to="/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Link>
          </Button>
          
          <h1 className="text-2xl font-bold text-white">Meus Pedidos</h1>
        </div>
        
        <Tabs defaultValue="retirada" className="w-full mb-6">
          <TabsList className="flex flex-wrap w-full mb-4 overflow-x-auto bg-white/10 backdrop-blur-md border border-white/20">
            <TabsTrigger 
              className="flex-1 min-w-[100px] data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70" 
              value="retirada"
            >
              Retirar
            </TabsTrigger>
            <TabsTrigger 
              className="flex-1 min-w-[100px] data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70" 
              value="codigos"
            >
              Códigos
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="retirada">
            <BarCardapioView onGerarCodigo={gerarCodigoParaBar} />
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
