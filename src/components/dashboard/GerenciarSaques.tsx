
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { useAllSaques } from "@/hooks/useAllSaques";
import type { SolicitacaoSaque } from "@/hooks/useSaques";

interface SaqueComBar extends SolicitacaoSaque {
  bar?: { name: string };
}

export const GerenciarSaques = () => {
  const { saques, loading, atualizarStatusSaque } = useAllSaques();
  const [modalOpen, setModalOpen] = useState(false);
  const [saqueParaProcessar, setSaqueParaProcessar] = useState<SaqueComBar | null>(null);
  const [observacoes, setObservacoes] = useState('');
  const [acao, setAcao] = useState<'aprovar' | 'rejeitar' | null>(null);
  const [processando, setProcessando] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
      case 'aprovado':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="w-3 h-3 mr-1" />Aprovado</Badge>;
      case 'rejeitado':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="w-3 h-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const abrirModal = (saque: SaqueComBar, acao: 'aprovar' | 'rejeitar') => {
    setSaqueParaProcessar(saque);
    setAcao(acao);
    setObservacoes('');
    setModalOpen(true);
  };

  const processarSaque = async () => {
    if (!saqueParaProcessar || !acao) return;

    setProcessando(true);
    try {
      await atualizarStatusSaque(
        saqueParaProcessar.id, 
        acao === 'aprovar' ? 'aprovado' : 'rejeitado',
        observacoes || undefined
      );
      setModalOpen(false);
      setSaqueParaProcessar(null);
      setAcao(null);
      setObservacoes('');
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setProcessando(false);
    }
  };

  const saquesPendentes = saques.filter(saque => saque.status === 'pendente');
  const saquesProcessados = saques.filter(saque => saque.status !== 'pendente');

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciar Saques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Carregando saques...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Saques Pendentes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-600" />
            Saques Pendentes ({saquesPendentes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {saquesPendentes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum saque pendente</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bar</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Chave PIX</TableHead>
                  <TableHead>Data Solicitação</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saquesPendentes.map((saque) => (
                  <TableRow key={saque.id}>
                    <TableCell className="font-medium">{saque.bar?.name || 'Bar não encontrado'}</TableCell>
                    <TableCell>{formatCurrency(saque.valor_solicitado)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{saque.chave_pix?.nome_beneficiario}</div>
                        <div className="text-muted-foreground">
                          {saque.chave_pix?.tipo_chave.toUpperCase()}: {saque.chave_pix?.chave_pix}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(saque.data_solicitacao)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-green-600 border-green-600 hover:bg-green-50"
                          onClick={() => abrirModal(saque, 'aprovar')}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="text-red-600 border-red-600 hover:bg-red-50"
                          onClick={() => abrirModal(saque, 'rejeitar')}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Saques Processados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Histórico de Saques ({saquesProcessados.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {saquesProcessados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Nenhum saque processado</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bar</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data Processamento</TableHead>
                  <TableHead>Observações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {saquesProcessados.map((saque) => (
                  <TableRow key={saque.id}>
                    <TableCell className="font-medium">{saque.bar?.name || 'Bar não encontrado'}</TableCell>
                    <TableCell>{formatCurrency(saque.valor_solicitado)}</TableCell>
                    <TableCell>{getStatusBadge(saque.status)}</TableCell>
                    <TableCell>
                      {saque.data_processamento ? formatDate(saque.data_processamento) : '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {saque.observacoes || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Processamento */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {acao === 'aprovar' ? 'Aprovar Saque' : 'Rejeitar Saque'}
            </DialogTitle>
          </DialogHeader>
          
          {saqueParaProcessar && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Detalhes do Saque</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Bar:</strong> {saqueParaProcessar.bar?.name}</p>
                  <p><strong>Valor:</strong> {formatCurrency(saqueParaProcessar.valor_solicitado)}</p>
                  <p><strong>Beneficiário:</strong> {saqueParaProcessar.chave_pix?.nome_beneficiario}</p>
                  <p><strong>Chave PIX:</strong> {saqueParaProcessar.chave_pix?.chave_pix}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="observacoes">
                  Observações {acao === 'rejeitar' ? '(obrigatório)' : '(opcional)'}
                </Label>
                <Textarea
                  id="observacoes"
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder={
                    acao === 'aprovar' 
                      ? 'Observações sobre a aprovação...' 
                      : 'Motivo da rejeição...'
                  }
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={processarSaque} 
                  disabled={processando || (acao === 'rejeitar' && !observacoes.trim())}
                  className={acao === 'aprovar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  {processando ? 'Processando...' : (acao === 'aprovar' ? 'Confirmar Aprovação' : 'Confirmar Rejeição')}
                </Button>
                <Button variant="outline" onClick={() => setModalOpen(false)}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
