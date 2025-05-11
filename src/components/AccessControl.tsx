
import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
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
  const [checking, setChecking] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkUserAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log("Sem sessão ativa, redirecionando para", redirectTo);
          toast("Acesso negado", {
            description: "Você precisa estar logado para acessar esta página",
          });
          setHasAccess(false);
          setChecking(false);
          return;
        }

        console.log("Verificando perfil para o usuário:", session.user.id);
        const { data: profileData, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();

        if (error || !profileData) {
          console.error("Erro ao buscar perfil:", error);
          toast.error("Erro ao verificar permissões", {
            description: error?.message || "Perfil não encontrado",
          });
          setHasAccess(false);
          setChecking(false);
          return;
        }

        console.log("Perfil encontrado, role:", profileData.role, "Roles permitidas:", allowedRoles);
        const hasPermission = allowedRoles.includes(profileData.role);
        setHasAccess(hasPermission);
        
        if (!hasPermission) {
          console.log("Usuário não tem permissão, redirecionando para", redirectTo);
          toast("Acesso restrito", {
            description: "Você não tem permissão para acessar esta página",
          });
        } else {
          console.log("Acesso permitido para a rota");
        }
        
        setChecking(false);
      } catch (error) {
        console.error("Erro ao verificar acesso:", error);
        setHasAccess(false);
        setChecking(false);
      }
    };

    checkUserAccess();
  }, [allowedRoles, redirectTo]);

  if (checking) {
    return <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Verificando permissões...</p>
    </div>;
  }

  return hasAccess ? <Outlet /> : <Navigate to={redirectTo} replace />;
};
