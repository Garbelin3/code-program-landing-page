
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

    // Start a transaction to update order status and item quantities
    const { data: order, error: fetchError } = await supabaseClient
      .from('pedidos')
      .select('id')
      .eq('codigo_retirada', code)
      .eq('status', 'confirmado')
      .single()

    if (fetchError || !order) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Código de retirada não encontrado ou pedido já finalizado.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Set all items as fully retrieved (quantidade_restante = 0)
    const { error: itemsError } = await supabaseClient
      .from('pedido_items')
      .update({ quantidade_restante: 0 })
      .eq('pedido_id', order.id)

    if (itemsError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao atualizar itens do pedido.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Update order status to finalizado
    const { error: updateError } = await supabaseClient
      .from('pedidos')
      .update({ 
        status: 'finalizado',
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Erro ao atualizar status do pedido.' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Pedido finalizado com sucesso.'
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
