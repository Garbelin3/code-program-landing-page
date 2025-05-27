
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ChavePix {
  id: string;
  bar_id: string;
  chave_pix: string;
  tipo_chave: 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria';
  nome_beneficiario: string;
  status: 'ativo' | 'inativo';
  created_at: string;
  updated_at: string;
}

export const useChavesPix = (barId: string) => {
  const [chaves, setChaves] = useState<ChavePix[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChaves = async () => {
    if (!barId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chaves_pix')
        .select('*')
        .eq('bar_id', barId)
        .eq('status', 'ativo')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChaves(data || []);
    } catch (error: any) {
      console.error('Erro ao buscar chaves PIX:', error);
      toast({
        title: 'Erro ao carregar chaves PIX',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const criarChave = async (chaveData: Omit<ChavePix, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('chaves_pix')
        .insert([chaveData])
        .select()
        .single();

      if (error) throw error;
      
      await fetchChaves();
      toast({
        title: 'Chave PIX cadastrada',
        description: 'Chave PIX foi cadastrada com sucesso.'
      });
      
      return data;
    } catch (error: any) {
      console.error('Erro ao criar chave PIX:', error);
      toast({
        title: 'Erro ao cadastrar chave PIX',
        description: error.message,
        variant: 'destructive'
      });
      throw error;
    }
  };

  const inativarChave = async (chaveId: string) => {
    try {
      const { error } = await supabase
        .from('chaves_pix')
        .update({ status: 'inativo' })
        .eq('id', chaveId);

      if (error) throw error;
      
      await fetchChaves();
      toast({
        title: 'Chave PIX inativada',
        description: 'Chave PIX foi inativada com sucesso.'
      });
    } catch (error: any) {
      console.error('Erro ao inativar chave PIX:', error);
      toast({
        title: 'Erro ao inativar chave PIX',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchChaves();
  }, [barId]);

  return { chaves, loading, criarChave, inativarChave, refetch: fetchChaves };
};
