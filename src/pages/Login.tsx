
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        data: {
          session
        },
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        throw error;
      }

      if (!session) {
        throw new Error("Falha ao obter sessão");
      }

      // Buscar o perfil do usuário para obter o papel
      const {
        data: profileData,
        error: profileError
      } = await supabase.from("profiles").select("role, bar_id").eq("id", session.user.id).single();
      
      if (profileError) {
        throw profileError;
      }

      toast("Login bem-sucedido", {
        description: "Você foi autenticado com sucesso!"
      });
      
      console.log("Login bem-sucedido, role:", profileData.role);

      // Redirecionar com base no papel
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast.error("Erro ao fazer login", {
        description: error.message || "Ocorreu um erro ao tentar fazer login",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAdminUser = async () => {
    setCreatingAdmin(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('create-admin');
      if (error) {
        throw error;
      }
      toast("Usuário administrador criado", {
        description: "Usuário administrador criado com sucesso! Email: admin@codeprogram.com.br, Senha: codeprogram2025@Admin"
      });

      // Preenche os campos com as credenciais do admin
      setEmail("admin@codeprogram.com.br");
      setPassword("codeprogram2025@Admin");
    } catch (error: any) {
      toast.error("Erro ao criar usuário administrador", {
        description: error.message || "Ocorreu um erro ao criar o usuário administrador.",
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  return <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-b from-blue-500 to-purple-600 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">PedeBar</h1>
          <p className="text-gray-600 mt-2">Entre na sua conta</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="********" required />
          </div>
          
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>
        
        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Não tem uma conta?{" "}
            <Link to="/register" className="text-blue-600 hover:underline">
              Cadastre-se
            </Link>
          </p>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-200">
          
        </div>
      </div>
    </div>;
};

export default Login;
