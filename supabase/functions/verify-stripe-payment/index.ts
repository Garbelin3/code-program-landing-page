// Arquivo: supabase/functions/verify-stripe-payment.ts

import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@12.0.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const stripe = Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2023-10-16",
});

serve(async (req) => {
  try {
    const { sessionId, pedidoId } = await req.json();

    if (!sessionId || !pedidoId) {
      return new Response(JSON.stringify({ error: "sessionId e pedidoId são obrigatórios" }), {
        status: 400,
      });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return new Response(JSON.stringify({ paid: false }), { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data, error } = await supabase
      .from("pedidos")
      .update({
        status: "pago",
        stripe_session_id: sessionId,
        data_pagamento: new Date().toISOString(),
      })
      .eq("id", pedidoId)
      .select("id, status");

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify({ paid: data?.[0]?.status === "pago" }), {
      status: 200,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno no servidor", detail: err.message }), {
      status: 500,
    });
  }
});
