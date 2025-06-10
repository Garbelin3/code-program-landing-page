import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface Bar {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  active: boolean;
}

export const BarList = () => {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBars = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("bars")
          .select("*")
          .eq("active", true)
          .order("name", { ascending: true });
        
        if (error) {
          throw error;
        }
        
        setBars(data || []);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar bares",
          description: error.message,
          variant: "destructive"
        });
        console.error("Error fetching bars:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBars();

    // Set up real-time subscription to listen for changes
    const channel = supabase
      .channel('bars-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bars',
          filter: 'active=eq.true'
        },
        (payload) => {
          setBars(prevBars => [...prevBars, payload.new as Bar]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'bars',
          filter: 'active=eq.true'
        },
        (payload) => {
          setBars(prevBars => 
            prevBars.map(bar => bar.id === payload.new.id ? (payload.new as Bar) : bar)
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bars'
        },
        (payload) => {
          setBars(prevBars => prevBars.filter(bar => bar.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (loading) {
    return <div className="text-center py-10">Carregando bares...</div>;
  }

  if (bars.length === 0) {
    return <div className="text-center py-10">Nenhum bar encontrado.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bars.map((bar) => (
        <Card key={bar.id} className="overflow-hidden border border-green-100/80 bg-white/80 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl">
          <CardHeader className="bg-green-100/60 rounded-t-2xl">
            <CardTitle className="text-green-900 font-bold text-xl">{bar.name}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-start space-x-2 mb-2">
              <MapPin className="h-4 w-4 mt-1 text-green-700" />
              <p className="text-green-800">{bar.address}</p>
            </div>
            {bar.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-green-700" />
                <p className="text-green-800">{bar.phone}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              size="sm" 
              className="w-full bg-green-900 text-white font-semibold rounded-lg hover:bg-green-800 transition-all"
              asChild
            >
              <Link to={`/cardapio/${bar.id}`}>Ver Cardápio</Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
