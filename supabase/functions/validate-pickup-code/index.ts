
// Follow this setup guide to integrate the Deno runtime into your project:
// https://deno.com/manual/getting_started/setup

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get('SUPABASE_URL') ?? '',
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the request body
    const { code } = await req.json()

    // Validate code format
    if (!code || !/^\d{6}$/.test(code)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Código de retirada inválido. Deve ser 6 dígitos numéricos.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Fetch order by code
    const { data: order, error } = await supabaseClient
      .from('pedidos')
      .select(`
        id,
        user_id,
        bars!inner(name, address),
        pedido_items!inner(
          nome_produto,
          quantidade,
          quantidade_restante
        ),
        codigo_retirada,
        status
      `)
      .eq('codigo_retirada', code)
      .eq('status', 'confirmado')
      .single()

    if (error || !order) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Código de retirada não encontrado ou pedido já finalizado.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Format items for response
    const formattedItems = order.pedido_items.map(item => ({
      name: item.nome_produto,
      quantity: item.quantidade_restante || 0
    })).filter(item => item.quantity > 0)

    return new Response(
      JSON.stringify({ 
        success: true,
        order: {
          id: order.id,
          items: formattedItems,
          customer_id: order.user_id
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
