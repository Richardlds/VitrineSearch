import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

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
    const { keyword, location } = await req.json()
    const query = `${keyword} em ${location}`

    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY')
    
    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY is missing')
    }

    // Faz a chamada ao Serper.dev (Google Places / Maps)
    const serperResponse = await fetch('https://google.serper.dev/places', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ q: query })
    })

    const serperData = await serperResponse.json()

    if (!serperData.places || serperData.places.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0, leads: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // Formata os leads encontrados
    const leads = serperData.places.map((place: any) => ({
      nome_empresa: place.title,
      telefone: place.phoneNumber || null,
      endereco: place.address || null,
      website: place.website || null,
      rating: place.rating || null,
      fonte_captacao: 'Google Maps (Serper.dev)',
      keyword_buscada: query,
      status: 'Novo'
    }))

    // Inicializa cliente do Supabase para salvar os leads
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    )

    // Insere no banco
    const { data, error } = await supabaseClient
      .from('leads')
      .insert(leads)
      .select()

    if (error) {
      throw error
    }

    return new Response(JSON.stringify({ success: true, count: leads.length, leads: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })
  }
})
