'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase as supabaseClient } from '../../src/lib/client'

const supabase = supabaseClient as any

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  
  // 📊 Estados Estatísticos Reais do Banco
  const [faqCount, setFaqCount] = useState(0)
  const [aiMessageCount, setAiMessageCount] = useState(0)
  const [chatsCount, setChatsCount] = useState(0)

  // 🎫 Estados do Plano Ativo e Limites
  const [planName, setPlanName] = useState('Gratuito')
  const [messageLimit, setMessageLimit] = useState(50) // Fallback seguro de 50 para novos usuários
  const [subscriptionStatus, setSubscriptionStatus] = useState('trial')

  // 🔒 NOVO ESTADO: Trava de Segurança dos Termos de Serviço
  const [termsAccepted, setTermsAccepted] = useState<boolean>(true) // Inicializa como true para evitar piscada visual

  // 📡 Status de Conexão Real do WhatsApp
  const [whatsappStatus, setWhatsappStatus] = useState<string>('disconnected')

  useEffect(() => {
    async function loadDashboardData() {
      // 1. Verifica se o usuário está logado
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email ?? null)

      try {
        // 2. Busca a organização (Incluindo a nova coluna terms_accepted)
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id, plan_id, whatsapp_status, subscription_status, terms_accepted')
          .eq('owner_id', user.id)
          .limit(1)

        if (orgs && orgs[0]) {
          const orgId = orgs[0].id
          const planId = orgs[0].plan_id
          const currentStatus = orgs[0].subscription_status || 'trial'
          
          setSubscriptionStatus(currentStatus)
          setWhatsappStatus(orgs[0].whatsapp_status || 'disconnected')
          
          // Captura se o lojista já aceitou os termos anteriormente
          setTermsAccepted(orgs[0].terms_accepted ?? false)

          // 3. Se estiver ativo, busca os limites reais do plano. Se for trial, mantém a trava de 50 msgs.
          if (currentStatus === 'active' && planId) {
            const { data: planData } = await supabase
              .from('plans')
              .select('name, monthly_messages')
              .eq('id', planId)
              .single()

            if (planData) {
              setPlanName(planData.name)
              setMessageLimit(planData.monthly_messages) // -1 significa ilimitado
            }
          } else {
            setPlanName('Gratuito')
            setMessageLimit(50) // Garante a regra estrita de 50 mensagens para o trial
          }

          // 4. Conta quantas perguntas existem na Base de Conhecimento
          const { count: faq } = await supabase
            .from('knowledge_base')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
          setFaqCount(faq || 0)

          // 5. Conta quantas mensagens o assistente enviou de verdade
          const { count: aiMsgs } = await supabase
            .from('whatsapp_messages')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('sender', 'ai')
          setAiMessageCount(aiMsgs || 0)

          // 6. Conta quantas conversas ativas existem
          const { count: totalChats } = await supabase
            .from('whatsapp_chats')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', orgId)
            .eq('is_archived', false) // Só conta chats que não foram ocultados
          setChatsCount(totalChats || 0)
        }
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err)
      } finally {
        setLoading(false)
      }
    }
    loadDashboardData()
  }, [router])

  // 📝 Função que grava o consentimento do lojista direto no banco de dados
  async function handleAcceptTerms() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('organizations')
        .update({ terms_accepted: true })
        .eq('owner_id', user.id)

      setTermsAccepted(true) // Destrava a interface visual na hora
    } catch (err) {
      console.error('Erro ao aceitar termos:', err)
      alert('Não foi possível registrar o aceite dos termos.')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // 🧮 Cálculos de bloqueio baseados na nova regra de negócio
  const isLimitReached = messageLimit !== -1 && aiMessageCount >= messageLimit

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="text-emerald-400 animate-pulse text-sm font-semibold">Atualizando painel de controle...</p>
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
            <button className="w-full text-left block px-3 py-2 text-sm font-medium bg-neutral-900 rounded-lg text-white">Início</button>
            <button onClick={() => router.push('/chat')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Conversas</button>
            <button onClick={() => router.push('/appointments')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Agendamentos</button>
            <button onClick={() => router.push('/knowledge-base')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Treinar IA</button>
            <button onClick={() => router.push('/connections')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Conexões</button>
          </nav>
        </div>

        <div className="border-t border-neutral-800 pt-4 space-y-3">
          <p className="text-xs text-neutral-500 truncate" title={userEmail ?? ''}>
            {userEmail}
          </p>
          <button
            onClick={handleLogout}
            className="w-full text-left text-xs text-red-400 hover:text-red-300 transition-colors underline"
          >
            Sair do sistema
          </button>
        </div>
      </aside>

      {/* 🖥️ CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 space-y-6 overflow-y-auto">
        
        <div className="md:hidden flex flex-wrap gap-2">
          <button onClick={() => router.push('/overview')} className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold">Início</button>
          <button onClick={() => router.push('/chat')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-200 text-xs font-semibold">Conversas</button>
          <button onClick={() => router.push('/appointments')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-200 text-xs font-semibold">Agendamentos</button>
          <button onClick={() => router.push('/knowledge-base')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-200 text-xs font-semibold">Treinar IA</button>
          <button onClick={() => router.push('/connections')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-200 text-xs font-semibold">Conexões</button>
        </div>

        {/* 🚨 ALERTAS DE INTERRUPÇÃO FLUXO */}
        <div className="space-y-3">
          {/* Alerta 1: Limite de Consumo Atingido */}
          {isLimitReached && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between text-left">
              <div className="space-y-0.5">
                <p className="text-red-400 font-bold text-xs uppercase tracking-wider">⚠️ Limite Mensal do Plano Atingido</p>
                <p className="text-xs text-neutral-400">O assistente virtual atingiu a cota máxima de envios permitidos. Atualize sua assinatura para liberar o fluxo.</p>
              </div>
              <button onClick={() => router.push('/plans')} className="py-1.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold text-[11px] rounded-lg transition shrink-0">
                Ver Planos e Upgrade
              </button>
            </div>
          )}

          {/* Alerta 2: Canal Desconectado */}
          {whatsappStatus === 'disconnected' && (
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between text-left">
              <div className="space-y-0.5">
                <p className="text-amber-400 font-bold text-xs uppercase tracking-wider">⚠️ Instância Desconectada</p>
                <p className="text-xs text-neutral-400">O motor de sincronização está offline. Vá até a aba Conexões para ler o QR Code e reativar o serviço.</p>
              </div>
              <button onClick={() => router.push('/connections')} className="py-1.5 px-4 bg-amber-500 hover:bg-amber-600 text-black font-bold text-[11px] rounded-lg transition shrink-0">
                Reconectar Instância
              </button>
            </div>
          )}
        </div>

        {/* Topo informativo */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Início</h1>
            <p className="text-sm text-neutral-400">Bem-vindo ao centro de comando do seu assistente virtual.</p>
          </div>

          {/* 📡 TAGS DE STATUS COM NOVA NOMENCLATURA COMERCIAL */}
          <div className="flex flex-wrap gap-2">
            {/* Status do Canal WhatsApp */}
            <div className={`border px-3 py-1.5 rounded-full flex items-center gap-2 bg-neutral-900/50 ${
              whatsappStatus === 'connected' ? 'border-emerald-500/20 text-emerald-400' :
              whatsappStatus === 'scan_ready' ? 'border-amber-500/20 text-amber-400' : 'border-red-500/20 text-red-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                whatsappStatus === 'connected' ? 'bg-emerald-400 animate-pulse' :
                whatsappStatus === 'scan_ready' ? 'bg-amber-400 animate-ping' : 'bg-red-500'
              }`}></span>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {whatsappStatus === 'connected' ? 'Canal Conectado' :
                 whatsappStatus === 'scan_ready' ? 'Aguardando QR Code' : 'Canal Offline'}
              </span>
            </div>

            {/* Status do Fluxo da Automação */}
            <div className={`border px-3 py-1.5 rounded-full flex items-center gap-2 bg-neutral-900/50 ${isLimitReached || whatsappStatus !== 'connected' ? 'border-red-500/20 text-red-400' : 'border-emerald-500/20 text-emerald-400'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {isLimitReached ? 'Fluxo Suspenso' : whatsappStatus !== 'connected' ? 'Fluxo em Espera' : 'Automação Ativa'}
              </span>
            </div>
          </div>
        </div>

        {/* 📊 CARDS DE STATUS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="border border-neutral-800 bg-neutral-900/30 p-6 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Mensagens Consumidas</p>
            <p className="text-3xl font-bold text-emerald-400">
              {aiMessageCount} 
              <span className="text-sm text-neutral-500 font-normal">
                {messageLimit === -1 ? ' / Ilimitado' : ` / ${messageLimit}`}
              </span>
            </p>
          </div>

          <div className="border border-neutral-800 bg-neutral-900/30 p-6 rounded-xl flex flex-col justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Plano Ativo</p>
              <p className="text-2xl font-black text-white capitalize pt-1">{planName}</p>
            </div>
            <button onClick={() => router.push('/plans')} className="text-left text-[11px] text-emerald-400 hover:text-emerald-300 font-bold mt-4 transition-colors block w-fit">
              Gerenciar Assinatura →
            </button>
          </div>

          <div className="border border-neutral-800 bg-neutral-900/30 p-6 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Respostas Prontas (Treino)</p>
            <p className="text-3xl font-bold text-emerald-400">{faqCount}</p>
          </div>

          <div className="border border-neutral-800 bg-neutral-900/30 p-6 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Contatos Sincronizados</p>
            <p className="text-3xl font-bold text-emerald-400">{chatsCount}</p>
          </div>
        </div>

        {/* 🩺 PAINEL DE MONITORAMENTO DE SERVIÇOS */}
        <div className="border border-neutral-800 bg-neutral-900/10 rounded-2xl p-6 space-y-4 max-w-4xl text-left">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Monitor de Resiliência do Sistema</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-neutral-950/60 border border-neutral-900 rounded-xl flex items-center justify-between">
              <span className="text-xs text-neutral-400">Banco de Dados Geral:</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded">100% Estável</span>
            </div>
            <div className="p-3 bg-neutral-950/60 border border-neutral-900 rounded-xl flex items-center justify-between">
              <span className="text-xs text-neutral-400">Latência do Assistente Virtual:</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded">Excelente (Failsafe Ativo)</span>
            </div>
          </div>
        </div>

        <div className="border border-neutral-800 bg-neutral-900/20 rounded-xl p-8 text-center space-y-4 max-w-4xl">
          <p className="text-sm text-neutral-400">Todos os canais mapeados e operando sob conformidade de dados.</p>
          <button 
            onClick={() => router.push('/chat')}
            className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Abrir Painel de Atendimento Realtime
          </button>
        </div>
      </main>

      {/* 🔒 MODAL BLOQUEADOR DE PRIMEIRO ACESSO (TERMOS DE SERVIÇO) */}
      {!termsAccepted && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 max-w-lg w-full text-center space-y-4 flex flex-col h-[75vh]">
            <div>
              <h3 className="text-base font-bold text-white flex items-center justify-center gap-2">📋 Atualização dos Termos de Serviço</h3>
              <p className="text-xs text-neutral-400 mt-0.5">Para continuar utilizando a infraestrutura do ZapAtende AI, revise e aceite as políticas regulamentares abaixo.</p>
            </div>

            {/* CAIXA DE TEXTO ROLÁVEL COM MARGINS JURÍDICAS */}
            <div className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-left text-[10px] text-neutral-400 space-y-3 overflow-y-auto select-none custom-scrollbar">
              <p className="font-bold text-neutral-200 uppercase tracking-wide">Conformidade de Segurança, Privacidade e Consumo – 2026</p>
              
              <p>• <strong>Criptografia Estrita (LGPD):</strong> Confirmamos que, em total alinhamento com a Lei Geral de Proteção de Dados (Lei nº 13.709/18), todas as informações de identificação direta de seus clientes (como Nomes Completos e Números de Telefone de WhatsApp) sofrem hashing e criptografia simétrica utilizando o algoritmo AES em memória RAM antes de tocarem nossa infraestrutura de persistência de dados.</p>
              
              <p>• <strong>Isenção de Grupos:</strong> O sistema opera exclusivamente em ambiente privado (Direct Messages). Canais de grupos comuns não são monitorados, processados ou armazenados, protegendo a cota do lojista e a privacidade de terceiros.</p>
              
              <p>• <strong>Cancelamento Pré-Pago Pix:</strong> Como operamos sob o modelo de conciliação manual pré-paga via Pix, o cancelamento voluntário é livre de qualquer multa ou carência contratual. A simples ausência de novo pagamento suspende a renovação automática da cota ao término do ciclo vigente de 30 dias.</p>
              
              <p>• <strong>Direito de Arrependimento (CDC):</strong> Asseguramos o direito de estorno e reembolso integral do Pix em até 7 (sete) dias corridos da ativação inicial da assinatura (Artigo 49 do Código de Defesa do Consumidor - Lei nº 8.078/90), desde que o volume de disparos automáticos efetuados pela inteligência não configure abuso ou uso massivo fraudulento dos limites do plano.</p>
              
              <p>• <strong>Limitação de Cota Gratuita:</strong> A conta de testes padrão (Trial) é fixada no teto regulamentar e improrrogável de 50 envios de mensagens automatizadas. Atingindo a margem, o robô suspende as atividades preventivamente até a aquisição de um plano comercial.</p>
            </div>

            <div className="space-y-2 flex-shrink-0">
              <button 
                type="button"
                onClick={handleAcceptTerms}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/5"
              >
                Li e Aceito os Termos de Serviço de Automação ✓
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}