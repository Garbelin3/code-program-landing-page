
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
  return <div className="min-h-screen bg-background">
      <header className="container mx-auto py-4 px-6 flex justify-between items-center border-b border-border">
        <h1 className="text-2xl font-bold text-foreground">PedeBar</h1>
        <div className="space-x-4">
          {!loading && (user ? <Link to="/dashboard">
                <Button variant="outline" className="border-border hover:bg-muted">
                  Dashboard
                </Button>
              </Link> : <>
                <Link to="/login">
                  <Button variant="outline" className="border-border hover:bg-muted">
                    Entrar
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    Cadastrar
                  </Button>
                </Link>
              </>)}
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 text-center">
        <h2 className="text-5xl md:text-6xl font-bold mb-6 text-foreground">Peça direto do seu celular</h2>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto text-muted-foreground">
          Com o PedeBar, você pode fazer pedidos diretamente da sua mesa sem precisar chamar o garçom.
        </p>
        <div className="space-x-4 mb-16">
          <Button variant="outline" className="border-border hover:bg-muted" size="lg">
            Saiba Mais
          </Button>
          <Link to="/register">
            <Button className="bg-green-600 hover:bg-green-700 text-white" size="lg">
              Comece Agora
            </Button>
          </Link>
        </div>
      </main>

      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card rounded-lg p-6 shadow-soft border border-border">
            <h3 className="text-xl font-bold mb-4 text-card-foreground">Pedidos Rápidos</h3>
            <p className="text-muted-foreground">
              Faça seu pedido em segundos e receba no conforto da sua mesa.
            </p>
          </div>
          <div className="bg-card rounded-lg p-6 shadow-soft border border-border">
            <h3 className="text-xl font-bold mb-4 text-card-foreground">Cardápio Digital</h3>
            <p className="text-muted-foreground">
              Acesse o cardápio completo com fotos e descrições detalhadas.
            </p>
          </div>
          <div className="bg-card rounded-lg p-6 shadow-soft border border-border">
            <h3 className="text-xl font-bold mb-4 text-card-foreground">Pagamento Facilitado</h3>
            <p className="text-muted-foreground">
              Pague diretamente pelo aplicativo, sem complicações.
            </p>
          </div>
        </div>
      </section>
    </div>;
};

export default Index;
