import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { BarList } from "@/components/BarList";
import { GerenciarCardapio } from "@/components/produtos/GerenciarCardapio";
import { Navbar } from "@/components/Navbar";

interface BarData {
  id: string;
  name: string;
  address: string | null;
}
interface ProfileData {
  id: string;
  full_name: string | null;
  email: string;
  role: string;
  bar_id: string | null;
  bar?: BarData | null;
}
interface DashboardProps {
  user: User | null;
}
const Dashboard = ({
  user
}: DashboardProps) => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [barData, setBarData] = useState<BarData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => {
    const fetchProfileAndBar = async () => {
      if (!user) return;
      try {
        // Fetch profile data
        const {
          data: profileData,
          error: profileError
        } = await supabase.from("profiles").select("*").eq("id", user.id).single();
        if (profileError) throw profileError;

        // If profile has a bar_id, fetch the bar data
        if (profileData.bar_id) {
          const {
            data: barData,
            error: barError
          } = await supabase.from("bars").select("*").eq("id", profileData.bar_id).single();
          if (barError) throw barError;
          setBarData(barData);
        }
        setProfileData(profileData);
      } catch (error: any) {
        console.error("Error fetching data:", error.message);
        toast({
          title: "Erro ao carregar dados",
          description: error.message,
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchProfileAndBar();
  }, [user]);

  // Handle professional account restrictions
  useEffect(() => {
    if (!loading && profileData && profileData.role !== 'user') {
      // No need to redirect again if already on correct page
      // Just ensure the correct dashboard is shown
      document.title = `Painel ${profileData.role} - PedeBar`;
    }
  }, [profileData, loading, navigate]);
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema.",
      });
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      toast({
        title: "Erro ao fazer logout",
        description: "Ocorreu um erro ao tentar sair do sistema.",
        variant: "destructive",
      });
    }
  };
  if (loading) {
    return <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <p className="text-lg text-gray-600">Carregando...</p>
      </div>;
  }

  // Determine which dashboard to display based on role
  const renderDashboardContent = () => {
    if (!profileData) return null;
    switch (profileData.role) {
      case "admin":
        return <AdminDashboard />;
      case "dono":
        return <OwnerDashboard profileData={profileData} barData={barData} />;
      case "funcionario":
        return <EmployeeDashboard profileData={profileData} barData={barData} />;
      case "caixa":
        return <CashierDashboard profileData={profileData} barData={barData} />;
      default:
        return <UserDashboard profileData={profileData} />;
    }
  };
  return <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={handleLogout} />
      <main className="container mx-auto py-8 px-6">
        {renderDashboardContent()}
      </main>
    </div>;
};

// Admin Dashboard Component
const AdminDashboard = () => {
  return <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Painel de Administração</CardTitle>
          <CardDescription>
            Gerencie todos os aspectos da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border rounded-md p-4 bg-blue-50">
              <h4 className="font-bold text-blue-700">Gerenciar Usuários</h4>
              <p className="text-sm text-gray-600 mt-1">
                Você tem acesso completo a todos os usuários
              </p>
            </div>
            <div className="border rounded-md p-4 bg-green-50">
              <h4 className="font-bold text-green-700">Gerenciar Bares</h4>
              <p className="text-sm text-gray-600 mt-1">
                Você tem acesso para gerenciar todos os bares
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>;
};

// Owner Dashboard Component
const OwnerDashboard = ({
  profileData,
  barData
}: {
  profileData: ProfileData;
  barData: BarData | null;
}) => {
  return <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Painel do Dono</CardTitle>
          <CardDescription>
            Gerencie seu estabelecimento: {barData?.name || "Bar não encontrado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-semibold text-lg">Informações do Bar</h3>
              {barData ? <div className="mt-2">
                  <p><span className="font-medium">Nome:</span> {barData.name}</p>
                  <p><span className="font-medium">Endereço:</span> {barData.address || "Não informado"}</p>
                </div> : <p className="text-red-500">Dados do bar não encontrados</p>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-md p-4 bg-indigo-50 col-span-3">
                {barData && (
                  <GerenciarCardapio 
                    barId={barData.id} 
                    barName={barData.name} 
                  />
                )}
              </div>
              <div className="border rounded-md p-4 bg-purple-50">
                <h4 className="font-bold text-purple-700">Gerenciar Funcionários</h4>
              </div>
              <div className="border rounded-md p-4 bg-amber-50">
                <h4 className="font-bold text-amber-700">Relatórios Financeiros</h4>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>;
};

// Employee Dashboard Component
const EmployeeDashboard = ({
  profileData,
  barData
}: {
  profileData: ProfileData;
  barData: BarData | null;
}) => {
  return <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Painel do Funcionário</CardTitle>
          <CardDescription>
            Atendimento para: {barData?.name || "Bar não encontrado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4 bg-cyan-50">
                <h4 className="font-bold text-cyan-700">Gerenciar Pedidos</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Visualize e gerencie pedidos dos clientes
                </p>
              </div>
              <div className="border rounded-md p-4 bg-emerald-50">
                <h4 className="font-bold text-emerald-700">Ver Cardápio</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Consulte os itens disponíveis no cardápio
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>;
};

// Cashier Dashboard Component
const CashierDashboard = ({
  profileData,
  barData
}: {
  profileData: ProfileData;
  barData: BarData | null;
}) => {
  return <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">Painel do Caixa</CardTitle>
          <CardDescription>
            Gerenciamento financeiro para: {barData?.name || "Bar não encontrado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-md p-4 bg-rose-50">
                <h4 className="font-bold text-rose-700">Pagamentos</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Gerencie e processe pagamentos
                </p>
              </div>
              <div className="border rounded-md p-4 bg-amber-50">
                <h4 className="font-bold text-amber-700">Fechamento de Caixa</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Relatórios e fechamento diário
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>;
};

// Regular User Dashboard Component
const UserDashboard = ({
  profileData
}: {
  profileData: ProfileData;
}) => {
  return <>
      

      <Card>
        <CardHeader>
          <CardTitle>Bares Disponíveis</CardTitle>
          <CardDescription>Escolha um bar para fazer seu pedido</CardDescription>
        </CardHeader>
        <CardContent>
          <BarList />
        </CardContent>
      </Card>
    </>;
};
export default Dashboard;
