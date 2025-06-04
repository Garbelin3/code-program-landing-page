
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { CheckCircle, CreditCard, Banknote, Smartphone, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { ClientePDV, MetodoPagamento } from '@/types/pdv';

interface FinalizacaoPedidoProps {
  valorTotal: number;
  cliente: ClientePDV;
  metodoPagamento: MetodoPagamento;
  observacoes: string;
  finalizando: boolean;
  codigoGerado: string;
  onClienteChange: (cliente: ClientePDV) => void;
  onMetodoPagamentoChange: (metodo: MetodoPagamento) => void;
  onObservacoesChange: (observacoes: string) => void;
  onFinalizar: () => void;
  onNovoAtendimento: () => void;
}

export const FinalizacaoPedido = ({
  valorTotal,
  cliente,
  metodoPagamento,
  observacoes,
  finalizando,
  codigoGerado,
  onClienteChange,
  onMetodoPagamentoChange,
  onObservacoesChange,
  onFinalizar,
  onNovoAtendimento
}: FinalizacaoPedidoProps) => {
  const handleCopiarCodigo = () => {
    navigator.clipboard.writeText(codigoGerado);
    toast({
      title: 'Código copiado!',
      description: 'Código de retirada copiado para a área de transferência'
    });
  };

  const getIconeMetodo = (metodo: MetodoPagamento) => {
    switch (metodo) {
      case 'dinheiro':
        return <Banknote className="h-4 w-4" />;
      case 'pix':
        return <Smartphone className="h-4 w-4" />;
      case 'cartao_credito':
      case 'cartao_debito':
        return <CreditCard className="h-4 w-4" />;
      default:
        return null;
    }
  };

  // Se o pedido foi finalizado, mostrar o código
  if (codigoGerado) {
    return (
      <div className="space-y-4">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-3" />
            <h3 className="font-bold text-lg text-green-800 mb-2">
              Pedido Finalizado!
            </h3>
            <p className="text-green-700 mb-4">
              Valor: <span className="font-bold">R$ {valorTotal.toFixed(2)}</span>
            </p>
            
            <div className="bg-white border-2 border-green-300 rounded-lg p-4 mb-4">
              <Label className="text-sm font-medium text-green-800">
                Código de Retirada
              </Label>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  value={codigoGerado}
                  readOnly
                  className="text-center text-2xl font-bold tracking-wider"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopiarCodigo}
                  className="h-10 w-10 p-0"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-green-700 mb-4">
              📱 Forneça este código ao cliente para retirada
            </p>
          </CardContent>
        </Card>

        <Button
          onClick={onNovoAtendimento}
          className="w-full"
          size="lg"
        >
          Novo Atendimento
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Resumo do Valor */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total a Pagar:</span>
          <span className="text-green-600">R$ {valorTotal.toFixed(2)}</span>
        </div>
      </div>

      <Separator />

      {/* Dados do Cliente (Opcional para identificação) */}
      <div className="space-y-2">
        <Label htmlFor="cliente-nome">Nome do Cliente (opcional)</Label>
        <Input
          id="cliente-nome"
          type="text"
          placeholder="Nome para identificação"
          value={cliente.nome || ''}
          onChange={(e) => onClienteChange({ ...cliente, nome: e.target.value })}
        />
      </div>

      {/* Método de Pagamento */}
      <div className="space-y-2">
        <Label>Método de Pagamento</Label>
        <Select value={metodoPagamento} onValueChange={onMetodoPagamentoChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dinheiro">
              <div className="flex items-center gap-2">
                <Banknote className="h-4 w-4" />
                Dinheiro
              </div>
            </SelectItem>
            <SelectItem value="pix">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4" />
                PIX
              </div>
            </SelectItem>
            <SelectItem value="cartao_debito">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Cartão de Débito
              </div>
            </SelectItem>
            <SelectItem value="cartao_credito">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Cartão de Crédito
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações (opcional)</Label>
        <Textarea
          id="observacoes"
          placeholder="Ex: Pagou com R$50, troco R$10..."
          value={observacoes}
          onChange={(e) => onObservacoesChange(e.target.value)}
          rows={3}
        />
      </div>

      {/* Botão Finalizar */}
      <Button
        onClick={onFinalizar}
        disabled={finalizando}
        className="w-full"
        size="lg"
      >
        <div className="flex items-center gap-2">
          {getIconeMetodo(metodoPagamento)}
          {finalizando ? 'Finalizando...' : 'Finalizar Pedido'}
        </div>
      </Button>
    </div>
  );
};
