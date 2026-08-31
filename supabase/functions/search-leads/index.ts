import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Trata requisições OPTIONS (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { keyword, location } = await req.json()
    
    if (!keyword || !location) {
      return new Response(
        JSON.stringify({ error: 'Keyword and location are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const query = `${keyword} in ${location}`
    
    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('SUPABASE_ANON_KEY')
    
    if (!SERPER_API_KEY) throw new Error('SERPER_API_KEY is missing')
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase env vars missing')

    // Inicializa o cliente do Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // PASSO 1: Verificar se existe cache recente (ex: últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: historyData, error: historyError } = await supabase
      .from('search_history')
      .select('id, last_searched_at')
      .eq('keyword', keyword.toLowerCase().trim())
      .eq('location', location.toLowerCase().trim())
      .gte('last_searched_at', sevenDaysAgo.toISOString())
      .order('last_searched_at', { ascending: false })
      .limit(1)
      .single();

    // Se encontramos um cache recente, devolvemos do banco!
    if (historyData) {
      console.log(`Cache HIT for ${query} (Search ID: ${historyData.id})`);
      const { data: cachedLeads, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('search_id', historyData.id)
        .order('created_at', { ascending: true });

      if (cachedLeads && cachedLeads.length > 0) {
        return new Response(JSON.stringify({ success: true, count: cachedLeads.length, leads: cachedLeads, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        })
      }
    }

    // PASSO 2: Não tem cache. Buscar no Google (Serper.dev)
    console.log(`Cache MISS for ${query}. Fetching from Serper...`);
    
    let allPlaces: any[] = [];
    
    // Loop to fetch up to 3 pages of results (approx 60 leads)
    for (let page = 1; page <= 3; page++) {
      const serperResponse = await fetch('https://google.serper.dev/places', {
        method: 'POST',
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ q: query, page: page })
      })

      const serperData = await serperResponse.json()
      
      if (serperData.places && serperData.places.length > 0) {
        allPlaces = [...allPlaces, ...serperData.places];
      } else {
        break; // No more results
      }
    }

    // Remove duplicados pelo título
    const uniquePlaces = allPlaces.filter((place, index, self) =>
      index === self.findIndex((t) => (
        t.title === place.title
      ))
    )

    if (uniquePlaces.length === 0) {
      return new Response(JSON.stringify({ success: true, count: 0, leads: [], cached: false }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      })
    }

    // PASSO 3: Salvar no Banco de Dados
    // 3.1: Criar entrada no Histórico
    const { data: newHistory, error: insertHistoryError } = await supabase
      .from('search_history')
      .insert({
        keyword: keyword.toLowerCase().trim(),
        location: location.toLowerCase().trim()
      })
      .select('id')
      .single();

    let searchId = newHistory?.id;

    // Formata os leads encontrados
    const leads = uniquePlaces.map((place: any) => ({
      search_id: searchId || null,
      nome_empresa: place.title,
      telefone: place.phoneNumber || null,
      endereco: place.address || null,
      website: place.website || null,
      rating: place.rating || null,
      fonte_captacao: 'Google Maps (Serper.dev)',
      keyword_buscada: keyword,
      location_buscada: location,
      status: 'Novo'
    }))

    // 3.2: Salvar Leads no Supabase
    let leadsInsertError = null;
    if (searchId) {
      const { error } = await supabase.from('leads').insert(leads);
      leadsInsertError = error;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      count: leads.length, 
      leads: leads, 
      cached: false,
      debug: { insertHistoryError, leadsInsertError }
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    })

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
