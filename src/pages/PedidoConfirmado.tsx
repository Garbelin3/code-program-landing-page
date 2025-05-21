import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { supabaseExtended } from '@/integrations/supabase/customClient';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check, Clock } from 'lucide-react';
import QRCode from 'qrcode.react';
import { Bar } from '@/types/pedidos';
import { useToast } from '@/hooks/use-toast';
import { formatarPreco } from '@/components/pedidos/verificar-retirada/utils';

interface PedidoItem {
  id: string;
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
}

interface SimplePedido {
  id: string;
  created_at: string;
  valor_total: number;
  status?: string;
  data_pagamento?: string;
  stripe_session_id?: string;
  bar: Bar;
  itens: PedidoItem[];
}

const PedidoConfirmado = () => {
  const { pedidoId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pedido, setPedido] = useState<SimplePedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificandoPagamento, setVerificandoPagamento] = useState(true);
  const [statusPagamento, setStatusPagamento] = useState<string | null>(null);
  const [codigoRetirada, setCodigoRetirada] = useState<string | null>(null);

  useEffect(() => {
    const verificarStatusPagamento = async () => {
      if (!pedidoId) return;
      
      try {
        setVerificandoPagamento(true);
        
        // Verificar se o pedido existe e seu status atual
        const { data: pedidoData, error: pedidoError } = await supabaseExtended
          .from('pedidos')
          .select('status')
          .eq('id', pedidoId)
          .maybeSingle();
          
        if (pedidoError) throw pedidoError;
        
        if (!pedidoData) {
          toast({
            title: 'Pedido não encontrado',
            description: 'Não foi possível encontrar o pedido',
            variant: 'destructive'
          });
          navigate('/meus-pedidos');
          return;
        }
        
        setStatusPagamento(pedidoData.status);
        
        // Se o status ainda for "aguardando_pagamento", verificar com o Stripe
        if (pedidoData.status === 'aguardando_pagamento') {
          // Verificar status do pagamento com o Stripe
          const { data: verificationData, error: verificationError } = await supabase.functions.invoke(
            "verify-payment",
            {
              body: {
                pedidoId: pedidoId
              }
            }
          );
          
          if (verificationError) {
            console.error("Erro ao verificar pagamento:", verificationError);
          } else if (verificationData?.status === 'paid') {
            // Atualizar status do pedido para "pago"
            await supabaseExtended
              .from('pedidos')
              .update({ 
                status: 'pago',
                data_pagamento: new Date().toISOString()
              })
              .eq('id', pedidoId);
              
            setStatusPagamento('pago');
            
            toast({
              title: 'Pagamento confirmado',
              description: 'Seu pagamento foi confirmado com sucesso!'
            });
          }
        }
      } catch (error) {
        console.error("Erro ao verificar status do pagamento:", error);
      } finally {
        setVerificandoPagamento(false);
      }
    };
    
    verificarStatusPagamento();
  }, [pedidoId, navigate, toast]);

  useEffect(() => {
    const fetchPedido = async () => {
      if (!pedidoId) return;

      try {
        setLoading(true);
        
        // Buscar pedido com informações do bar
        const { data: pedidoData, error: pedidoError } = await supabase
          .from('pedidos')
          .select('*, bar:bar_id(*)')
          .eq('id', pedidoId)
          .maybeSingle();

        if (pedidoError) throw pedidoError;
        
        if (!pedidoData) {
          toast({
            title: 'Erro',
            description: 'Pedido não encontrado',
            variant: 'destructive'
          });
          setLoading(false);
          return;
        }

        // Buscar itens do pedido
        const { data: itensData, error: itensError } = await supabase
          .from('pedido_itens')
          .select('*')
          .eq('pedido_id', pedidoId);

        if (itensError) throw itensError;

        // Buscar código de retirada
        const { data: codigoData, error: codigoError } = await supabase
          .from('codigos_retirada')
          .select('codigo')
          .eq('pedido_id', pedidoId)
          .eq('usado', false)
          .eq('invalidado', false)
          .maybeSingle();

        // Ignorar erro específico de "nenhuma linha encontrada"
        if (codigoError && codigoError.code !== 'PGRST116') {
          throw codigoError;
        }

        // Format the pedido data with its items
        const fullPedido: SimplePedido = {
          ...pedidoData,
          itens: itensData || [],
          bar: {
            id: pedidoData.bar?.id || "",
            name: pedidoData.bar?.name || "",
            address: pedidoData.bar?.address || ""
          }
        };

        console.log("Dados completos do pedido:", fullPedido);
        setPedido(fullPedido);
        setCodigoRetirada(codigoData?.codigo || null);
      } catch (error) {
        console.error('Erro ao buscar dados do pedido:', error);
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados do pedido',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPedido();
  }, [pedidoId, toast]);

  const handleVoltar = () => {
    navigate('/meus-pedidos');
  };

  if (loading || verificandoPagamento) {
    return (
      <div className="container mx-auto p-4 h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="mx-auto h-12 w-12 text-gray-400 animate-pulse" />
          <h2 className="mt-4 text-xl font-semibold">
            {verificandoPagamento ? "Verificando status do pagamento..." : "Carregando detalhes do pedido..."}
          </h2>
        </div>
      </div>
    );
  }

  // Se o pagamento ainda estiver pendente
  if (statusPagamento === 'aguardando_pagamento') {
    return (
      <div className="container mx-auto p-4">
        <Button variant="ghost" onClick={handleVoltar} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-yellow-500" />
          <h1 className="text-2xl font-bold text-yellow-800 mt-4">Pagamento em Processamento</h1>
          <p className="mt-2 text-yellow-700">
            Estamos aguardando a confirmação do seu pagamento.
          </p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
          >
            Verificar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700">Pedido não encontrado</h2>
          <p className="mt-2 text-red-600">Não foi possível encontrar os detalhes deste pedido.</p>
          <Button onClick={handleVoltar} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  const barName = pedido?.bar ? pedido.bar.name : "Bar";
  const barAddress = pedido?.bar ? pedido.bar.address : "Endereço do bar";

  return (
    <div className="container mx-auto p-4">
      <Button variant="ghost" onClick={handleVoltar} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </Button>

      <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
        <Check className="mx-auto h-12 w-12 text-green-500" />
        <h1 className="text-2xl font-bold text-green-800 mt-4">Pedido Confirmado!</h1>
        <p className="mt-2 text-green-700">
          Seu pedido foi recebido pelo estabelecimento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Detalhes do Pedido #{pedidoId?.substring(0, 8)}</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Estabelecimento</h3>
              <p className="text-gray-900">{barName}</p>
              <p className="text-sm text-gray-500">{barAddress}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700">Valor Total</h3>
              <p className="text-gray-900">{formatarPreco(pedido.valor_total)}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700">Itens</h3>
              <ul className="divide-y">
                {pedido.itens && pedido.itens.length > 0 ? (
                  pedido.itens.map((item) => (
                    <li key={item.id} className="py-2">
                      <div className="flex justify-between">
                        <span>{item.nome_produto}</span>
                        <span className="text-gray-600">{item.quantidade}x</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatarPreco(item.preco_unitario * item.quantidade)}
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="py-2 text-gray-500">Nenhum item encontrado</li>
                )}
              </ul>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Retire Seu Pedido</h2>
          
          {codigoRetirada ? (
            <>
              <div className="mb-6">
                <p className="text-gray-600 mb-2">Apresente este QR Code ou código para retirar seu pedido:</p>
                <div className="bg-gray-100 p-4 rounded-lg inline-block">
                  <QRCode value={codigoRetirada} size={200} />
                </div>
              </div>
              
              <div className="mt-4 bg-blue-50 p-4 rounded-lg inline-block">
                <h3 className="text-blue-800 font-semibold">Código de Retirada</h3>
                <p className="text-2xl font-bold mt-1 tracking-wider">{codigoRetirada}</p>
              </div>
            </>
          ) : (
            <div className="text-gray-600">
              <p>Nenhum código de retirada disponível para este pedido.</p>
              <p className="mt-2">Para gerar um código, vá para "Meus Pedidos" e selecione os itens que deseja retirar.</p>
              <Button 
                onClick={() => navigate('/meus-pedidos')} 
                className="mt-4"
              >
                Ir para Meus Pedidos
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PedidoConfirmado;
