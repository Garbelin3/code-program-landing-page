
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { BarList } from "@/components/BarList";

interface IndexProps {
  user: User | null;
  loading: boolean;
}

const Index = ({
  user,
  loading
}: IndexProps) => {
  return <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <header className="container mx-auto py-6 px-6 flex justify-between items-center backdrop-blur-sm bg-white/80 border-b border-green-100 sticky top-0 z-50">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">PedeBar</h1>
        <div className="space-x-4">
          {!loading && (user ? <Link to="/dashboard">
                <Button variant="outline" className="border-green-200 hover:bg-green-50 text-green-700 hover:text-green-800 transition-all duration-200">
                  Dashboard
                </Button>
              </Link> : <>
                <Link to="/login">
                  <Button variant="outline" className="border-green-200 hover:bg-green-50 text-green-700 hover:text-green-800 transition-all duration-200">
                    Entrar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
                    Cadastrar
                  </Button>
                </Link>
              </>)}
        </div>
      </header>

      <main className="container mx-auto px-6 py-20 text-center relative">
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-green-600/10 blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-gray-900 via-green-800 to-gray-900 bg-clip-text text-transparent leading-tight">
            Peça direto do seu celular
          </h2>
          <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-gray-600 leading-relaxed">
            Com o PedeBar, você pode fazer pedidos diretamente da sua mesa sem precisar chamar o garçom.
          </p>
          <div className="space-x-6 mb-20">
            <Button variant="outline" className="border-green-200 hover:bg-green-50 text-green-700 hover:text-green-800 transition-all duration-200 h-12 px-8 text-lg" size="lg">
              Saiba Mais
            </Button>
            <Link to="/register">
              <Button className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 h-12 px-8 text-lg" size="lg">
                Comece Agora
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <section className="container mx-auto px-6 py-20 relative">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-card p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100/50">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Pedidos Rápidos</h3>
            <p className="text-gray-600 leading-relaxed">
              Faça seu pedido em segundos e receba no conforto da sua mesa.
            </p>
          </div>
          <div className="glass-card p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100/50">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Cardápio Digital</h3>
            <p className="text-gray-600 leading-relaxed">
              Acesse o cardápio completo com fotos e descrições detalhadas.
            </p>
          </div>
          <div className="glass-card p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-green-100/50">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-gray-900">Pagamento Facilitado</h3>
            <p className="text-gray-600 leading-relaxed">
              Pague diretamente pelo aplicativo, sem complicações.
            </p>
          </div>
        </div>
      </section>
    </div>;
};

export default Index;
