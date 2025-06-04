
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CalendarDays, Mail, RotateCcw, TrendingUp, CreditCard, Banknote, Smartphone } from 'lucide-react';
import { useHistoricoDia } from '@/hooks/useHistoricoDia';

interface HistoricoDiaProps {
  barId: string;
}

export const HistoricoDia = ({ barId }: HistoricoDiaProps) => {
  const { pedidos, loading, reenviarCodigo, refetch } = useHistoricoDia(barId);
  const [emailReenvio, setEmailReenvio] = useState('');
  const [pedidoParaReenvio, setPedidoParaReenvio] = useState<string>('');
  const [modalReenvioAberto, setModalReenvioAberto] = useState(false);

  const formatarHora = (dataString: string) => {
    return new Date(dataString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calcularTotalDia = () => {
    return pedidos.reduce((total, pedido) => total + pedido.valor_total, 0);
  };

  const abrirModalReenvio = (pedidoId: string, emailExistente?: string) => {
    setPedidoParaReenvio(pedidoId);
    setEmailReenvio(emailExistente || '');
    setModalReenvioAberto(true);
  };

  const handleReenviarCodigo = async () => {
    if (!emailReenvio.trim()) return;
    
    await reenviarCodigo(pedidoParaReenvio, emailReenvio);
    setModalReenvioAberto(false);
    setEmailReenvio('');
    setPedidoParaReenvio('');
  };

  const getIconeMetodo = (metodo?: string) => {
    switch (metodo) {
      case 'dinheiro':
        return <Banknote className="h-4 w-4" />;
      case 'pix':
        return <Smartphone className="h-4 w-4" />;
      case 'cartao_credito':
      case 'cartao_debito':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Banknote className="h-4 w-4" />;
    }
  };

  const getMetodoLabel = (metodo?: string) => {
    switch (metodo) {
      case 'dinheiro':
        return 'Dinheiro';
      case 'pix':
        return 'PIX';
      case 'cartao_credito':
        return 'Cartão de Crédito';
      case 'cartao_debito':
        return 'Cartão de Débito';
      default:
        return 'Não informado';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">Carregando histórico...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo do Dia */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Resumo do Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{pedidos.length}</div>
              <div className="text-sm text-blue-700">Pedidos PDV</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                R$ {calcularTotalDia().toFixed(2)}
              </div>
              <div className="text-sm text-green-700">Faturamento PDV</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                R$ {pedidos.length > 0 ? (calcularTotalDia() / pedidos.length).toFixed(2) : '0.00'}
              </div>
              <div className="text-sm text-purple-700">Ticket Médio</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Pedidos PDV de Hoje
          </CardTitle>
          <Button variant="outline" size="sm" onClick={refetch}>
            <RotateCcw className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {pedidos.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Nenhum pedido PDV realizado hoje</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Horário</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map(pedido => (
                  <TableRow key={pedido.id}>
                    <TableCell className="font-medium">
                      {formatarHora(pedido.created_at)}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-green-600">
                        R$ {pedido.valor_total.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getIconeMetodo(pedido.metodo_pagamento)}
                        <span className="text-sm">
                          {getMetodoLabel(pedido.metodo_pagamento)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {pedido.cliente_nome && <div className="font-medium">{pedido.cliente_nome}</div>}
                        {pedido.cliente_email && <div className="text-muted-foreground">{pedido.cliente_email}</div>}
                        {!pedido.cliente_nome && !pedido.cliente_email && (
                          <span className="text-muted-foreground">Não informado</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => abrirModalReenvio(pedido.id, pedido.cliente_email || undefined)}
                        className="flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        Enviar Código
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal para Reenvio de Código */}
      <Dialog open={modalReenvioAberto} onOpenChange={setModalReenvioAberto}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Código de Retirada</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="email-reenvio">E-mail do Cliente</Label>
              <Input
                id="email-reenvio"
                type="email"
                placeholder="cliente@exemplo.com"
                value={emailReenvio}
                onChange={(e) => setEmailReenvio(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleReenviarCodigo}
                disabled={!emailReenvio.trim()}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-1" />
                Enviar Código
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setModalReenvioAberto(false)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
