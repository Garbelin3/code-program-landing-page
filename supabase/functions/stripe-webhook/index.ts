
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// CORS headers for the webhook endpoint (for preflight requests)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  console.log("Webhook request received");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log("Handling CORS preflight request");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the request body as text
    const body = await req.text();
    console.log("Request body received");
    
    // Get the stripe signature from the request headers
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      console.error("No Stripe signature found in request headers");
      return new Response(
        JSON.stringify({ error: "No Stripe signature found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Stripe signature found");

    // Initialize Stripe with secret key from environment variables
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });
    
    // Get webhook secret from environment variables
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("Stripe webhook secret is not configured in environment variables");
      return new Response(
        JSON.stringify({ error: "Webhook secret not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify the webhook event
    let event;
    try {
      console.log("Verifying webhook signature");
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`Webhook event verified: ${event.type}`);
    } catch (err) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return new Response(
        JSON.stringify({ error: `Webhook Error: ${err.message}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Process the event
    switch (event.type) {
      case "checkout.session.completed": {
        // Handle successful checkout session completion
        const session = event.data.object;
        console.log(`Checkout completed for session: ${session.id}`);
        
        // Get the Stripe session ID
        const stripeSessionId = session.id;
        if (!stripeSessionId) {
          console.error("No session ID found in the webhook payload");
          break;
        }
        
        console.log(`Looking for order with stripe_session_id: ${stripeSessionId}`);
        
        // Find the corresponding order in Supabase
        const { data: order, error: orderError } = await supabaseClient
          .from("pedidos")
          .select("id, status")
          .eq("stripe_session_id", stripeSessionId)
          .single();

        if (orderError) {
          console.error(`Error fetching order with stripe_session_id ${stripeSessionId}:`, orderError);
          break;
        }

        if (!order) {
          console.error(`No order found for stripe_session_id: ${stripeSessionId}`);
          break;
        }

        console.log(`Found order: ${order.id} with current status: ${order.status}`);
        
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
          break;
        }

        console.log(`Successfully updated order ${order.id} status to "pago"`);
        break;
      }
      
      // Add handling for additional Stripe events if needed
      case "checkout.session.expired": {
        // Handle expired checkout sessions
        const session = event.data.object;
        console.log(`Checkout session expired: ${session.id}`);
        break;
      }
      
      default:
        // Unexpected event type
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
