
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { SolicitacaoSaque } from './useSaques';

export const useAllSaques = () => {
  const [saques, setSaques] = useState<SolicitacaoSaque[]>([]);
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
      const typedData = (data || []) as (SolicitacaoSaque & { bar?: { name: string } })[];
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
