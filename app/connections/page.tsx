'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../../src/lib/client'

type ConnectionStatus = 'disconnected' | 'loading_qr' | 'loading_pairing' | 'scan_ready' | 'pairing_ready' | 'connected'

export default function ConnectionsPage() {
  const router = useRouter()
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [qrValue, setQrValue] = useState<string | null>(null)
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  // Estados locais para controle de UX no celular
  const [activeTab, setActiveTab] = useState<'qr' | 'phone'>('qr')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [requestLoading, setRequestLoading] = useState(false)

  // 🔒 TRAVA DE ESTADO: Evita que a troca de aba automática fique em loop
  const [hasAutoSwitched, setHasAutoSwitched] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout

    async function checkWhatsAppStatus() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }
        setUserEmail(user.email ?? null)

        const { data, error } = await (supabase as any)
          .from('organizations')
          .select('whatsapp_status, whatsapp_qr, whatsapp_pairing_code')
          .eq('owner_id', user.id)
          .single()

        if (error) throw error

        if (data) {
          const org = data as any
          const currentStatus = (org.whatsapp_status as ConnectionStatus) || 'disconnected'
          
          setStatus(currentStatus)
          setQrValue(org.whatsapp_qr)
          setPairingCode(org.whatsapp_pairing_code)
          setErrorMessage(null)
          
          // 📱 TROCA DE ABA INTELIGENTE: Só roda uma vez se o banco mandar pareamento por celular
          if (!hasAutoSwitched && (currentStatus === 'pairing_ready' || currentStatus === 'loading_pairing')) {
            setActiveTab('phone')
            setHasAutoSwitched(true)
          }
        }
      } catch (err: any) {
        console.error('Erro ao buscar status:', err)
        setErrorMessage(err.message || 'Erro desconhecido ao conectar ao servidor.')
        setStatus('disconnected')
      } finally {
        setLoading(false)
      }
    }

    checkWhatsAppStatus()
    interval = setInterval(checkWhatsAppStatus, 2000)

    return () => clearInterval(interval)
  }, [router, hasAutoSwitched])

  // Método Tradicional: Solicita QR Code
  async function handleGenerateQR() {
    try {
      setErrorMessage(null)
      setStatus('loading_qr')
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await (supabase as any)
        .from('organizations')
        .update({ whatsapp_status: 'loading_qr', whatsapp_qr: null, whatsapp_pairing_code: null })
        .eq('owner_id', user.id)

      if (error) throw error
    } catch (err: any) {
      setErrorMessage(`Erro ao solicitar QR Code: ${err.message}`)
      setStatus('disconnected')
    }
  }

  // Método Mobile: Solicita Código de Pareamento por Telefone
  async function handleGeneratePairingCode(e: React.FormEvent) {
    e.preventDefault()
    const cleanPhone = phoneNumber.replace(/\D/g, '')
    
    if (cleanPhone.length < 12) {
      alert('Por favor, digite o número completo com Código do País e DDD (Ex: 5519997216523).')
      return
    }

    try {
      setErrorMessage(null)
      setRequestLoading(true)
      setStatus('loading_pairing')
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await (supabase as any)
        .from('organizations')
        .update({ 
          whatsapp_status: 'loading_pairing', 
          whatsapp_qr: null, 
          whatsapp_pairing_code: null,
          whatsapp_phone_request: cleanPhone 
        })
        .eq('owner_id', user.id)

      if (error) throw error
    } catch (err: any) {
      setErrorMessage(`Erro ao solicitar código de pareamento: ${err.message}`)
      setStatus('disconnected')
    } finally {
      setRequestLoading(false)
    }
  }

  // 🔄 Função de Escape: Permite ao usuário resetar o status se errar o número ou travar
  async function handleResetConnection() {
    try {
      setErrorMessage(null)
      setPairingCode(null)
      setQrValue(null)
      setStatus('disconnected')
      setHasAutoSwitched(false)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await (supabase as any)
        .from('organizations')
        .update({ 
          whatsapp_status: 'disconnected', 
          whatsapp_qr: null, 
          whatsapp_pairing_code: null,
          whatsapp_phone_request: null 
        })
        .eq('owner_id', user.id)
    } catch (err: any) {
      console.error('Erro ao resetar conexão:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="text-emerald-400 animate-pulse text-sm font-semibold">Carregando painel de pareamento...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-neutral-950 text-white select-none">
      
      {/* 🧭 BARRA LATERAL (Escondida no Mobile) */}
      <aside className="w-64 border-r border-neutral-800 bg-neutral-950 p-6 flex flex-col justify-between hidden md:flex shrink-0">
        <div className="space-y-8">
          <div className="flex items-center space-x-2">
            <span className="text-xl">🚀</span>
            <span className="font-bold text-lg text-emerald-400">ZapAtende AI</span>
          </div>

          <nav className="space-y-1">
            <Link href="/overview" className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/50 transition">Início</Link>
            <Link href="/chat" className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/50 transition">Conversas</Link>
            <Link href="/appointments" className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/50 transition">Agendamentos</Link>
            <Link href="/knowledge-base" className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium text-neutral-400 hover:text-white hover:bg-neutral-900/50 transition">Treinar IA</Link>
            <Link href="/connections" className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-neutral-900 transition">Conexões</Link>
          </nav>
        </div>
        <div className="pt-4 border-t border-neutral-900"><p className="text-xs text-neutral-500 truncate">{userEmail}</p></div>
      </aside>

      {/* 🖥️ CONTEÚDO PRINCIPAL (100% RESPONSIVO) */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 flex items-center justify-center">
        <div className="max-w-3xl w-full space-y-6">
          
          {/* NAVEGAÇÃO DE TOPO MOBILE RÁPIDA */}
          <div className="md:hidden flex flex-wrap gap-2 mb-2">
            <button onClick={() => router.push('/overview')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-400 text-xs font-semibold">Início</button>
            <button onClick={() => router.push('/chat')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-400 text-xs font-semibold">Conversas</button>
            <button onClick={() => router.push('/appointments')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-400 text-xs font-semibold">Agendamentos</button>
            <button onClick={() => router.push('/knowledge-base')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-400 text-xs font-semibold">Treinar IA</button>
            <button onClick={() => router.push('/connections')} className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold">Conexões</button>
          </div>

          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              📲 Sincronizar WhatsApp
            </h1>
            <p className="text-xs sm:text-sm text-neutral-400">
              Conecte seu canal oficial para que o assistente virtual assuma seus agendamentos automaticamente.
            </p>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-left">
              <p className="text-red-400 text-xs font-mono">⚠️ Falha na requisição: {errorMessage}</p>
            </div>
          )}

          {/* 🧭 SELETOR DE ABAS MOBILE-FRIENDLY */}
          {status !== 'connected' && (
            <div className="flex bg-neutral-900/80 p-1 rounded-xl border border-neutral-800/60 max-w-sm">
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${activeTab === 'qr' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
              >
                📷 Ler Código QR
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('phone')}
                className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${activeTab === 'phone' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-neutral-200'}`}
              >
                📱 Vincular Celular
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 bg-neutral-900/30 border border-neutral-800/80 p-5 sm:p-8 rounded-2xl backdrop-blur-sm">
            
            {/* INSTRUÇÕES DINÂMICAS */}
            <div className="md:col-span-3 space-y-4 text-xs sm:text-sm text-neutral-400 flex flex-col justify-center">
              <h3 className="font-bold text-sm sm:text-base text-neutral-200">Passo a passo no aparelho:</h3>
              {activeTab === 'qr' ? (
                <ol className="list-decimal list-inside space-y-2.5">
                  <li>Clique no botão para carregar o código QR de sincronização.</li>
                  <li>Abra o WhatsApp, acesse <span className="text-neutral-300 font-semibold">Configurações</span>.</li>
                  <li>Selecione <span className="text-emerald-400 font-semibold">Aparelhos Conectados</span>.</li>
                  <li>Clique em <span className="text-neutral-300 font-semibold">Conectar Aparelho</span> e aponte a câmera para a tela.</li>
                </ol>
              ) : (
                <ol className="list-decimal list-inside space-y-2.5">
                  <li>Insira o número do WhatsApp com o código do país e DDD (Ex: 55...).</li>
                  <li>Clique para gerar o código de verificação de 8 caracteres.</li>
                  <li>Abra a notificação do WhatsApp recebida em seu telefone celular.</li>
                  <li>Selecione <span className="text-neutral-300 font-semibold">Vincular com número de telefone</span> e digite o código exibido.</li>
                </ol>
              )}
            </div>

            {/* CARD DE INTERAÇÃO DIRETA */}
            <div className="md:col-span-2 border border-neutral-800 bg-neutral-900/50 rounded-xl p-5 flex flex-col items-center justify-center min-h-[260px]">
              
              {status === 'connected' ? (
                <div className="space-y-3 text-center">
                  <span className="text-3xl block">✅</span>
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-neutral-200">Canal Pareado!</p>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">Sua IA está online e respondendo.</p>
                  </div>
                </div>
              ) : activeTab === 'qr' ? (
                /* INTERFACE QR CODE */
                <>
                  {status === 'loading_qr' ? (
                    <div className="space-y-2 text-center">
                      <div className="mx-auto w-8 h-8 border-3 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                      <p className="text-[11px] text-neutral-400 animate-pulse">Iniciando canais do WhatsApp...</p>
                    </div>
                  ) : status === 'scan_ready' && qrValue ? (
                    <div className="space-y-3 text-center">
                      <div className="p-3 bg-white rounded-xl inline-block shadow-lg">
                        <QRCodeSVG value={qrValue} size={150} level="H" includeMargin={false} />
                      </div>
                      <p className="text-[10px] text-neutral-500 animate-pulse">Aguardando leitura do sensor...</p>
                      <button onClick={handleResetConnection} className="text-[10px] text-red-400 underline block mx-auto mt-1">Cancelar Processo</button>
                    </div>
                  ) : (
                    <div className="space-y-3 text-center w-full">
                      <span className="text-3xl block">📷</span>
                      <p className="text-xs text-neutral-400 font-medium">Instância pronta para gerar imagem</p>
                      <button
                        type="button"
                        onClick={handleGenerateQR}
                        className="py-3 sm:py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-black font-extrabold text-sm sm:text-[11px] rounded-lg transition w-full"
                      >
                        Gerar QR Code Visual
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* INTERFACE NÚMERO DE TELEFONE */
                <>
                  {status === 'loading_pairing' ? (
                    <div className="space-y-2 text-center">
                      <div className="mx-auto w-8 h-8 border-3 border-emerald-500/10 border-t-emerald-500 rounded-full animate-spin"></div>
                      <p className="text-[11px] text-neutral-400 animate-pulse">O servidor está gerando a chave de 8 dígitos...</p>
                    </div>
                  ) : status === 'pairing_ready' && pairingCode ? (
                    <div className="space-y-3 text-center w-full">
                      <p className="text-[11px] font-bold text-emerald-400">Insira este código no seu WhatsApp:</p>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl py-3 px-4 font-mono text-lg font-black tracking-widest text-white select-all">
                        {pairingCode.toUpperCase()}
                      </div>
                      <p className="text-[9px] text-neutral-500">Toque no código para copiar.</p>
                      <button onClick={handleResetConnection} className="text-[10px] text-red-400 underline block mx-auto mt-2">Alterar número / Cancelar</button>
                    </div>
                  ) : (
                    <form onSubmit={handleGeneratePairingCode} className="w-full space-y-4">
                      <div className="space-y-2 text-left">
                        <label className="text-xs sm:text-[10px] uppercase font-bold text-neutral-500 block">Número do WhatsApp Comercial</label>
                        <input
                          type="text"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Ex: 5519997216523"
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 sm:py-2 text-sm sm:text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={requestLoading}
                        className="w-full py-3 sm:py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 text-black font-extrabold text-sm sm:text-[11px] rounded-lg transition"
                      >
                        {requestLoading ? 'Solicitando...' : 'Gerar Código de Pareamento'}
                      </button>
                    </form>
                  )}
                </>
              )}

            </div>

          </div>

          {/* BOTÃO COMPLEMENTAR DE VOLTAR */}
          <div className="text-left md:hidden">
            <button onClick={() => router.push('/overview')} className="text-xs text-neutral-500 hover:text-white font-medium underline">
              &larr; Voltar ao painel inicial
            </button>
          </div>

        </div>
      </main>
    </div>
  )
}