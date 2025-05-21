
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body
    const { pedidoId } = await req.json();
    
    if (!pedidoId) {
      throw new Error("ID do pedido não fornecido");
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get pedido information from database
    const { data: pedido, error: pedidoError } = await supabaseClient
      .from("pedidos")
      .select("id, stripe_session_id")
      .eq("id", pedidoId)
      .maybeSingle();

    if (pedidoError) {
      throw new Error(`Erro ao buscar pedido: ${pedidoError.message}`);
    }

    if (!pedido) {
      throw new Error("Pedido não encontrado");
    }
    
    if (!pedido.stripe_session_id) {
      return new Response(
        JSON.stringify({ 
          status: "unknown",
          message: "Pedido sem ID de sessão do Stripe" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    // Retrieve the session to check payment status
    const session = await stripe.checkout.sessions.retrieve(pedido.stripe_session_id);
    
    // Check the payment status
    let paymentStatus = "pending";
    if (session.payment_status === "paid") {
      paymentStatus = "paid";
      
      // Update the pedido status in the database
      await supabaseClient
        .from("pedidos")
        .update({ 
          status: "pago",
          data_pagamento: new Date().toISOString()
        })
        .eq("id", pedidoId);
    } else if (session.status === "expired" || session.status === "canceled") {
      paymentStatus = "failed";
    }

    return new Response(
      JSON.stringify({
        status: paymentStatus,
        session: session.status,
        payment_status: session.payment_status
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
