
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus } from "lucide-react";
import { useChavesPix, type ChavePix } from "@/hooks/useChavesPix";

interface GerenciarChavesPixProps {
  barId: string;
  onChaveAdded?: () => void;
}

export const GerenciarChavesPix = ({ barId, onChaveAdded }: GerenciarChavesPixProps) => {
  const { chaves, loading, criarChave, inativarChave } = useChavesPix(barId);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    chave_pix: '',
    tipo_chave: '' as ChavePix['tipo_chave'],
    nome_beneficiario: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.chave_pix || !formData.tipo_chave || !formData.nome_beneficiario) return;

    setSubmitting(true);
    try {
      await criarChave({
        bar_id: barId,
        chave_pix: formData.chave_pix,
        tipo_chave: formData.tipo_chave,
        nome_beneficiario: formData.nome_beneficiario,
        status: 'ativo'
      });
      
      setFormData({ chave_pix: '', tipo_chave: '' as ChavePix['tipo_chave'], nome_beneficiario: '' });
      setShowForm(false);
      onChaveAdded?.();
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (chaveId: string) => {
    if (confirm('Tem certeza que deseja inativar esta chave PIX?')) {
      await inativarChave(chaveId);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Carregando chaves PIX...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Chaves PIX</h3>
        <Button onClick={() => setShowForm(!showForm)} variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Chave
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cadastrar Nova Chave PIX</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="tipo_chave">Tipo da Chave</Label>
                <Select 
                  value={formData.tipo_chave} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_chave: value as ChavePix['tipo_chave'] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cpf">CPF</SelectItem>
                    <SelectItem value="cnpj">CNPJ</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="telefone">Telefone</SelectItem>
                    <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="chave_pix">Chave PIX</Label>
                <Input
                  id="chave_pix"
                  value={formData.chave_pix}
                  onChange={(e) => setFormData(prev => ({ ...prev, chave_pix: e.target.value }))}
                  placeholder="Digite a chave PIX"
                  required
                />
              </div>

              <div>
                <Label htmlFor="nome_beneficiario">Nome do Beneficiário</Label>
                <Input
                  id="nome_beneficiario"
                  value={formData.nome_beneficiario}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome_beneficiario: e.target.value }))}
                  placeholder="Nome de quem recebe"
                  required
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {chaves.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhuma chave PIX cadastrada</p>
        ) : (
          chaves.map((chave) => (
            <Card key={chave.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{chave.tipo_chave.toUpperCase()}</Badge>
                    <span className="font-medium">{chave.nome_beneficiario}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{chave.chave_pix}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(chave.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
