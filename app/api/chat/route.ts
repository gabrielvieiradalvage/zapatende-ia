import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message, organizationId } = await request.json()

    if (!message || !organizationId) {
      return NextResponse.json({ error: 'Mensagem e OrganizationId são obrigatórios.' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Configuração ausente: GEMINI_API_KEY não encontrada no .env' }, { status: 500 })
    }

    // 1. Chamada direta e leve para a API oficial do Gemini
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
    
    const responseGemini = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }]
      })
    })

    const data = await responseGemini.json()

    if (data.error) {
      throw new Error(data.error.message || 'Erro interno na API do Gemini')
    }

    // 2. Extrai o texto limpo retornado pela Inteligência Artificial
    const respostaRealDAIA = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Desculpe, não consegui processar seu pensamento.'

    // 3. Devolve a resposta real para a sua tela de chat
    return NextResponse.json({ response: respostaRealDAIA })

  } catch (error: any) {
    console.error('Erro na rota API:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}