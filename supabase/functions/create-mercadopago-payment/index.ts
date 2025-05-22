
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// CORS headers for browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pedidoId, barId, valorTotal, items } = await req.json();

    if (!pedidoId || !barId || !valorTotal || !items) {
      return new Response(
        JSON.stringify({ error: "Dados obrigatórios estão faltando" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create supabase client with service role key for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch bar info
    const { data: barData, error: barError } = await supabase
      .from("bars")
      .select("name, address")
      .eq("id", barId)
      .single();

    if (barError) {
      console.error("Bar error:", barError);
      throw new Error(`Erro ao buscar informações do bar: ${barError.message}`);
    }

    console.log("Bar data:", barData);
    console.log("Creating Mercado Pago items with:", items);

    // Prepare items for Mercado Pago
    const mpItems = items.map((item: any) => ({
      id: item.id,
      title: item.nome,
      description: item.descricao || `${item.nome} em ${barData.name}`,
      quantity: item.quantidade,
      currency_id: "BRL",
      unit_price: parseFloat(item.preco)
    }));

    console.log("Mercado Pago items:", mpItems);
    console.log("Using access token:", Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")?.substring(0, 5) + "...");

    // Create Mercado Pago preference
    const mpApiUrl = "https://api.mercadopago.com/checkout/preferences";
    const response = await fetch(mpApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")}`
      },
      body: JSON.stringify({
        items: mpItems,
        back_urls: {
          success: `${req.headers.get("origin")}/pedido-confirmado/${pedidoId}`,
          failure: `${req.headers.get("origin")}/checkout/${barId}`,
          pending: `${req.headers.get("origin")}/pedido-confirmado/${pedidoId}`
        },
        auto_return: "approved",
        statement_descriptor: barData.name,
        external_reference: pedidoId,
        // Fix: using the correct format for the webhook URL
        notification_url: `https://meitoqhuhwqhzjywbxyf.functions.supabase.co/mercadopago-webhook`
      })
    });

    const mpData = await response.json();
    console.log("Mercado Pago response:", mpData);

    if (!response.ok) {
      console.error("Mercado Pago API error:", mpData);
      throw new Error(`Erro ao criar preferência de pagamento: ${mpData.message || JSON.stringify(mpData)}`);
    }

    // Update pedido with Mercado Pago preference ID
    const { error: updateError } = await supabase
      .from("pedidos")
      .update({ mercadopago_preference_id: mpData.id })
      .eq("id", pedidoId);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error(`Erro ao atualizar pedido: ${updateError.message}`);
    }

    // Return redirect URL to frontend
    return new Response(
      JSON.stringify({ 
        url: mpData.init_point,
        preferenceId: mpData.id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Erro ao processar pagamento:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
