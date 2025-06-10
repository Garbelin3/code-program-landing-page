
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import { useChavesPix } from "@/hooks/useChavesPix";
import { useSaques } from "@/hooks/useSaques";
import { GerenciarChavesPix } from "./GerenciarChavesPix";

interface SolicitarSaqueProps {
  barId: string;
  saldoDisponivel: number;
}

export const SolicitarSaque = ({ barId, saldoDisponivel }: SolicitarSaqueProps) => {
  const { chaves, refetch: refetchChaves } = useChavesPix(barId);
  const { solicitarSaque } = useSaques(barId);
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'solicitar' | 'chaves'>('solicitar');
  const [formData, setFormData] = useState({
    chave_pix_id: '',
    valor: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chave_pix_id || !formData.valor) return;

    const valor = parseFloat(formData.valor);
    if (valor <= 0 || valor > saldoDisponivel) {
      alert('Valor inválido ou superior ao saldo disponível');
      return;
    }

    setSubmitting(true);
    try {
      await solicitarSaque(formData.chave_pix_id, valor);
      setFormData({ chave_pix_id: '', valor: '' });
      setOpen(false);
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleChaveAdded = () => {
    refetchChaves();
    setActiveTab('solicitar');
  };

  useEffect(() => {
    if (chaves.length === 0 && open) {
      setActiveTab('chaves');
    }
  }, [chaves.length, open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" disabled={saldoDisponivel <= 0}>
          <DollarSign className="h-4 w-4 mr-2" />
          Solicitar Saque
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Solicitar Saque</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'solicitar' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('solicitar')}
              disabled={chaves.length === 0}
            >
              Solicitar Saque
            </button>
            <button
              className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'chaves' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setActiveTab('chaves')}
            >
              Gerenciar Chaves PIX
            </button>
          </div>
        </div>

        {activeTab === 'solicitar' ? (
          chaves.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Você precisa cadastrar uma chave PIX primeiro
              </p>
              <Button onClick={() => setActiveTab('chaves')}>
                Cadastrar Chave PIX
              </Button>
            </div>
          ) : saldoDisponivel <= 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Não há saldo disponível para saque
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Saldo disponível</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(saldoDisponivel)}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Saldo disponível</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(saldoDisponivel)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Valor já descontando saques pendentes
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="chave_pix">Chave PIX para recebimento</Label>
                  <Select 
                    value={formData.chave_pix_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, chave_pix_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma chave PIX" />
                    </SelectTrigger>
                    <SelectContent>
                      {chaves.map((chave) => (
                        <SelectItem key={chave.id} value={chave.id}>
                          <div>
                            <div className="font-medium">{chave.nome_beneficiario}</div>
                            <div className="text-sm text-muted-foreground">
                              {chave.tipo_chave.toUpperCase()}: {chave.chave_pix}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="valor">Valor do saque</Label>
                  <Input
                    id="valor"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={saldoDisponivel}
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="0,00"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor máximo: {formatCurrency(saldoDisponivel)}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={submitting} className="flex-1">
                    {submitting ? 'Solicitando...' : 'Solicitar Saque'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </div>
          )
        ) : (
          <GerenciarChavesPix barId={barId} onChaveAdded={handleChaveAdded} />
        )}
      </DialogContent>
    </Dialog>
  );
};
