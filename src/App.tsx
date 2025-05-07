
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AccessControl } from "@/components/AccessControl";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      
      if (session?.user) {
        // Fetch user role
        const { data: profileData } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single();
          
        if (profileData) {
          setUserRole(profileData.role);
        }
      }
      
      setLoading(false);

      // Set up auth state listener
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_, session) => {
          setUser(session?.user || null);
          
          if (session?.user) {
            // Fetch user role
            const { data: profileData } = await supabase
              .from("profiles")
              .select("role")
              .eq("id", session.user.id)
              .single();
              
            if (profileData) {
              setUserRole(profileData.role);
            }
          } else {
            setUserRole(null);
          }
        }
      );

      return () => subscription.unsubscribe();
    };

    getUser();
  }, []);

  // Function to determine where to redirect a professional user
  const getRedirectPath = () => {
    if (!userRole || userRole === 'user') return "/dashboard";
    return "/dashboard"; // All roles go to dashboard which will show the appropriate content
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index user={user} loading={loading} />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to={getRedirectPath()} /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={
                user ? (
                  <Navigate to={getRedirectPath()} />
                ) : (
                  <Register />
                )
              } 
            />
            <Route 
              path="/dashboard" 
              element={
                !user && !loading ? (
                  <Navigate to="/login" />
                ) : (
                  <Dashboard user={user} />
                )
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
