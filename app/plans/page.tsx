'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase as supabaseClient } from '../../src/lib/client'

const supabase = supabaseClient as any

// 🔐 GERADOR NATIVO DE PIX COPIA E COLA (PADRÃO BACEN / EMV CO)
function generatePixPayload(key: string, amount: string) {
  const merchantAccount = `0014br.gov.bcb.pix0136${key}`
  const merchantAccountTag = `2658${merchantAccount}`
  const amountTag = `54${String(amount.length).padStart(2, '0')}${amount}`
  
  const basePayload = `000201${merchantAccountTag}520400005303986${amountTag}5802BR5912ZapAtende AI6009SAO PAULO62070503***6304`
  
  // Cálculo do Polinômio CRC16 CCITT obrigatório pelo Banco Central
  let crc = 0xFFFF
  for (let i = 0; i < basePayload.length; i++) {
    crc ^= basePayload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021
      } else {
        crc <<= 1
      }
    }
  }
  const crcString = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0')
  return `${basePayload}${crcString}`
}

export default function PlansPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('trial')
  const [showPixModal, setShowPixModal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string; rawPrice: string; period: string } | null>(null)
  const [copied, setCopied] = useState(false)

  // 📡 Controla a exibição entre faturamento mensal ou anual
  const [billingPeriod, setBillingPeriod] = useState<'mensal' | 'anual'>('mensal')

  // 📞 SEU WHATSAPP REAL CONFIGURADO
  const adminWhatsApp = '5519997216523' 

  // 🔑 SUA CHAVE PIX ALEATÓRIA REAL ATIVADA
  const pixKey = 'e25fa86a-2753-41f5-a14b-9948538167b0'

  useEffect(() => {
    async function loadSubscription() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email ?? null)

      try {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('subscription_status')
          .eq('owner_id', user.id)
          .limit(1)

        if (orgs && orgs[0]) {
          setSubscriptionStatus(orgs[0].subscription_status || 'trial')
        }
      } catch (err) {
        console.error('Erro ao buscar assinatura:', err)
      } finally {
        setLoading(false)
      }
    }
    loadSubscription()
  }, [router])

  function handleOpenPix(planName: string, planPrice: string, rawPrice: string, period: string) {
    if (planPrice === 'Grátis') {
      alert('O Plano Gratuito é ativado automaticamente na criação da conta! Para expandir seus limites, escolha uma das opções pagas. 😉')
      return
    }
    setCopied(false)
    setSelectedPlan({ name: planName, price: planPrice, rawPrice, period })
    setShowPixModal(true)
  }

  // Gera o código dinâmico do Pix Copia e Cola com base no plano clicado
  const currentPixPayload = selectedPlan ? generatePixPayload(pixKey, selectedPlan.rawPrice) : ''

  // Gera a imagem do QR Code
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentPixPayload)}`

  function handleCopyCode() {
    if (!currentPixPayload) return
    navigator.clipboard.writeText(currentPixPayload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const whatsappLink = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(
    `Olá! Acabei de fazer o Pix no valor de ${selectedPlan?.price} referente ao ciclo *${selectedPlan?.period.toUpperCase()}* do plano *${selectedPlan?.name}* no ZapAtende AI.\n\n📧 *Meu E-mail de cadastro:* ${userEmail}\n\nSegue em anexo o comprovante para liberação manual do acesso! 🚀`
  )}`

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="text-emerald-400 animate-pulse text-sm font-semibold">Carregando dados de faturamento...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex select-none">
      
      {/* 🧭 BARRA LATERAL */}
      <aside className="hidden md:flex w-64 border-r border-neutral-800 bg-neutral-900/20 p-6 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-emerald-400">🚀 ZapAtende AI</h2>
          <nav className="space-y-1">
            <button onClick={() => router.push('/overview')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Início</button>
            <button onClick={() => router.push('/chat')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Conversas</button>
            <button onClick={() => router.push('/appointments')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Agendamentos</button>
            <button onClick={() => router.push('/knowledge-base')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Treinar IA</button>
            <button onClick={() => router.push('/connections')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Conexões</button>
          </nav>
        </div>
        <div className="border-t border-neutral-800 pt-4"><p className="text-xs text-neutral-500 truncate">{userEmail}</p></div>
      </aside>

      {/* 🖥️ CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 space-y-8 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">💳 Planos & Assinatura</h1>
            <p className="text-sm text-neutral-400 mt-1">Escolha a recorrência perfeita para o seu bolso e escale suas vendas com inteligência virtual.</p>
          </div>

          {/* 🧭 SELETOR MENSAL VS ANUAL */}
          <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-xl w-fit self-start md:self-center">
            <button
              type="button"
              onClick={() => setBillingPeriod('mensal')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${billingPeriod === 'mensal' ? 'bg-neutral-800 text-emerald-400 shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              Mensal Confort
            </button>
            <button
              type="button"
              onClick={() => setBillingPeriod('anual')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${billingPeriod === 'anual' ? 'bg-neutral-800 text-purple-400 shadow' : 'text-neutral-400 hover:text-neutral-200'}`}
            >
              Anual Econômico
              <span className="bg-purple-500/10 text-purple-400 text-[9px] px-1.5 py-0.5 rounded border border-purple-500/10">Desconto</span>
            </button>
          </div>
        </div>

        {/* BANNER DE STATUS ATUAL */}
        <div className={`p-4 rounded-2xl border flex items-center justify-between max-w-6xl ${
          subscriptionStatus === 'active' 
            ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
            : 'bg-amber-500/5 border-amber-500/20 text-amber-400'
        }`}>
          <div className="flex items-center gap-3">
            <span className="text-xl">{subscriptionStatus === 'active' ? '✅' : '⏳'}</span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Status do Painel</p>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {subscriptionStatus === 'active' ? 'Assinatura Ativa - Painel Liberado' : 'Modo de Teste Gratuito (Trial)'}
              </h4>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            subscriptionStatus === 'active' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'
          }`}>
            {subscriptionStatus === 'active' ? 'PRODUÇÃO' : 'PENDENTE'}
          </span>
        </div>

        {/* CARD GRIDS DOS PLANOS REAJUSTADOS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl">
          
          {/* 1. PLANO GRATUITO */}
          <div className="border border-neutral-800 bg-neutral-900/10 p-6 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-neutral-300">Plano Gratuito</h3>
              <p className="text-xs text-neutral-400">Degustação sem compromisso para novos lojistas.</p>
              <div className="pt-2">
                <span className="text-2xl font-extrabold text-white">R$ 0</span>
                <span className="text-xs text-neutral-500"> /30 dias</span>
              </div>
              <ul className="text-xs space-y-2 text-neutral-400 pt-4">
                <li>• 1 Conexão de WhatsApp</li>
                <li className="font-semibold text-amber-400">• Limite de 50 mensagens</li>
                <li>• Filtro básico de segurança</li>
                <li>• Painel web liberado</li>
              </ul>
            </div>
            <button 
              onClick={() => handleOpenPix('Plano Gratuito', 'Grátis', '0.00', 'mensal')}
              className="w-full py-2 bg-neutral-900 text-neutral-400 font-semibold text-xs rounded-xl transition border border-neutral-800"
            >
              {subscriptionStatus === 'trial' ? 'Plano Atual' : 'Incluso'}
            </button>
          </div>

          {/* 2. PLANO INTERMEDIÁRIO (PREÇO CAMPEÃO 1) */}
          <div className="border border-neutral-800 bg-neutral-900/20 p-6 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold">Intermediário</h3>
              <p className="text-xs text-neutral-400">Perfeito para comércios locais, barbearias e deliveries pequenos.</p>
              <div className="pt-2">
                <span className="text-2xl font-extrabold text-white">
                  {billingPeriod === 'mensal' ? 'R$ 24' : 'R$ 199'}
                </span>
                <span className="text-xs text-neutral-500"> {billingPeriod === 'mensal' ? '/mês' : '/ano inteiro'}</span>
              </div>
              <ul className="text-xs space-y-2 text-neutral-300 pt-4">
                <li>• 1 Conexão de WhatsApp</li>
                <li>• Até 1.500 mensagens p/ mês</li>
                <li>• Criptografia de dados AES</li>
                <li className="text-emerald-400">{billingPeriod === 'anual' ? '✓ Desconto de R$ 89 aplicado' : '• Suporte ágil por e-mail'}</li>
              </ul>
            </div>
            <button 
              onClick={() => {
                if (billingPeriod === 'mensal') {
                  handleOpenPix('Plano Intermediário Mensal', 'R$ 24,00', '24.00', 'mensal')
                } else {
                  handleOpenPix('Plano Intermediário Anual', 'R$ 199,00', '199.00', 'anual')
                }
              }}
              disabled={subscriptionStatus === 'active'}
              className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-50 text-white font-semibold text-xs rounded-xl transition border border-neutral-800"
            >
              {subscriptionStatus === 'active' ? 'Assinatura Ativa' : 'Quero este'}
            </button>
          </div>

          {/* 3. PLANO PRO (CRAVADO EM R$ 399 NO ANUAL) */}
          <div className="border-2 border-emerald-500 bg-neutral-900/40 p-6 rounded-2xl flex flex-col justify-between space-y-6 relative">
            <span className="absolute -top-3 left-6 bg-emerald-500 text-black text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">Mais em Conta</span>
            <div className="space-y-2">
              <h3 className="text-base font-bold text-emerald-400">Plano Pro</h3>
              <p className="text-xs text-neutral-400">Alta performance de IA para lojas em expansão com fluxo constante.</p>
              <div className="pt-2">
                <span className="text-2xl font-extrabold text-white">
                  {billingPeriod === 'mensal' ? 'R$ 49' : 'R$ 399'}
                </span>
                <span className="text-xs text-neutral-500"> {billingPeriod === 'mensal' ? '/mês' : '/ano inteiro'}</span>
              </div>
              <ul className="text-xs space-y-2 text-neutral-200 pt-4">
                <li>• 1 Conexão de WhatsApp</li>
                <li>• Até 5.000 mensagens p/ mês</li>
                <li>• Memória RAM estável no motor</li>
                <li className="text-purple-400 font-semibold">• {billingPeriod === 'anual' ? '✓ Economia massiva de R$ 189' : '• IA Integrada sem delay'}</li>
              </ul>
            </div>
            <button 
              onClick={() => {
                if (billingPeriod === 'mensal') {
                  handleOpenPix('Plano Pro Mensal', 'R$ 49,00', '49.00', 'mensal')
                } else {
                  handleOpenPix('Plano Pro Anual', 'R$ 399,00', '399.00', 'anual')
                }
              }}
              disabled={subscriptionStatus === 'active'}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 text-black font-bold text-xs rounded-xl transition"
            >
              {subscriptionStatus === 'active' ? 'Assinatura Ativa' : 'Assinar Agora'}
            </button>
          </div>

          {/* 4. PLANO EMPRESARIAL (CRAVADO EM R$ 599 NO ANUAL) */}
          <div className="border border-neutral-800 bg-neutral-900/20 p-6 rounded-2xl flex flex-col justify-between space-y-6">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-purple-400">Empresarial</h3>
              <p className="text-xs text-neutral-400">Sem limites. Feito para quem quer rodar milhares de mensagens sem travar.</p>
              <div className="pt-2">
                <span className="text-2xl font-extrabold text-white">
                  {billingPeriod === 'mensal' ? 'R$ 79' : 'R$ 599'}
                </span>
                <span className="text-xs text-neutral-500"> {billingPeriod === 'mensal' ? '/mês' : '/ano inteiro'}</span>
              </div>
              <ul className="text-xs space-y-2 text-neutral-300 pt-4">
                <li>• Conexões múltiplas</li>
                <li className="font-semibold text-purple-400">• Mensagens Ilimitadas 🚀</li>
                <li>• Processador Dedicado no Robô</li>
                <li>• Prioridade de resposta</li>
              </ul>
            </div>
            <button 
              onClick={() => {
                if (billingPeriod === 'mensal') {
                  handleOpenPix('Plano Empresarial Mensal', 'R$ 79,00', '79.00', 'mensal')
                } else {
                  handleOpenPix('Plano Empresarial Anual', 'R$ 599,00', '599.00', 'anual')
                }
              }}
              disabled={subscriptionStatus === 'active'}
              className="w-full py-2.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 font-semibold text-xs rounded-xl transition border border-purple-500/30"
            >
              {subscriptionStatus === 'active' ? 'Assinatura Ativa' : 'Solicitar Escala'}
            </button>
          </div>

        </div>
      </main>

      {/* 🔐 MODAL PIX AUTOMATIZADO */}
      {showPixModal && selectedPlan && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-sm w-full text-center space-y-5">
            <div>
              <h3 className="text-base font-bold">Ativar {selectedPlan.name}</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Ciclo de faturamento: <span className="text-emerald-400 uppercase font-bold">{selectedPlan.period}</span></p>
            </div>

            {/* QR CODE VISUAL */}
            <div className="bg-white p-3 rounded-xl mx-auto w-44 h-44 flex items-center justify-center border border-neutral-800 overflow-hidden select-none">
              <img src={qrCodeUrl} alt="QR Code Pix" className="w-full h-full object-contain" draggable={false} />
            </div>

            {/* COPIA E COLA */}
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-left space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[9px] uppercase tracking-wider font-bold text-neutral-500">Pix Copia e Cola Oficial</span>
                <button 
                  type="button"
                  onClick={handleCopyCode}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition ${copied ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'}`}
                >
                  {copied ? '✓ Copiado!' : 'Copiar Código'}
                </button>
              </div>
              <p className="text-[10px] font-mono text-neutral-400 line-clamp-3 select-all break-all bg-neutral-900/50 p-2 rounded border border-neutral-900">
                {currentPixPayload}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <a 
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full block text-center py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/5"
              >
                Enviar Comprovante via WhatsApp 🚀
              </a>
              <button 
                type="button"
                onClick={() => setShowPixModal(false)}
                className="text-xs text-neutral-500 hover:text-white font-medium transition"
              >
                Voltar aos planos
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}