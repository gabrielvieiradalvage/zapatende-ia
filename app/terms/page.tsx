'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase as supabaseClient } from '../../src/lib/client'

const supabase = supabaseClient as any

export default function TermsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email ?? null)
      setLoading(false)
    }
    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="text-emerald-400 animate-pulse text-sm font-semibold">Carregando termos legais...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex select-none">
      
      {/* 🧭 BARRA LATERAL */}
      <aside className="hidden md:flex w-64 border-r border-neutral-800 bg-neutral-900/20 p-6 flex-col justify-between shrink-0">
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

      {/* 🖥️ TEXTO DOS TERMOS */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 space-y-6 overflow-y-auto max-w-4xl">
        <div className="md:hidden flex flex-wrap gap-2">
          <button onClick={() => router.push('/overview')} className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold">Início</button>
          <button onClick={() => router.push('/chat')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-200 text-xs font-semibold">Conversas</button>
          <button onClick={() => router.push('/appointments')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-200 text-xs font-semibold">Agendamentos</button>
          <button onClick={() => router.push('/knowledge-base')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-200 text-xs font-semibold">Treinar IA</button>
          <button onClick={() => router.push('/connections')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-200 text-xs font-semibold">Conexões</button>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">📋 Termos de Serviço</h1>
          <p className="text-sm text-neutral-400 mt-1">Políticas de conformidade, segurança criptográfica e direitos do consumidor.</p>
        </div>

        <div className="border border-neutral-800 bg-neutral-900/10 rounded-2xl p-6 text-xs text-neutral-300 space-y-4 font-sans leading-relaxed overflow-y-auto max-h-[70vh] custom-scrollbar">
          <p className="font-bold text-sm text-white">TERMOS DE SERVIÇO E POLÍTICA DE PRIVACIDADE – ZAPATENDE AI</p>
          <p className="italic text-neutral-500">Última atualização: Junho de 2026.</p>
          <hr className="border-neutral-800" />
          
          <p><strong>1. OBJETO DO SERVIÇO</strong><br />O ZapAtende AI é uma ferramenta de software como serviço (SaaS) que fornece automação de mensagens e gerenciamento de agendamentos eletrônicos integrados a contas do WhatsApp através do escaneamento de QR Code.</p>
          
          <p><strong>2. COLETA DE DADOS, PRIVACIDADE E CRIPTOGRAFIA (Conformidade LGPD)</strong><br />• <em>Coleta Restrita:</em> Nós coletamos apenas as informações estritamente necessárias para a operação do sistema (e-mail do lojista, logs de contatos e mensagens recebidas no privado).<br />• <em>Blindagem e Criptografia Militar:</em> Em total conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/18), <strong>todos os dados altamente sensíveis de terceiros (como nomes de clientes e números de telefone de WhatsApp) são criptografados utilizando o algoritmo AES antes de serem gravados em nosso banco de dados</strong>. Ninguém, além do detentor da chave mestra da organização, possui capacidade técnica de ler tais registros.<br />• <em>Isenção de Grupos:</em> O sistema possui um escudo de segurança que não coleta, não processa e não armazena nenhuma informação vinda de grupos de WhatsApp.</p>
          
          <p><strong>3. PLANOS, CONSUMO E CONTROLE DE LIMITES (Metered Billing)</strong><br />• <em>Plano Gratuito (Trial):</em> Limitado estritamente ao envio de <strong>50 mensagens automáticas</strong>. Ao atingir este teto, o robô suspenderá os disparos de forma automática e imediata até que um upgrade seja realizado.<br />• <em>Planos Pagos:</em> O limite mensal de mensagens segue à risca a cota contratada na aba de faturamento (1.500 mensagens, 5.000 mensagens ou Ilimitado).</p>
          
          <p><strong>4. SISTEMA DE PAGAMENTO E CANCELAMENTO (Alinhado ao CDC)</strong><br />• <em>Modelo de Cobrança:</em> Nosso SaaS opera sob o formato de assinatura mensal pré-paga realizada exclusivamente via Pix (Chave Copia e Cola ou QR Code).<br />• <em>Direito de Arrependimento (Art. 49 do CDC):</em> Em conformidade com o Código de Defesa do Consumidor (Lei nº 8.078/90), o usuário tem o direito de solicitar o reembolso integral dos valores pagos em até <strong>7 (sete) dias ocorrido</strong> a contar da data de ativação da assinatura, desde que não tenha havido abuso ou uso fraudulento dos limites do plano.<br />• <em>Cancelamento Voluntário:</em> A assinatura pode ser cancelada a qualquer momento pelo usuário. Por se tratar de um modelo manual baseado em Pix pré-pago, basta o lojista interromper os pagamentos mensais. O acesso permanecerá ativo até o final do ciclo de 30 dias já quitado.</p>
          
          <p><strong>5. RESPONSABILIDADE SOBRE A INSTÂNCIA DO WHATSAPP</strong><br />O ZapAtende AI fornece apenas a infraestrutura técnica de automação. O usuário é o único e total responsável pela maturação do chip, teor das mensagens enviadas e pela utilização consciente do WhatsApp, isentando a plataforma de qualquer responsabilidade em casos de banimentos ou bloqueios aplicados pela empresa Meta Platforms Inc.</p>
        </div>
      </main>
    </div>
  )
}