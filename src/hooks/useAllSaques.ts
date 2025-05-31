
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ChavePix } from './useChavesPix';

// Tipo extendido que inclui a relação com o bar
export interface SolicitacaoSaqueComBar {
  id: string;
  bar_id: string;
  chave_pix_id: string;
  valor_solicitado: number;
  status: 'pendente' | 'aprovado' | 'rejeitado';
  data_solicitacao: string;
  data_processamento?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  chave_pix?: ChavePix;
  bar?: { name: string };
}

export const useAllSaques = () => {
  const [saques, setSaques] = useState<SolicitacaoSaqueComBar[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAllSaques = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes_saque')
        .select(`
          *,
          chave_pix:chaves_pix(*),
          bar:bars(name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion para garantir que os tipos estão corretos
      const typedData = (data || []) as SolicitacaoSaqueComBar[];
      setSaques(typedData);
    } catch (error: any) {
      console.error('Erro ao buscar todos os saques:', error);
      toast({
        title: 'Erro ao carregar saques',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const atualizarStatusSaque = async (saqueId: string, novoStatus: 'aprovado' | 'rejeitado', observacoes?: string) => {
    try {
      const { error } = await supabase
        .from('solicitacoes_saque')
        .update({
          status: novoStatus,
          data_processamento: new Date().toISOString(),
          observacoes: observacoes || null
        })
        .eq('id', saqueId);

      if (error) throw error;
      
      await fetchAllSaques();
      toast({
        title: 'Status atualizado',
        description: `Saque ${novoStatus === 'aprovado' ? 'aprovado' : 'rejeitado'} com sucesso.`
      });
    } catch (error: any) {
      console.error('Erro ao atualizar status do saque:', error);
      toast({
        title: 'Erro ao atualizar saque',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchAllSaques();
  }, []);

  return { saques, loading, atualizarStatusSaque, refetch: fetchAllSaques };
};
