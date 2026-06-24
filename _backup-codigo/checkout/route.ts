import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { planId, planName, planPrice, orgId } = await req.json()

    // Validação de segurança local
    if (!planPrice || Number(planPrice) <= 0) {
      console.error('❌ ERRO CHECKOUT: O preço do plano deve ser maior que zero. Recebido:', planPrice)
      return NextResponse.json({ error: 'Preço do plano inválido para checkout.' }, { status: 400 })
    }

    const preferenceBody = {
      items: [
        {
          id: planId,
          title: `Assinatura ZapAtende AI - ${planName}`,
          quantity: 1,
          unit_price: Number(planPrice),
          currency_id: 'BRL'
        }
      ],
      metadata: {
        org_id: orgId,
        plan_id: planId
      },
      back_urls: {
        success: `${req.headers.get('origin')}/overview?payment=success`,
        failure: `${req.headers.get('origin')}/plans?payment=failed`,
        pending: `${req.headers.get('origin')}/overview?payment=pending`
      },
      auto_return: 'approved'
    }

    // 🔄 CORREÇÃO AQUI: Alterado de /v1/preferences para /checkout/preferences
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferenceBody)
    })

    const preferenceData = await mpResponse.json()

    // Interceptador de erros caso o Token esteja errado
    if (!mpResponse.ok) {
      console.error('🔴 ERRO RETORNADO PELO MERCADO PAGO:', preferenceData)
      return NextResponse.json({ error: 'Mercado Pago recusou a criação da preferência.' }, { status: mpResponse.status })
    }

    // Pega o link de produção, se não existir, usa o de testes (sandbox)
    const linkPagamento = preferenceData.init_point || preferenceData.sandbox_init_point

    if (!linkPagamento) {
      console.error('⚠️ ALERTA: Resposta da API aceita, mas nenhum link de checkout foi gerado:', preferenceData)
      return NextResponse.json({ error: 'Nenhum link de checkout encontrado na resposta.' }, { status: 500 })
    }

    return NextResponse.json({ url: linkPagamento })

  } catch (err: any) {
    console.error('❌ Erro crítico no fluxo interno de checkout:', err.message)
    return NextResponse.json({ error: 'Erro interno ao gerar checkout' }, { status: 500 })
  }
}