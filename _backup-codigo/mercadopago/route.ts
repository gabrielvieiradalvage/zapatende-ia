import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Inicializa o Supabase Bypass com a Service Role Key para salvar o status de pagamento
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  try {
    // 1. Captura os dados enviados pelo Mercado Pago
    const body = await req.json()
    
    // O Mercado Pago envia o ID do pagamento dentro de body.data.id quando o type é payment
    const paymentId = body.data?.id || body.id
    const topic = body.type || body.topic

    // Se a notificação não for de um pagamento criado ou atualizado, ignora com segurança
    if (topic !== 'payment') {
      return NextResponse.json({ status: 'ignored' }, { status: 200 })
    }

    console.log(`⚡ WEBHOOK MERCADO PAGO: Verificando o pagamento ID: ${paymentId}`)

    // 2. Consulta oficial na API do Mercado Pago usando o seu Token Secreto para validar o Pix
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`
      }
    })

    if (!mpResponse.ok) {
      console.error('❌ Erro ao consultar pagamento na API do Mercado Pago.')
      return NextResponse.json({ error: 'Erro na consulta do gateway' }, { status: 400 })
    }

    const paymentData = await mpResponse.json()
    
    // 3. Captura o status real do Pix ('approved', 'pending', 'rejected')
    const paymentStatus = paymentData.status
    
    // Na hora de criar o Pix no site, você deve enviar o org_id e o plan_id dentro do campo metadata!
    const orgId = paymentData.metadata?.org_id
    const chosenPlanId = paymentData.metadata?.plan_id

    console.log(`💰 STATUS DO PIX ID ${paymentId}: [${paymentStatus}]`)

    if (paymentStatus === 'approved' && orgId && chosenPlanId) {
      console.log(`✅ CONFIRMADO! Liberando plano para a Org ID: ${orgId}`)

      // 4. Libera as travas visuais e operacionais da IA alterando para 'active'
      const { error } = await supabase
        .from('organizations')
        .update({
          plan_id: chosenPlanId,
          subscription_status: 'active',
          gateway_customer_id: paymentId // Guarda o ID do Pix como rastro
        })
        .eq('id', orgId)

      if (error) throw error
    }

    // Retorna status 200/201 obrigatório para o Mercado Pago parar de reenviar a notificação
    return NextResponse.json({ success: true }, { status: 200 })

  } catch (err: any) {
    console.error('❌ Erro crítico no processador do Webhook:', err.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}