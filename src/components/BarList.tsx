
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, MapPin } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Bar {
  id: string;
  nome: string;
  endereco: string;
  telefone: string | null;
  ativo: boolean;
}

export const BarList = () => {
  const [bars, setBars] = useState<Bar[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBars = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("bares")
          .select("*")
          .eq("ativo", true);
        
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
      .channel('bares-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bares',
          filter: 'ativo=eq.true'
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
          table: 'bares',
          filter: 'ativo=eq.true'
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
          table: 'bares'
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
        <Card key={bar.id} className="overflow-hidden">
          <CardHeader className="bg-blue-50">
            <CardTitle>{bar.nome}</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-start space-x-2 mb-2">
              <MapPin className="h-4 w-4 mt-1 text-gray-500" />
              <p className="text-gray-600">{bar.endereco}</p>
            </div>
            {bar.telefone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <p className="text-gray-600">{bar.telefone}</p>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button size="sm" className="w-full">
              Ver Cardápio
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
