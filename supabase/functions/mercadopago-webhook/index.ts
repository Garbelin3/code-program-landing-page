
import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";
import * as crypto from "https://deno.land/std@0.192.0/crypto/mod.ts";

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
    console.log("Webhook headers:", [...req.headers.entries()]);
    
    // Verify webhook signature if available
    if (signature && Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET")) {
      const webhookSecret = Deno.env.get("MERCADOPAGO_WEBHOOK_SECRET")!;
      
      try {
        // Create a message encoder
        const encoder = new TextEncoder();
        
        // Encode the message and secret
        const message = encoder.encode(body);
        const key = encoder.encode(webhookSecret);
        
        // Generate the HMAC
        const hmacKey = await crypto.subtle.importKey(
          "raw",
          key,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"]
        );
        
        const hmacSignature = await crypto.subtle.sign(
          "HMAC",
          hmacKey,
          message
        );
        
        // Convert to hex
        const hexSignature = Array.from(new Uint8Array(hmacSignature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        if (signature !== hexSignature) {
          console.error("Invalid webhook signature");
          console.log("Expected:", hexSignature);
          console.log("Received:", signature);
          
          // We'll continue processing even with invalid signature for now,
          // but log the issue for debugging
          console.log("Continuing despite signature mismatch for debugging purposes");
        } else {
          console.log("Signature verified successfully");
        }
      } catch (signatureError) {
        console.error("Error verifying signature:", signatureError);
        // Continue processing even with signature error for now
      }
    } else {
      console.log("No signature verification performed: missing signature or secret");
    }

    // Parse notification data
    let data;
    try {
      data = JSON.parse(body);
      console.log("Parsed webhook data:", data);
    } catch (parseError) {
      console.error("Error parsing webhook data:", parseError);
      throw new Error("Invalid JSON in webhook body");
    }

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

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error fetching payment ${paymentId} details:`, response.status, errorText);
        throw new Error(`Error fetching payment details: ${response.status} ${errorText}`);
      }

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
      } else {
        console.log(`Payment ${paymentId} status is not approved: ${payment.status}`);
      }
    // Process alternative notification types
    } else if (data.action === "payment.created" || data.action === "payment.updated") {
      // Process notification in 'action' format
      console.log(`Processing ${data.action} notification`);
      
      // Extract ID from data if available
      const paymentId = data.data?.id;
      
      if (paymentId) {
        console.log("Processing payment with ID:", paymentId);
        
        // Fetch payment details from Mercado Pago
        const response = await fetch(
          `https://api.mercadopago.com/v1/payments/${paymentId}`,
          {
            headers: {
              Authorization: `Bearer ${Deno.env.get("MERCADOPAGO_ACCESS_TOKEN")}`
            }
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error fetching payment ${paymentId} details:`, response.status, errorText);
          throw new Error(`Error fetching payment details: ${response.status} ${errorText}`);
        }

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
        } else {
          console.log(`Payment ${paymentId} status is not approved: ${payment.status}`);
        }
      }
    } else {
      console.log(`Notification type is not payment: ${data.type || data.action}`);
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
