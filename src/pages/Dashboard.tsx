import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { toast } from "@/hooks/use-toast";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import { BarList } from "@/components/BarList";
import { GerenciarCardapio } from "@/components/produtos/GerenciarCardapio";
import { VerificarRetirada } from "@/components/pedidos/VerificarRetirada";

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
      const {
        error
      } = await supabase.auth.signOut();
      if (error) throw error;
      navigate("/");
      toast({
        title: "Logout bem-sucedido",
        description: "Você foi desconectado com sucesso."
      });
    } catch (error: any) {
      toast({
        title: "Erro ao fazer logout",
        description: error.message,
        variant: "destructive"
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
      <header className="bg-white shadow-sm">
        <div className="container mx-auto py-4 px-6 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">PedeBar</h1>
            {profileData && profileData.role !== 'user' && <span className="ml-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {profileData.role === 'dono' ? 'Dono' : profileData.role === 'funcionario' ? 'Funcionário' : profileData.role === 'caixa' ? 'Caixa' : 'Admin'}
              </span>}
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {profileData && profileData.role === 'user' && (
              <Link to="/meus-pedidos">
                <Button className="w-full sm:w-auto">Meus Pedidos</Button>
              </Link>
            )}
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          </div>
        </div>
      </header>

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
          <CardTitle className="text-2xl sm:text-3xl">Painel de Administração</CardTitle>
          <CardDescription className="text-base sm:text-lg">
            Gerencie todos os aspectos da plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="border rounded-md p-4 bg-blue-50 flex flex-col justify-center">
              <h4 className="font-bold text-blue-700 text-base sm:text-lg">Gerenciar Usuários</h4>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Você tem acesso completo a todos os usuários
              </p>
            </div>
            <div className="border rounded-md p-4 bg-green-50 flex flex-col justify-center">
              <h4 className="font-bold text-green-700 text-base sm:text-lg">Gerenciar Bares</h4>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
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
          <CardTitle className="text-2xl sm:text-3xl">Painel do Dono</CardTitle>
          <CardDescription className="text-base sm:text-lg">
            Gerencie seu estabelecimento: {barData?.name || "Bar não encontrado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-white rounded-lg shadow">
              <h3 className="font-semibold text-lg sm:text-xl">Informações do Bar</h3>
              {barData ? <div className="mt-2 space-y-1">
                  <p><span className="font-medium">Nome:</span> {barData.name}</p>
                  <p><span className="font-medium">Endereço:</span> {barData.address || "Não informado"}</p>
                </div> : <p className="text-red-500">Dados do bar não encontrados</p>}
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="border rounded-md p-4 bg-indigo-50 col-span-1 md:col-span-3">
                {barData && (
                  <GerenciarCardapio 
                    barId={barData.id} 
                    barName={barData.name} 
                  />
                )}
              </div>
              <div className="border rounded-md p-4 bg-purple-50 flex items-center justify-center">
                <h4 className="font-bold text-purple-700 text-center text-base sm:text-lg">Gerenciar Funcionários</h4>
              </div>
              <div className="border rounded-md p-4 bg-amber-50 flex items-center justify-center">
                <h4 className="font-bold text-amber-700 text-center text-base sm:text-lg">Relatórios Financeiros</h4>
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
          <CardTitle className="text-2xl sm:text-3xl">Painel do Funcionário</CardTitle>
          <CardDescription className="text-base sm:text-lg">
            Atendimento para: {barData?.name || "Bar não encontrado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-amber-800 mb-2">Gerenciamento de Pedidos</h2>
              <p className="text-sm text-amber-700 mb-4">
                Utilize o scanner para verificar e processar as retiradas de pedidos.
              </p>
              
              <VerificarRetirada />
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
          <CardTitle className="text-2xl sm:text-3xl">Painel do Caixa</CardTitle>
          <CardDescription className="text-base sm:text-lg">
            Gerenciamento financeiro para: {barData?.name || "Bar não encontrado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="border rounded-md p-4 bg-rose-50 flex flex-col justify-center">
                <h4 className="font-bold text-rose-700 text-base sm:text-lg">Pagamentos</h4>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
                  Gerencie e processe pagamentos
                </p>
              </div>
              <div className="border rounded-md p-4 bg-amber-50 flex flex-col justify-center">
                <h4 className="font-bold text-amber-700 text-base sm:text-lg">Fechamento de Caixa</h4>
                <p className="text-sm sm:text-base text-gray-600 mt-1">
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
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl">Bares Disponíveis</CardTitle>
          <CardDescription className="text-base sm:text-lg">Escolha um bar para fazer seu pedido</CardDescription>
        </CardHeader>
        <CardContent>
          <BarList />
        </CardContent>
      </Card>
    </>;
};
export default Dashboard;
