
import { useEffect, useState } from 'react';
import { useNavigate, Outlet, Navigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AccessControlProps {
  children?: React.ReactNode;
  allowedRoles: string[];
  redirectTo: string;
}

export const AccessControl = ({ 
  allowedRoles, 
  redirectTo 
}: AccessControlProps) => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Acesso negado",
            description: "Você precisa estar logado para acessar esta página",
          });
          setHasAccess(false);
          setChecking(false);
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
          });
          setHasAccess(false);
          setChecking(false);
          return;
        }

        const hasPermission = allowedRoles.includes(profileData.role);
        setHasAccess(hasPermission);
        
        if (!hasPermission) {
          toast({
            title: "Acesso restrito",
            description: "Você não tem permissão para acessar esta página",
          });
        }
        
        setChecking(false);
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        setHasAccess(false);
        setChecking(false);
      }
    };

    checkUserAccess();
  }, [navigate, allowedRoles, redirectTo]);

  if (checking) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Verificando permissões...</p>
    </div>;
  }

  return hasAccess ? <Outlet /> : <Navigate to={redirectTo} replace />;
};
