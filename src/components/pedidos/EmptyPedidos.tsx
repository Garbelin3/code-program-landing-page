
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

export const EmptyPedidos = () => {
  return (
    <div className="text-center py-16 bg-white rounded-lg shadow">
      <ShoppingBag className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <p className="text-lg text-gray-600 mb-4">Você ainda não fez nenhum pedido.</p>
      <Button asChild>
        <Link to="/dashboard">Encontrar bares</Link>
      </Button>
    </div>
  );
};
