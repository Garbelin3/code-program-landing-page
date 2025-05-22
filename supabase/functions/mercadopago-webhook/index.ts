
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import { createHmac } from "https://deno.land/std@0.192.0/crypto/mod.ts";

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
    console.log("Received webhook notification");
    
    const body = await req.text();
    const signature = req.headers.get("x-signature");
    
    // Log the webhook request details
    console.log("Webhook body:", body);
    console.log("Webhook signature:", signature);
    
    // Verify webhook signature if available
    if (signature) {
      const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET");
      if (webhookSecret) {
        const generatedSignature = createHmac("sha256", webhookSecret)
          .update(body)
          .toString("hex");
          
        if (signature !== generatedSignature) {
          console.error("Invalid webhook signature");
          console.log("Expected:", generatedSignature);
          console.log("Received:", signature);
          
          return new Response(
            JSON.stringify({ error: "Assinatura inválida" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }
      }
    }

    // Parse notification data
    const data = JSON.parse(body);
    console.log("Parsed data:", data);

    // Check if it's a payment notification
    if (data.type === "payment") {
      const paymentId = data.data.id;
      console.log("Processing payment notification for payment ID:", paymentId);
      
      // Fetch payment details from Mercado Pago
      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")}`
          }
        }
      );

      const payment = await response.json();
      console.log("Payment details:", payment);
      
      if (payment.status === "approved") {
        const pedidoId = payment.external_reference;
        
        if (!pedidoId) {
          console.error("External reference (pedidoId) not found");
          throw new Error("External reference (pedidoId) não encontrada");
        }

        console.log("Updating pedido:", pedidoId);
        
        // Update order status in database
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );

        const { data: updateData, error } = await supabase
          .from("pedidos")
          .update({
            status: "pago",
            data_pagamento: new Date().toISOString(),
          })
          .eq("id", pedidoId)
          .select("id, status");

        if (error) {
          console.error("Error updating pedido:", error);
          throw new Error(`Erro ao atualizar pedido: ${error.message}`);
        }

        console.log(`Pedido ${pedidoId} updated to status "pago"`, updateData);
        
        return new Response(
          JSON.stringify({ success: true, orderId: pedidoId }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Return success for other notification types
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno no servidor", detail: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
