
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { ChavePix } from './useChavesPix';

export interface SolicitacaoSaque {
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
}

export const useSaques = (barId: string) => {
  const [saques, setSaques] = useState<SolicitacaoSaque[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSaques = async () => {
    if (!barId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('solicitacoes_saque')
        .select(`
          *,
          chave_pix:chaves_pix(*)
        `)
        .eq('bar_id', barId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSaques(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar saques:', error);
      toast({
        title: 'Erro ao carregar histórico de saques',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const solicitarSaque = async (chavePixId: string, valor: number) => {
    try {
      const { data, error } = await supabase
        .from('solicitacoes_saque')
        .insert([{
          bar_id: barId,
          chave_pix_id: chavePixId,
          valor_solicitado: valor
        }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchSaques();
      toast({
        title: 'Saque solicitado',
        description: 'Sua solicitação de saque foi enviada para análise.'
      });
      
      return data;
    } catch (error: any) {
      console.error('Erro ao solicitar saque:', error);
      toast({
        title: 'Erro ao solicitar saque',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  useEffect(() => {
    fetchSaques();
  }, [barId]);

  return { saques, loading, solicitarSaque, refetch: fetchSaques };
};
