'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase as supabaseClient } from '../../src/lib/client'

const supabase = supabaseClient as any

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
}

export default function KnowledgeBasePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingConfig, setSavingConfig] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [faqs, setFaqs] = useState<FAQ[]>([])

  // 🎛️ Configurações dinâmicas da IA e do Sistema
  const [systemMode, setSystemMode] = useState('appointments') // 'appointments', 'leads_auto', 'leads_imob'
  const [enableAppointments, setEnableAppointments] = useState(true)
  const [enableAiChatbot, setEnableAiChatbot] = useState(true)
  const [aiInstructions, setAiInstructions] = useState('')
  const [availableSlots, setAvailableSlots] = useState('09:00, 10:00, 14:00, 16:00')

  // 🚚 Estados: Filtros Automotivos
  const [workWithSeminovos, setWorkWithSeminovos] = useState(true)
  const [workWithNovos, setWorkWithNovos] = useState(true)
  const [workWithCarga, setWorkWithCarga] = useState(true)
  const [workWithPassageiro, setWorkWithPassageiro] = useState(true)
  const [workWithTransporte, setWorkWithTransporte] = useState(true)

  // 🏢 NOVOS ESTADOS: Filtros Imobiliários (Quadrados para Corretores)
  const [workWithCasa, setWorkWithCasa] = useState(true)
  const [workWithApto, setWorkWithApto] = useState(true)
  const [workWithTerreno, setWorkWithTerreno] = useState(true)
  const [workWithComercial, setWorkWithComercial] = useState(true)

  // Campos do Formulário de FAQ
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [category, setCategory] = useState('Geral')

  useEffect(() => {
    async function initKnowledgeBase() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      try {
        let { data: orgs } = await supabase
          .from('organizations')
          .select('*') // Puxa todos os campos para simplificar
          .eq('owner_id', user.id)
          .limit(1)

        let currentOrgId = orgs && orgs[0] ? orgs[0].id : null

        if (!currentOrgId) {
          const { data: newOrg, error: createError } = await supabase
            .from('organizations')
            .insert([{
              owner_id: user.id,
              name: 'Minha Empresa Padrão',
              slug: `empresa-${user.id.slice(0, 5)}`,
              system_mode: 'appointments',
              enable_appointments: true,
              enable_ai_chatbot: true,
              available_slots: '09:00, 10:00, 14:00, 16:00'
            }])
            .select().single()

          if (createError) throw createError
          currentOrgId = newOrg.id
          setSystemMode('appointments')
        } else {
          setSystemMode(orgs[0].system_mode || 'appointments')
          setEnableAppointments(orgs[0].enable_appointments ?? true)
          setEnableAiChatbot(orgs[0].enable_ai_chatbot ?? true)
          setAiInstructions(orgs[0].ai_instructions || '')
          setAvailableSlots(orgs[0].available_slots || '09:00, 10:00, 14:00, 16:00')
          
          // Carrega Automotivo
          setWorkWithSeminovos(orgs[0].work_with_seminovos ?? true)
          setWorkWithNovos(orgs[0].work_with_novos ?? true)
          setWorkWithCarga(orgs[0].work_with_carga ?? true)
          setWorkWithPassageiro(orgs[0].work_with_passageiro ?? true)
          setWorkWithTransporte(orgs[0].work_with_transporte ?? true)

          // 🏢 CARREGA IMOBILIÁRIO DO SUPABASE
          setWorkWithCasa(orgs[0].work_with_casa ?? true)
          setWorkWithApto(orgs[0].work_with_apto ?? true)
          setWorkWithTerreno(orgs[0].work_with_terreno ?? true)
          setWorkWithComercial(orgs[0].work_with_comercial ?? true)
        }

        setOrgId(currentOrgId)

        const { data: kbData, error: kbError } = await supabase
          .from('knowledge_base')
          .select('id, question, answer, category')
          .eq('organization_id', currentOrgId)
          .order('created_at', { ascending: false })

        if (kbError) throw kbError
        if (kbData) setFaqs(kbData)

      } catch (err) {
        console.error('Erro na inicialização:', err)
      } finally {
        setLoading(false)
      }
    }

    initKnowledgeBase()
  }, [router])

  async function handleSaveAIConfig(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId) return
    setSavingConfig(true)

    try {
      const { error } = await supabase
        .from('organizations')
        .update({
          system_mode: systemMode,
          enable_appointments: enableAppointments,
          enable_ai_chatbot: enableAiChatbot,
          ai_instructions: aiInstructions,
          available_slots: availableSlots,
          // Salva Automotivo
          work_with_seminovos: workWithSeminovos,
          work_with_novos: workWithNovos,
          work_with_carga: workWithCarga,
          work_with_passageiro: workWithPassageiro,
          work_with_transporte: workWithTransporte,
          // 🏢 SALVA AS TRAVAS DOS CORRETORES DE IMÓVEIS
          work_with_casa: workWithCasa,
          work_with_apto: workWithApto,
          work_with_terreno: workWithTerreno,
          work_with_comercial: workWithComercial
        })
        .eq('id', orgId)

      if (error) throw error
      alert('Configurações de nicho e IA salvas com sucesso! 🧠⚙️')
    } catch (err: any) {
      alert(`Erro ao salvar configurações: ${err.message}`)
    } finally {
      setSavingConfig(false)
    }
  }

  async function handleAddFAQ(e: React.FormEvent) {
    e.preventDefault()
    if (!orgId || !question || !answer) return
    setSaving(true)

    try {
      const { data, error } = await supabase
        .from('knowledge_base')
        .insert([{ organization_id: orgId, question, answer, category }])
        .select().single()

      if (error) throw error
      if (data) {
        setFaqs([data, ...faqs])
        setQuestion('')
        setAnswer('')
      }
    } catch (err) {
      alert('Erro ao salvar aprendizado da IA')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteFAQ(id: string) {
    if (!confirm('Remover este aprendizado da memória da IA?')) return
    try {
      await supabase.from('knowledge_base').delete().eq('id', id)
      setFaqs(prev => prev.filter(faq => faq.id !== id))
    } catch (err) {}
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="text-emerald-400 animate-pulse text-sm font-semibold">Carregando cérebro da IA...</p>
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
            <button className="w-full text-left block px-3 py-2 text-sm font-medium bg-neutral-900 rounded-lg text-white">Treinar IA</button>
            <button onClick={() => router.push('/connections')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Conexões</button>
          </nav>
        </div>
      </aside>

      {/* 🖥️ CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-4 sm:p-6 md:p-10 space-y-8 overflow-y-auto">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">🧠 Treinar Inteligência Artificial</h1>
          <p className="text-sm text-neutral-400">Customize o comportamento e o modelo de negócio do seu robô.</p>
        </div>

        {/* ⚙️ PAINEL: CONFIGURAÇÕES GLOBAIS */}
        <form onSubmit={handleSaveAIConfig} className="border border-neutral-800 bg-neutral-900/40 p-6 rounded-2xl max-w-4xl space-y-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-300">Regras de Comportamento Global</h3>
          
          {/* 🎯 SELETOR DE MODO DO SAAS MULTI-NICHO */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-400">Modelo de Negócio do Cliente</label>
            <select
              value={systemMode}
              onChange={(e) => setSystemMode(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white"
            >
              <option value="appointments">🗓️ Agendamento Clássico (Salões, Clínicas, Prestadores)</option>
              <option value="leads_auto">🚚 CRM AI - Veículos Pesados & Comerciais (Vans, Caminhões, Ônibus)</option>
              <option value="leads_imob">🏢 CRM AI - Mercado Imobiliário (Imobiliárias e Corretores Autônomos)</option>
            </select>
          </div>

          {/* 🚚 FILTROS AUTOMOTIVOS */}
          {systemMode === 'leads_auto' && (
            <div className="space-y-3 p-4 bg-neutral-950 border border-neutral-900 rounded-xl animate-fade-in">
              <div>
                <label className="text-sm font-semibold text-white block">Foco do Pátio de Veículos</label>
                <span className="text-xs text-neutral-500">Marque os tipos de veículos que você comercializa.</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div onClick={() => setWorkWithSeminovos(!workWithSeminovos)} className={`p-4 rounded-xl border text-center cursor-pointer transition ${workWithSeminovos ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-neutral-900/30 border-neutral-800 text-neutral-500'}`}>
                  <span className="text-xl">🚗</span><span className="text-xs font-medium block mt-1">Seminovos</span>
                </div>
                <div onClick={() => setWorkWithNovos(!workWithNovos)} className={`p-4 rounded-xl border text-center cursor-pointer transition ${workWithNovos ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-neutral-900/30 border-neutral-800 text-neutral-500'}`}>
                  <span className="text-xl">✨</span><span className="text-xs font-medium block mt-1">Novos (0km)</span>
                </div>
                <div onClick={() => setWorkWithCarga(!workWithCarga)} className={`p-4 rounded-xl border text-center cursor-pointer transition ${workWithCarga ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-neutral-900/30 border-neutral-800 text-neutral-500'}`}>
                  <span className="text-xl">📦</span><span className="text-xs font-medium block mt-1">Carga / Baú</span>
                </div>
                <div onClick={() => setWorkWithPassageiro(!workWithPassageiro)} className={`p-4 rounded-xl border text-center cursor-pointer transition ${workWithPassageiro ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-neutral-900/30 border-neutral-800 text-neutral-500'}`}>
                  <span className="text-xl">👥</span><span className="text-xs font-medium block mt-1">Passageiros</span>
                </div>
                <div onClick={() => setWorkWithTransporte(!workWithTransporte)} className={`p-4 rounded-xl border text-center cursor-pointer transition ${workWithTransporte ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-neutral-900/30 border-neutral-800 text-neutral-500'}`}>
                  <span className="text-xl">🚛</span><span className="text-xs font-medium block mt-1">Pesados</span>
                </div>
              </div>
            </div>
          )}

          {/* 🏢 🏢 NOVO: FILTROS EXCLUSIVOS PARA CORRETORES DE IMÓVEIS */}
          {systemMode === 'leads_imob' && (
            <div className="space-y-3 p-4 bg-neutral-950 border border-neutral-900 rounded-xl animate-fade-in">
              <div>
                <label className="text-sm font-semibold text-white block">Foco da Carteira Imobiliária</label>
                <span className="text-xs text-neutral-500">Selecione quais perfis de imóveis a sua imobiliária gerencia para calibrar o robô.</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div onClick={() => setWorkWithCasa(!workWithCasa)} className={`p-4 rounded-xl border text-center cursor-pointer transition ${workWithCasa ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-neutral-900/30 border-neutral-800 text-neutral-500'}`}>
                  <span className="text-xl">🏡</span><span className="text-xs font-medium block mt-1">Casas / Vilas</span>
                </div>
                <div onClick={() => setWorkWithApto(!workWithApto)} className={`p-4 rounded-xl border text-center cursor-pointer transition ${workWithApto ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-neutral-900/30 border-neutral-800 text-neutral-500'}`}>
                  <span className="text-xl">🏢</span><span className="text-xs font-medium block mt-1">Apartamentos</span>
                </div>
                <div onClick={() => setWorkWithTerreno(!workWithTerreno)} className={`p-4 rounded-xl border text-center cursor-pointer transition ${workWithTerreno ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-neutral-900/30 border-neutral-800 text-neutral-500'}`}>
                  <span className="text-xl">🌱</span><span className="text-xs font-medium block mt-1">Terrenos / Lotes</span>
                </div>
                <div onClick={() => setWorkWithComercial(!workWithComercial)} className={`p-4 rounded-xl border text-center cursor-pointer transition ${workWithComercial ? 'bg-emerald-500/10 border-emerald-500 text-white' : 'bg-neutral-900/30 border-neutral-800 text-neutral-500'}`}>
                  <span className="text-xl">🏪</span><span className="text-xs font-medium block mt-1">Comercial / Galpão</span>
                </div>
              </div>
            </div>
          )}

          {/* CONTROLADORES PADRÃO */}
          {systemMode === 'appointments' && (
            <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-900 rounded-xl animate-fade-in">
              <div className="space-y-0.5">
                <label className="text-sm font-semibold text-white block">Ativar Agendamentos Autônomos</label>
                <span className="text-xs text-neutral-500">IA Rígida para controle de agenda eletrônica.</span>
              </div>
              <input type="checkbox" checked={enableAppointments} onChange={(e) => setEnableAppointments(e.target.checked)} className="w-4 h-4 accent-emerald-400" />
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-neutral-950 border border-neutral-900 rounded-xl">
            <div className="space-y-0.5">
              <label className="text-sm font-semibold text-white block">Ativar IA Atendente (Gemini)</label>
              <span className="text-xs text-neutral-500">Permite conversação fluida e inteligente com os contatos.</span>
            </div>
            <input type="checkbox" checked={enableAiChatbot} onChange={(e) => setEnableAiChatbot(e.target.checked)} className="w-4 h-4 accent-emerald-400" />
          </div>

          {systemMode === 'appointments' && enableAppointments && (
            <div className="space-y-1 animate-fade-in">
              <label className="text-xs font-semibold text-neutral-400">Horários de Atendimento Disponíveis</label>
              <input type="text" value={availableSlots} onChange={(e) => setAvailableSlots(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-white font-mono" />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-400">
              {systemMode === 'appointments' ? 'Instruções Gerais / Personalidade do Robô' : 'Script Oculto / Prompt do Sistema de Qualificação (CRM AI)'}
            </label>
            <textarea
              rows={5}
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white resize-none"
              placeholder={systemMode === 'leads_imob' 
                ? "Ex: Você é a atendente virtual da Imobiliária Nova Era. Descubra de forma sutil se o cliente quer comprar ou alugar, qual o bairro preferido e a faixa de preço..."
                : "Insira as diretrizes do robô..."}
            />
          </div>

          <button type="submit" disabled={savingConfig} className="bg-emerald-500 hover:bg-emerald-600 font-bold px-4 py-2.5 rounded-xl text-xs text-black transition shadow-lg">
            {savingConfig ? 'Sincronizando...' : 'Salvar Configurações Globais'}
          </button>
        </form>

        <hr className="border-neutral-900 max-w-4xl" />

        {/* Módulos de FAQs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-4xl">
          <div className="lg:col-span-1 border border-neutral-800 bg-neutral-900/30 p-6 rounded-xl space-y-4 h-fit">
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider">Novo Conhecimento</h3>
            <form onSubmit={handleAddFAQ} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-400">Contexto</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none" placeholder="Ex: Financiamento / Documentos"/>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-400">Se o cliente disser:</label>
                <input type="text" required value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none"/>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-400">Responda assim:</label>
                <textarea required rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-white resize-none focus:outline-none"/>
              </div>
              <button type="submit" disabled={saving} className="w-full bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-white font-bold py-2 rounded-lg text-xs transition">
                {saving ? 'Gravando...' : 'Injetar Conhecimento'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">Memória Injetada ({faqs.length})</h3>
            {faqs.length === 0 ? (
              <div className="border border-neutral-800 border-dashed rounded-xl p-8 text-center text-neutral-500 text-xs">Nenhum conhecimento injetado.</div>
            ) : (
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                {faqs.map((faq) => (
                  <div key={faq.id} className="border border-neutral-800 bg-neutral-900/20 p-4 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] uppercase font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">{faq.category}</span>
                      <button onClick={() => handleDeleteFAQ(faq.id)} className="text-[10px] text-neutral-500 hover:text-red-400">Apagar</button>
                    </div>
                    <h4 className="font-semibold text-white text-xs">"{faq.question}"</h4>
                    <p className="text-xs text-neutral-400 bg-neutral-950/40 p-2.5 rounded-lg border border-neutral-900">{faq.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}