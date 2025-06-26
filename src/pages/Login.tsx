
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

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

      if (!session?.user) {
        throw new Error("Falha na autenticação");
      }

      // Fetch the user's profile to get their role - using maybeSingle() to avoid errors
      const {
        data: profileData,
        error: profileError
      } = await supabase.from("profiles").select("role, bar_id").eq("id", session.user.id).maybeSingle();
      
      if (profileError) {
        console.error("Erro ao buscar perfil:", profileError);
        // Continue mesmo se houver erro no perfil, usando role padrão
      }

      toast({
        title: "Login bem-sucedido",
        description: "Você foi autenticado com sucesso!"
      });

      // Redirect based on role - use default 'user' if profile not found
      const userRole = profileData?.role || 'user';
      if (userRole === 'user') {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Erro no login:", error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Erro desconhecido ao fazer login",
        variant: "destructive"
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
      toast({
        title: "Usuário administrador criado",
        description: "Usuário administrador criado com sucesso! Email: admin@codeprogram.com.br, Senha: codeprogram2025@Admin"
      });

      // Preenche os campos com as credenciais do admin
      setEmail("admin@codeprogram.com.br");
      setPassword("codeprogram2025@Admin");
    } catch (error: any) {
      toast({
        title: "Erro ao criar usuário administrador",
        description: error.message || "Ocorreu um erro ao criar o usuário administrador.",
        variant: "destructive"
      });
    } finally {
      setCreatingAdmin(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-700 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/50 via-transparent to-black/30"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-300/10 rounded-full blur-3xl"></div>
      
      <div className="relative z-10 min-h-screen flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md glass-card backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-green-100 bg-clip-text text-transparent mb-2">
              PedeBar
            </h1>
            <p className="text-green-50/80 text-lg">Entre na sua conta</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/90 font-medium">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="seu@email.com" 
                required 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-green-400/50 transition-all duration-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/90 font-medium">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                placeholder="********" 
                required 
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/15 focus:border-green-400/50 transition-all duration-200"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg hover:shadow-xl" 
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-white/70">
              Não tem uma conta?{" "}
              <Link to="/register" className="text-green-300 hover:text-green-200 hover:underline font-medium transition-colors duration-200">
                Cadastre-se
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
