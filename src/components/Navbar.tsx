import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User | null;
  onLogout?: () => void;
}

export const Navbar = ({ user, onLogout }: NavbarProps) => {
  if (!user) return null;

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto py-4 px-6 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <Link to="/dashboard">
            <h1 className="text-2xl font-bold text-gray-900">PedeBar</h1>
          </Link>
          <nav className="flex items-center space-x-4">
            <Link to="/dashboard">
              <Button variant="ghost">Início</Button>
            </Link>
            <Link to="/meus-pedidos">
              <Button variant="ghost">Meus Pedidos</Button>
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          {onLogout && (
            <Button variant="outline" onClick={onLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" /> Sair
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}; 