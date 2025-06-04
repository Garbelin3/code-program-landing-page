
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CardapioSeletor } from './CardapioSeletor';
import { CarrinhoItens } from './CarrinhoItens';
import { FinalizacaoPedido } from './FinalizacaoPedido';
import { HistoricoDia } from './HistoricoDia';
import { usePDV } from '@/hooks/usePDV';
import { ShoppingCart, History, Calculator } from 'lucide-react';

interface PainelCaixaProps {
  barId: string;
  barName: string;
}

export const PainelCaixa = ({ barId, barName }: PainelCaixaProps) => {
  const {
    carrinho,
    cliente,
    metodoPagamento,
    observacoes,
    finalizando,
    adicionarItem,
    removerItem,
    alterarQuantidade,
    limparCarrinho,
    calcularTotal,
    finalizarPedido,
    setCliente,
    setMetodoPagamento,
    setObservacoes
  } = usePDV(barId);

  const [codigoGerado, setCodigoGerado] = useState<string>('');

  const handleFinalizarPedido = async () => {
    const codigo = await finalizarPedido();
    if (codigo) {
      setCodigoGerado(codigo);
    }
  };

  const valorTotal = calcularTotal();
  const quantidadeItens = carrinho.reduce((total, item) => total + item.quantidade, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            PDV - {barName}
          </h1>
          <p className="text-gray-600 mt-1">Painel do Caixa para pedidos presenciais</p>
        </div>

        <Tabs defaultValue="venda" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-auto">
            <TabsTrigger value="venda" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Nova Venda
              {quantidadeItens > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {quantidadeItens}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico do Dia
            </TabsTrigger>
          </TabsList>

          <TabsContent value="venda">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna 1: Cardápio */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Cardápio</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardapioSeletor 
                      barId={barId} 
                      onAdicionarItem={adicionarItem} 
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Coluna 2: Carrinho e Finalização */}
              <div className="space-y-6">
                {/* Carrinho */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      Carrinho
                      <Badge variant="outline">
                        {quantidadeItens} {quantidadeItens === 1 ? 'item' : 'itens'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CarrinhoItens
                      itens={carrinho}
                      onRemoverItem={removerItem}
                      onAlterarQuantidade={alterarQuantidade}
                      onLimparCarrinho={limparCarrinho}
                    />
                  </CardContent>
                </Card>

                {/* Finalização */}
                {carrinho.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Finalizar Pedido</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <FinalizacaoPedido
                        valorTotal={valorTotal}
                        cliente={cliente}
                        metodoPagamento={metodoPagamento}
                        observacoes={observacoes}
                        finalizando={finalizando}
                        codigoGerado={codigoGerado}
                        onClienteChange={setCliente}
                        onMetodoPagamentoChange={setMetodoPagamento}
                        onObservacoesChange={setObservacoes}
                        onFinalizar={handleFinalizarPedido}
                        onNovoAtendimento={() => {
                          setCodigoGerado('');
                          limparCarrinho();
                        }}
                      />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="historico">
            <HistoricoDia barId={barId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
