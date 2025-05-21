
import { Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PedidoCard } from "@/components/pedidos/PedidoCard";
import { EmptyPedidos } from "@/components/pedidos/EmptyPedidos";
import { RetiradaSheet } from "@/components/pedidos/RetiradaSheet";
import { usePedidos } from "@/hooks/usePedidos";
import { usePedidosPendentes } from "@/hooks/usePedidosPendentes";
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
    setItensSelecionados
  } = usePedidos();
  
  const {
    pedidosPendentes,
    loadingPendentes,
    formatarPreco: formatarPrecoPendentes,
    formatarData: formatarDataPendentes,
    retomarPagamento
  } = usePedidosPendentes();
  
  if (loading && loadingPendentes) {
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
        
        <Tabs defaultValue="pedidos" className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="pedidos">Pedidos concluídos</TabsTrigger>
            <TabsTrigger value="pendentes">Pedidos pendentes</TabsTrigger>
          </TabsList>
          
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
          
          <TabsContent value="pendentes">
            {pedidosPendentes.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Nenhum pedido pendente</h3>
                <p className="text-sm text-gray-500 mt-2">
                  Você não tem nenhum pedido aguardando pagamento.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {pedidosPendentes.map((pedido) => (
                  <Card key={pedido.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold">{pedido.bar.name}</h3>
                        <p className="text-sm text-gray-500">{formatarDataPendentes(pedido.created_at)}</p>
                        <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Aguardando pagamento
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">{formatarPrecoPendentes(pedido.valor_total)}</p>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="text-sm font-medium mb-2">Itens do pedido:</h4>
                      <ul className="text-sm text-gray-600">
                        {pedido.itens.map((item, index) => (
                          <li key={index} className="flex justify-between mb-1">
                            <span>{item.quantidade}x {item.nome_produto}</span>
                            <span>{formatarPrecoPendentes(item.preco_unitario * item.quantidade)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button 
                        onClick={() => retomarPagamento(pedido.id)}
                        className="w-full"
                      >
                        Retomar pagamento
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
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
