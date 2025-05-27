
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSaques } from "@/hooks/useSaques";

interface HistoricoSaquesProps {
  barId: string;
}

export const HistoricoSaques = ({ barId }: HistoricoSaquesProps) => {
  const { saques, loading } = useSaques(barId);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      default: return 'Pendente';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Saques</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico de Saques</CardTitle>
      </CardHeader>
      <CardContent>
        {saques.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            Nenhuma solicitação de saque encontrada
          </p>
        ) : (
          <div className="space-y-3">
            {saques.map((saque) => (
              <div key={saque.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-medium">{formatCurrency(saque.valor_solicitado)}</div>
                    <div className="text-sm text-muted-foreground">
                      {saque.chave_pix?.nome_beneficiario} • {saque.chave_pix?.tipo_chave.toUpperCase()}
                    </div>
                  </div>
                  <Badge className={getStatusColor(saque.status)}>
                    {getStatusText(saque.status)}
                  </Badge>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  Solicitado em {format(new Date(saque.data_solicitacao), 'PPpp', { locale: ptBR })}
                  {saque.data_processamento && (
                    <span>
                      {' • '}Processado em {format(new Date(saque.data_processamento), 'PPpp', { locale: ptBR })}
                    </span>
                  )}
                </div>
                
                {saque.observacoes && (
                  <div className="text-sm text-muted-foreground mt-2 p-2 bg-muted rounded">
                    {saque.observacoes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
