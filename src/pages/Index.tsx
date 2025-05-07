
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { BarList } from "@/components/BarList";

interface IndexProps {
  user: User | null;
  loading: boolean;
}

const Index = ({ user, loading }: IndexProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500 to-purple-600">
      <header className="container mx-auto py-4 px-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">PedeBar</h1>
        <div className="space-x-4">
          {!loading && (
            user ? (
              <Link to="/dashboard">
                <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-100">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="bg-white text-blue-600 hover:bg-blue-100">
                    Entrar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-purple-700 hover:bg-purple-800 text-white">
                    Cadastrar
                  </Button>
                </Link>
              </>
            )
          )}
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 text-center text-white">
        <h2 className="text-5xl md:text-6xl font-bold mb-6">Peça direto do seu celular</h2>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
          Com o PedeBar, você pode fazer pedidos diretamente da sua mesa sem precisar chamar o garçom.
        </p>
        <div className="space-x-4 mb-16">
          <Button className="bg-white text-blue-600 hover:bg-blue-100" size="lg">
            Saiba Mais
          </Button>
          <Link to="/register">
            <Button className="bg-purple-700 hover:bg-purple-800" size="lg">
              Comece Agora
            </Button>
          </Link>
        </div>

        <section className="mt-16">
          <h3 className="text-3xl font-bold mb-8">Encontre Bares Parceiros</h3>
          <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
            <BarList />
          </div>
        </section>
      </main>

      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Pedidos Rápidos</h3>
            <p className="text-gray-600">
              Faça seu pedido em segundos e receba no conforto da sua mesa.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Cardápio Digital</h3>
            <p className="text-gray-600">
              Acesse o cardápio completo com fotos e descrições detalhadas.
            </p>
          </div>
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <h3 className="text-xl font-bold mb-4 text-gray-900">Pagamento Facilitado</h3>
            <p className="text-gray-600">
              Pague diretamente pelo aplicativo, sem complicações.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
