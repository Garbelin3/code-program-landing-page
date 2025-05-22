
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

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
    const { preferenceId, pedidoId } = await req.json();

    if (!preferenceId || !pedidoId) {
      return new Response(
        JSON.stringify({ error: "preferenceId e pedidoId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check payment status with Mercado Pago API
    const response = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${pedidoId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")}`
        }
      }
    );

    const paymentData = await response.json();
    
    if (!response.ok) {
      throw new Error(`Erro ao verificar pagamento: ${paymentData.message || JSON.stringify(paymentData)}`);
    }

    // Find approved payment
    const approvedPayment = paymentData.results.find(
      (payment: any) => payment.status === "approved"
    );

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (approvedPayment) {
      // Update pedido status to "pago"
      const { data, error } = await supabase
        .from("pedidos")
        .update({
          status: "pago",
          data_pagamento: new Date().toISOString(),
        })
        .eq("id", pedidoId)
        .select("id, status");

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ paid: data?.[0]?.status === "pago", paymentId: approvedPayment.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ paid: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor", detail: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
