'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase as supabaseClient } from '../../src/lib/client'
import CryptoJS from 'crypto-js' 

const supabase = supabaseClient as any

interface Appointment {
  id: string
  client_name: string
  client_phone: string
  scheduled_at: string
  created_at: string
}

const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'zapatende-super-secret-key-2026'

// 🔐 ALINHAMENTO SIMÉTRICO CRIPTOGRAFIA DETERMINÍSTICA
function getCryptoConfig() {
  const key = CryptoJS.SHA256(encryptionKey);
  const iv = CryptoJS.MD5(encryptionKey);
  return { key, iv };
}

function decryptData(cipherText: string) {
  try {
    if (!cipherText || cipherText.length < 10) return cipherText;
    const { key, iv } = getCryptoConfig();
    // 🌟 IGUALADO: Usa a sintaxe direta que funcionou perfeitamente na tela de chat
    const decrypted = CryptoJS.AES.decrypt(cipherText, key, { iv });
    return decrypted.toString(CryptoJS.enc.Utf8) || cipherText; 
  } catch (error) {
    return cipherText;
  }
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    async function initPage() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email ?? null)

      try {
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1)

        if (orgs && orgs[0]) {
          setOrgId(orgs[0].id)
        }
      } catch (err) {
        console.error('Erro ao carregar empresa:', err)
      } finally {
        setLoading(false)
      }
    }
    initPage()
  }, [router])

  useEffect(() => {
    if (!orgId) return

    async function fetchAppointments() {
      const { data: appData } = await supabase
        .from('appointments')
        .select('*')
        .eq('organization_id', orgId)
        .order('scheduled_at', { ascending: true })

      if (appData) {
        const decryptedApps = appData.map((app: Appointment) => ({
          ...app,
          client_name: decryptData(app.client_name),
          client_phone: decryptData(app.client_phone)
        }));
        setAppointments(decryptedApps)
      }
    }

    fetchAppointments()

    const interval = setInterval(fetchAppointments, 2000)
    return () => clearInterval(interval)
  }, [orgId])

  async function handleDeleteManual(id: string) {
    if (!confirm('Deseja cancelar e remover este agendamento específico?')) return
    try {
      const { error } = await supabase.from('appointments').delete().eq('id', id)
      if (error) throw error
      setAppointments(prev => prev.filter(item => item.id !== id))
    } catch (err: any) {
      alert(`Erro ao remover: ${err.message}`)
    }
  }

  async function handleClearAll() {
    if (!orgId) return
    if (!confirm('⚠️ ALERTA MESTRE: Deseja apagar todos os horários do painel?')) return
    try {
      const { error } = await supabase.from('appointments').delete().eq('organization_id', orgId)
      if (error) throw error
      setAppointments([])
    } catch (err: any) {
      alert(`Erro ao limpar histórico: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="text-emerald-400 animate-pulse text-sm font-semibold">Carregando cronograma da IA...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex select-none">
      
      {/* BARRA LATERAL */}
      <aside className="hidden md:flex w-64 border-r border-neutral-800 bg-neutral-900/20 p-6 flex-col justify-between shrink-0">
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-emerald-400">🚀 ZapAtende AI</h2>
          <nav className="space-y-1">
            <button onClick={() => router.push('/overview')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Início</button>
            <button onClick={() => router.push('/chat')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Conversas</button>
            <button className="w-full text-left block px-3 py-2 text-sm font-medium bg-neutral-900 rounded-lg text-white">Agendamentos</button>
            <button onClick={() => router.push('/knowledge-base')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Treinar IA</button>
            <button onClick={() => router.push('/connections')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Conexões</button>
          </nav>
        </div>
        <div className="border-t border-neutral-800 pt-4"><p className="text-xs text-neutral-500 truncate">{userEmail}</p></div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 space-y-8 overflow-y-auto">
        <div className="md:hidden flex flex-wrap gap-2">
          <button onClick={() => router.push('/overview')} className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-xs font-semibold">Início</button>
          <button onClick={() => router.push('/chat')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-200 text-xs font-semibold">Conversas</button>
          <button onClick={() => router.push('/appointments')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-200 text-xs font-semibold">Agendamentos</button>
          <button onClick={() => router.push('/knowledge-base')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-200 text-xs font-semibold">Treinar IA</button>
          <button onClick={() => router.push('/connections')} className="px-3 py-2 rounded-xl bg-neutral-900/70 text-neutral-200 text-xs font-semibold">Conexões</button>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">📅 Agenda Eletrônica</h1>
            <p className="text-sm text-neutral-400">Horários marcados de forma automatizada pelo robô no WhatsApp.</p>
          </div>
          {appointments.length > 0 && (
            <button onClick={handleClearAll} className="bg-red-500/10 hover:bg-red-500 border border-red-500/20 hover:text-white text-red-400 text-xs font-bold px-4 py-2 rounded-xl transition-all">
              Limpar Todos os Agendamentos
            </button>
          )}
        </div>

        <div className="space-y-4">
          {appointments.length === 0 ? (
            <div className="border border-neutral-800 border-dashed rounded-2xl p-12 text-center text-neutral-500 text-sm max-w-xl">
              <span className="text-3xl block mb-2">💤</span>
              Nenhum agendamento ativo na fila. Deixe a IA conversando com os clientes para preencher a sua grade de horários!
            </div>
          ) : (
            <div className="border border-neutral-800 rounded-xl overflow-hidden max-w-4xl bg-neutral-900/10">
              <table className="w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-800 bg-neutral-900/40 text-neutral-400 font-medium text-xs uppercase tracking-wider">
                    <th className="p-4">Cliente</th>
                    <th className="p-4">WhatsApp</th>
                    <th className="p-4">Data & Horário Solicitado</th>
                    <th className="p-4 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  {appointments.map((app) => (
                    <tr key={app.id} className="hover:bg-neutral-900/20 transition-colors">
                      <td className="p-4 font-semibold text-white">{app.client_name}</td>
                      {/* 🌟 EXIBIÇÃO FORMATADA: Mostra o número limpo descriptografado precedido do indicativo + */}
                      <td className="p-4 font-mono text-neutral-400 text-xs">+{app.client_phone}</td>
                      <td className="p-4 text-emerald-400 font-medium">
                        {new Date(app.scheduled_at).toLocaleString('pt-BR', {
                          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleDeleteManual(app.id)} className="text-xs text-neutral-500 hover:text-red-400 font-semibold transition">
                          Cancelar Horário
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}