
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ProfileData {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
}

interface DashboardProps {
  user: User | null;
}

const Dashboard = ({ user }: DashboardProps) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        
        setProfileData(data as ProfileData);
      } catch (error: any) {
        console.error("Error fetching profile:", error.message);
        toast({
          title: "Erro ao carregar perfil",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      navigate("/");
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p className="text-lg text-gray-600">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">PedeBar</h1>
          <Button variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto py-8 px-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
          {profileData && (
            <div className="space-y-2">
              <p>
                <span className="font-medium">Nome:</span> {profileData.full_name || "N/A"}
              </p>
              <p>
                <span className="font-medium">Email:</span> {profileData.email}
              </p>
              <p>
                <span className="font-medium">Função:</span> {profileData.role === "admin" ? "Administrador" : "Usuário"}
              </p>
            </div>
          )}
        </div>

        {profileData?.role === "admin" && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">Painel de Administração</h3>
            <p className="mb-4">Bem-vindo ao painel de administração! Aqui você pode gerenciar usuários e conteúdo.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4 bg-blue-50">
                <h4 className="font-bold text-blue-700">Gerenciar Usuários</h4>
              </div>
              <div className="border rounded-md p-4 bg-green-50">
                <h4 className="font-bold text-green-700">Gerenciar Cardápio</h4>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
