
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface AccessControlProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo: string;
}

export const AccessControl = ({ 
  children, 
  allowedRoles, 
  redirectTo 
}: AccessControlProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkUserAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Acesso negado",
          description: "Você precisa estar logado para acessar esta página",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (error || !profileData) {
        toast({
          title: "Erro ao verificar permissões",
          description: error?.message || "Perfil não encontrado",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      if (!allowedRoles.includes(profileData.role)) {
        toast({
          title: "Acesso restrito",
          description: "Você não tem permissão para acessar esta página",
          variant: "destructive",
        });
        navigate(redirectTo);
      }
    };

    checkUserAccess();
  }, [navigate, allowedRoles, redirectTo]);

  return <>{children}</>;
};
