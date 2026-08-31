import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Trata a requisição de pré-voo (CORS)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { keyword, nome_empresa, endereco, rating, knowledgeBase } = await req.json()
    
    if (!nome_empresa) {
      throw new Error("Dados do lead (Nome da Empresa) não fornecidos.")
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY não configurada no servidor.")
    }

    // Se o usuário tiver um RAG (Knowledge Base), nós injetamos aqui.
    const customKnowledge = knowledgeBase && knowledgeBase.trim().length > 0 
      ? `\n\n--- INFORMAÇÕES SOBRE A MINHA EMPRESA (O QUE EU VENDO) ---\n${knowledgeBase}\n-------------------------------------------------------\nOBSERVAÇÃO: Baseie sua oferta estritamente nas informações acima, se aplicável.`
      : '';

    // Prompt engenhoso de vendas com dados reais
    let prompt = `
Aja como um especialista em vendas B2B e Growth Hacker.
Eu uso uma plataforma que varre o Google Maps e extrai contatos comerciais (Leads).
Eu preciso enviar uma mensagem no WhatsApp para este lead abordando-o pela primeira vez ("Cold Message").
${customKnowledge}

DADOS DA EMPRESA (LEAD):
- Nome: ${nome_empresa}
- Nicho/Termo pesquisado: ${keyword || 'Não informado'}
- Avaliação no Google: ${rating ? rating + ' Estrelas' : 'Não informada'}
- Localização: ${endereco || 'Não informada'}

OBJETIVO:
Crie UMA mensagem curta, persuasiva, muito educada e humana para o WhatsApp da empresa.
Você deve puxar conversa e despertar curiosidade sobre como posso ajudar a empresa dele a ter mais clientes/faturamento (ou melhorar a presença digital), pedindo permissão para enviar um material rápido.

REGRAS OBRIGATÓRIAS:
1. Mantenha BEM curto (no máximo 3 a 4 parágrafos bem pequenos).
2. Não use palavras difíceis ou jargões. Fale de forma amigável.
3. No primeiro parágrafo, chame a empresa pelo nome ("${nome_empresa}").
4. Se a nota for maior que 4.5, elogie o atendimento deles e a nota do Google logo de cara (ex: "Vi que vocês têm excelentes ${rating} estrelas no Google").
5. Finalize com uma pergunta aberta e leve para estimular a resposta (ex: "Teria interesse em dar uma olhada rápida sem compromisso?").
6. Retorne APENAS o texto exato da mensagem que será copiada e colada no WhatsApp. Não inclua comentários seus, nem saudação sua, nem aspas envolventes.
    `.trim();

    // Chamada REST para a API do Google Gemini
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
        }
      })
    })

    const data = await response.json()

    if (!response.ok) {
      console.error("Erro da API Gemini:", data)
      throw new Error("Falha ao comunicar com a IA do Google.")
    }

    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    return new Response(
      JSON.stringify({ message: generatedText.trim() }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
