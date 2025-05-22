
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
    
    console.log("Verifying payment for:", preferenceId, pedidoId);

    if (!preferenceId || !pedidoId) {
      return new Response(
        JSON.stringify({ error: "preferenceId e pedidoId são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check payment status with Mercado Pago API
    console.log("Checking payment with Mercado Pago API for pedido:", pedidoId);
    
    // First try to search by external_reference (pedidoId)
    const searchResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/search?external_reference=${pedidoId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")}`
        }
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error(`Error searching payments by external reference: ${searchResponse.status}`, errorText);
      throw new Error(`Error searching payments: ${searchResponse.status} ${errorText}`);
    }

    const paymentData = await searchResponse.json();
    console.log("Payment search response:", paymentData);
    
    // Find approved payment
    const approvedPayment = paymentData.results.find(
      (payment: any) => payment.status === "approved"
    );
    
    console.log("Approved payment found:", approvedPayment ? "Yes" : "No");

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (approvedPayment) {
      console.log("Updating pedido status to 'pago'");
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
        console.error("Error updating pedido:", error);
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Pedido updated successfully:", data);
      return new Response(
        JSON.stringify({ paid: data?.[0]?.status === "pago", paymentId: approvedPayment.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If no approved payment was found, check the pedido status one more time
    // It might have been updated by the webhook
    const { data: pedidoData, error: pedidoError } = await supabase
      .from("pedidos")
      .select("status")
      .eq("id", pedidoId)
      .single();
      
    if (pedidoError) {
      console.error("Error checking pedido status:", pedidoError);
    } else {
      console.log("Current pedido status:", pedidoData?.status);
      if (pedidoData?.status === "pago") {
        return new Response(
          JSON.stringify({ paid: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ paid: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Internal server error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor", detail: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
