import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { supabaseExtended } from "@/integrations/supabase/customClient";
import { toast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrCode, Clock, CheckCircle } from "lucide-react";
import { formatarData } from "@/components/pedidos/verificar-retirada/utils";
import { QRCodeSVG } from "qrcode.react";

interface CodigoRetirada {
  id: string;
  codigo: string;
  pedido_id: string;
  itens: Record<string, number>;
  usado: boolean;
  invalidado: boolean;
  created_at: string;
  pedido?: {
    bar: {
      name: string;
    }
  };
}

export const MeusCodigosTab = () => {
  const [codigos, setCodigos] = useState<CodigoRetirada[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [codigoExpandido, setCodigoExpandido] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    };
    
    getUser();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const fetchCodigos = async () => {
      setLoading(true);
      try {
        // Buscar todos os códigos de retirada não utilizados do usuário
        const { data, error } = await supabaseExtended
          .from("codigos_retirada")
          .select(`
            *,
            pedido:pedido_id (
              bar:bar_id (
                name
              )
            )
          `)
          .eq("usado", false)
          .eq("invalidado", false)
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        
        // Filtrar apenas códigos de pedidos do usuário atual
        // Isso é feito em memória pois precisamos primeiro buscar os pedidos do usuário
        const { data: pedidosUsuario, error: pedidosError } = await supabaseExtended
          .from("pedidos")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "pago");
        
        if (pedidosError) throw pedidosError;
        
        const pedidosIds = pedidosUsuario.map((p: any) => p.id);
        const codigosFiltrados = data.filter((c: any) => pedidosIds.includes(c.pedido_id));
        
        setCodigos(codigosFiltrados);
      } catch (error: any) {
        toast({
          title: "Erro ao carregar códigos",
          description: error.message,
          variant: "destructive"
        });
        console.error("Error fetching codes:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCodigos();
    
    // Escutar mudanças na tabela de códigos para atualizar a lista
    const codigosChannel = supabase
      .channel('codigos-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'codigos_retirada' },
        () => {
          fetchCodigos();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(codigosChannel);
    };
  }, [user]);

  const toggleExpandirCodigo = (codigoId: string) => {
    if (codigoExpandido === codigoId) {
      setCodigoExpandido(null);
    } else {
      setCodigoExpandido(codigoId);
    }
  };

  const formatarItens = (itens: Record<string, number>) => {
    return Object.entries(itens).map(([nome, quantidade]) => (
      `${quantidade}x ${nome}`
    )).join(", ");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <p className="text-gray-500">Carregando códigos de retirada...</p>
      </div>
    );
  }

  if (codigos.length === 0) {
    return (
      <div className="text-center py-12">
        <QrCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum código de retirada ativo</h3>
        <p className="text-sm text-gray-500 mt-2">
          Você não tem nenhum código de retirada pendente.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Seus códigos de retirada ativos</h2>
      
      {codigos.map((codigo) => (
        <Card key={codigo.id} className="p-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="w-full">
              <div className="flex items-center gap-2 mb-1">
                <QrCode className="h-4 w-4 text-purple-600 flex-shrink-0" />
                <span className="font-bold text-lg">{codigo.codigo}</span>
              </div>
              
              <p className="text-sm text-gray-500 mb-2">
                {codigo.pedido?.bar?.name || "Bar"}
              </p>
              
              <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                <Clock className="h-3 w-3 flex-shrink-0" />
                <span>Gerado em {formatarData(codigo.created_at)}</span>
              </div>
              
              <p className="text-sm mb-2">
                <span className="font-medium">Itens:</span> {formatarItens(codigo.itens)}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto mt-2 sm:mt-0"
              onClick={() => toggleExpandirCodigo(codigo.id)}
            >
              {codigoExpandido === codigo.id ? "Ocultar QR" : "Ver QR"}
            </Button>
          </div>
          
          {codigoExpandido === codigo.id && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col items-center">
              <QRCodeSVG 
                value={codigo.codigo} 
                size={180}
                includeMargin={true}
                level="M"
              />
              <p className="mt-2 text-sm text-gray-600 text-center">
                Apresente este código ao funcionário para retirar seus itens
              </p>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
