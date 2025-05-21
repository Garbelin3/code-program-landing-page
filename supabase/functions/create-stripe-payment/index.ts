
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { pedidoId, barId, valorTotal, items } = await req.json();
    
    if (!pedidoId) {
      throw new Error("ID do pedido não fornecido");
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get pedido information from database
    const { data: pedido, error: pedidoError } = await supabaseClient
      .from("pedidos")
      .select(`
        id,
        valor_total,
        bars:bar_id (name, address)
      `)
      .eq("id", pedidoId)
      .single();

    if (pedidoError) {
      throw new Error(`Erro ao buscar pedido: ${pedidoError.message}`);
    }

    if (!pedido) {
      throw new Error("Pedido não encontrado");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header is missing");
    }
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    // Check if a Stripe customer record exists for this user
    let customerId;
    if (user?.email) {
      const customers = await stripe.customers.list({ 
        email: user.email, 
        limit: 1 
      });
      
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      }
    }

    // Build line items based on cart items
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: "brl",
        product_data: {
          name: item.nome,
          description: item.descricao || undefined,
        },
        unit_amount: Math.round(item.preco * 100), // Stripe expects amount in cents
      },
      quantity: item.quantidade,
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user?.email,
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${req.headers.get("origin")}/pedido-confirmado/${pedidoId}`,
      cancel_url: `${req.headers.get("origin")}/checkout/${barId}`,
      client_reference_id: pedidoId,
      metadata: {
        pedido_id: pedidoId,
        bar_id: barId,
        user_id: user?.id
      },
    });

    // Update pedido with Stripe session ID
    const { error: updateError } = await supabaseClient
      .from("pedidos")
      .update({
        stripe_session_id: session.id,
      })
      .eq("id", pedidoId);

    if (updateError) {
      console.error("Error updating pedido:", updateError);
    }

    // Return Stripe session URL
    return new Response(
      JSON.stringify({
        url: session.url,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
