
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Verify payment function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body
    const { pedidoId, sessionId } = await req.json();
    
    if (!pedidoId && !sessionId) {
      console.error("No pedidoId or sessionId provided");
      return new Response(
        JSON.stringify({ error: "pedidoId or sessionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verifying payment for order ${pedidoId || 'with session ' + sessionId}`);

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Find the order
    let order;
    let orderError;

    if (pedidoId) {
      // Find by pedido ID
      const result = await supabaseClient
        .from("pedidos")
        .select("*")
        .eq("id", pedidoId)
        .single();
      
      order = result.data;
      orderError = result.error;
      
      if (orderError) {
        console.error(`Error fetching order with ID ${pedidoId}:`, orderError);
        return new Response(
          JSON.stringify({ error: `Order not found: ${orderError.message}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (!order) {
        console.error(`No order found with ID: ${pedidoId}`);
        return new Response(
          JSON.stringify({ error: "Order not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else if (sessionId) {
      // Find by Stripe session ID
      const result = await supabaseClient
        .from("pedidos")
        .select("*")
        .eq("stripe_session_id", sessionId)
        .single();
      
      order = result.data;
      orderError = result.error;
      
      if (orderError) {
        console.error(`Error fetching order with session ID ${sessionId}:`, orderError);
        return new Response(
          JSON.stringify({ error: `Order not found: ${orderError.message}` }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (!order) {
        console.error(`No order found with session ID: ${sessionId}`);
        return new Response(
          JSON.stringify({ error: "Order not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    console.log(`Found order: ${order.id} with current status: ${order.status}`);
    
    // If order is already paid, return success
    if (order.status === "pago") {
      console.log(`Order ${order.id} is already marked as paid`);
      return new Response(
        JSON.stringify({ 
          status: "success", 
          message: "Payment already verified", 
          order: order 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check the payment status in Stripe
    const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
    console.log(`Retrieved Stripe session: ${session.id}, status: ${session.payment_status}`);
    
    if (session.payment_status === "paid") {
      // Update the order status to "pago" and set payment date
      const { error: updateError } = await supabaseClient
        .from("pedidos")
        .update({
          status: "pago",
          data_pagamento: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) {
        console.error(`Error updating order ${order.id} status to "pago":`, updateError);
        return new Response(
          JSON.stringify({ error: `Failed to update order status: ${updateError.message}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Successfully updated order ${order.id} status to "pago"`);
      
      // Get the updated order
      const { data: updatedOrder } = await supabaseClient
        .from("pedidos")
        .select("*")
        .eq("id", order.id)
        .single();
      
      return new Response(
        JSON.stringify({ 
          status: "success", 
          message: "Payment verified and order updated", 
          order: updatedOrder 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      console.log(`Order ${order.id} payment status is not paid yet: ${session.payment_status}`);
      return new Response(
        JSON.stringify({ 
          status: "pending", 
          message: "Payment not yet completed", 
          order: order 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
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
