'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase as supabaseClient } from '../../src/lib/client'
import CryptoJS from 'crypto-js' 

const supabase = supabaseClient as any

interface Chat {
  id: string
  phone: string
  name: string
  updated_at: string
  fluxo_status?: string
  is_archived?: boolean
  lead_score?: number
  lead_status?: string
  veiculo_interesse?: string
  forma_pagamento?: string
  tem_entrada?: string
  possui_troca?: string
  prazo_compra?: string
}

interface Message {
  id: string
  sender: 'contact' | 'ai' | 'user' | 'user_sent'
  text: string
  created_at: string
}

const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY || 'zapatende-super-secret-key-2026'

function getCryptoConfig() {
  const key = CryptoJS.SHA256(encryptionKey);
  const iv = CryptoJS.MD5(encryptionKey);
  return { key, iv };
}

function encryptData(text: string) {
  if (!text) return '';
  const { key, iv } = getCryptoConfig();
  return CryptoJS.AES.encrypt(text, key, { iv }).toString();
}

function decryptData(cipherText: string) {
  try {
    if (!cipherText || cipherText.length < 10) return cipherText;
    const { key, iv } = getCryptoConfig();
    const decrypted = CryptoJS.AES.decrypt(cipherText, key, { iv });
    const decryptedText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) return cipherText;
    // 🌟 RESOLUÇÃO VISUAL: Arranca o sufixo _lid do texto descriptografado para mostrar o número puro na tela
    return decryptedText.split('_')[0]; 
  } catch (error) {
    return cipherText;
  }
}

export default function ChatPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  
  const [chats, setChats] = useState<Chat[]>([])
  const [activeChatId, setActiveChatId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [manualMessage, setManualMessage] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeChatDetails = chats.find(c => c.id === activeChatId)

  useEffect(() => {
    async function initChat() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserEmail(user.email ?? null)

      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id)
        .limit(1)

      if (orgs && orgs[0]) {
        setOrgId(orgs[0].id)
        
        const { data: whatsappChats } = await supabase
          .from('whatsapp_chats')
          .select('*')
          .eq('organization_id', orgs[0].id)
          .eq('is_archived', false)
          .order('updated_at', { ascending: false })

        const decryptedChats = whatsappChats ? whatsappChats.map((chat: Chat) => ({
          ...chat,
          name: decryptData(chat.name),
          phone: decryptData(chat.phone)
        })) : [];

        setChats(decryptedChats)
      }
      setLoading(false)
    }
    initChat()
  }, [router])

  useEffect(() => {
    if (!orgId) return
    
    const interval = setInterval(async () => {
      const { data: whatsappChats } = await supabase
        .from('whatsapp_chats')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
      
      const decryptedChats = whatsappChats ? whatsappChats.map((chat: Chat) => ({
        ...chat,
        name: decryptData(chat.name),
        phone: decryptData(chat.phone)
      })) : [];

      setChats(decryptedChats)

      if (activeChatId) {
        const { data: historic } = await supabase
          .from('whatsapp_messages')
          .select('*')
          .eq('chat_id', activeChatId)
          .order('created_at', { ascending: true })
        if (historic) setMessages(historic)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [orgId, activeChatId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSelectChat(chatId: string) {
    setActiveChatId(chatId)
    const { data: historic } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
    setMessages(historic || [])
  }

  async function handleDeleteChat(chatId: string, e: React.MouseEvent) {
    e.stopPropagation() 
    if (!confirm('Deseja remover esta conversa do seu painel visual?')) return

    try {
      await supabase
        .from('whatsapp_chats')
        .update({ is_archived: true })
        .eq('id', chatId)

      setChats(prev => prev.filter(c => c.id !== chatId))
      if (activeChatId === chatId) {
        setActiveChatId(null)
        setMessages([])
      }
    } catch (err) {
      console.error('Erro ao ocultar conversa:', err)
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!manualMessage.trim() || !orgId || !activeChatId || sending) return

    const userText = manualMessage
    setManualMessage('')
    setSending(true)

    try {
      const encryptedText = encryptData(userText)

      await supabase
        .from('whatsapp_messages')
        .insert({
          chat_id: activeChatId,
          organization_id: orgId,
          sender: 'user', 
          text: encryptedText
        })
    } catch (err) {
      alert('Erro ao gravar mensagem no banco.')
    } finally {
      setSending(false)
    }
  }

  function getStatusBadgeStyle(status: string = 'curioso') {
    const s = status.toLowerCase()
    if (s === 'quente' || s === 'forte') return 'bg-red-500/10 text-red-400 border-red-500/20'
    if (s === 'médio' || s === 'progresso') return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
    return 'bg-neutral-800 text-neutral-400 border-neutral-700/60'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <p className="text-emerald-400 animate-pulse text-sm font-semibold">Carregando canais do WhatsApp...</p>
      </div>
    )
  }

  return (
    <div className="h-screen bg-neutral-950 text-white flex overflow-hidden select-none">
      
      <aside className="hidden md:flex w-64 border-r border-neutral-800 bg-neutral-900/20 p-6 flex-col justify-between flex-shrink-0">
        <div className="space-y-6">
          <h2 className="text-xl font-bold tracking-tight text-emerald-400">🚀 ZapAtende AI</h2>
          <nav className="space-y-1">
            <button onClick={() => router.push('/overview')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Início</button>
            <button className="w-full text-left block px-3 py-2 text-sm font-medium bg-neutral-900 rounded-lg text-white">Conversas</button>
            <button onClick={() => router.push('/appointments')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Agendamentos</button>
            <button onClick={() => router.push('/knowledge-base')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Treinar IA</button>
            <button onClick={() => router.push('/connections')} className="w-full text-left block px-3 py-2 text-sm font-medium text-neutral-400 hover:text-white transition-colors">Conexões</button>
          </nav>
        </div>
        <div className="border-t border-neutral-800 pt-4"><p className="text-xs text-neutral-500 truncate">{userEmail}</p></div>
      </aside>

      <section className={`${activeChatId ? 'hidden md:flex' : 'flex'} w-full md:w-80 border-r border-neutral-900 bg-neutral-950 flex-col flex-shrink-0`}>
        <div className="p-4 border-b border-neutral-900 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-sm text-neutral-200">Esteira de Leads</h3>
            <p className="text-xs text-neutral-500 mt-0.5">Qualificação automática por IA</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {chats.length === 0 ? (
            <p className="text-xs text-neutral-600 text-center p-4">Nenhum cliente triado até o momento...</p>
          ) : (
            chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`group w-full text-left p-3 rounded-xl flex flex-col gap-1 cursor-pointer transition ${activeChatId === chat.id ? 'bg-neutral-900 border border-neutral-800' : 'hover:bg-neutral-900/40 border border-transparent'}`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="font-semibold text-xs text-neutral-200 truncate max-w-[50%]">{chat.name}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-[10px] font-mono px-1 bg-neutral-900 text-emerald-400 border border-neutral-800 rounded">🔥 {chat.lead_score ?? 0}%</span>
                    <span className={`text-[8px] px-1.5 py-0.5 font-bold uppercase rounded-md border ${getStatusBadgeStyle(chat.lead_status)}`}>{chat.lead_status || 'Curioso'}</span>
                    <button onClick={(e) => handleDeleteChat(chat.id, e)} className="text-neutral-600 hover:text-red-400 p-1 text-[11px] font-bold ml-1">✕</button>
                  </div>
                </div>
                {chat.veiculo_interesse && <p className="text-[10px] text-emerald-500/80 font-medium truncate">🔍 Detalhe: {chat.veiculo_interesse}</p>}
                <span className="text-[10px] text-neutral-500 font-mono">+{chat.phone}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <main className={`${activeChatId ? 'flex' : 'hidden md:flex'} flex-1 flex flex-col bg-[#0a0a0a] h-full overflow-hidden min-w-0`}>
        {activeChatId && activeChatDetails ? (
          <>
            <div className="border-b border-neutral-900 bg-neutral-950 p-4 flex flex-col gap-3 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">{activeChatDetails.name}</h3>
                  <p className="text-xs text-neutral-400 font-mono">+{activeChatDetails.phone}</p>
                </div>
                <button onClick={() => setActiveChatId(null)} className="md:hidden px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold">← Contatos</button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-neutral-900/30 p-2.5 rounded-xl border border-neutral-900/60 text-[11px]">
                <div className="space-y-0.5"><span className="text-neutral-500 block text-[10px]">Interesse Base</span><span className="text-neutral-200 font-medium truncate block">{activeChatDetails.veiculo_interesse || 'Não informado'}</span></div>
                <div className="space-y-0.5"><span className="text-neutral-500 block text-[10px]">Pagamento</span><span className="text-neutral-200 font-medium truncate block">{activeChatDetails.forma_pagamento || 'Não informado'}</span></div>
                <div className="space-y-0.5"><span className="text-neutral-500 block text-[10px]">Condição / Entrada</span><span className="text-neutral-200 font-medium truncate block">{activeChatDetails.tem_entrada || 'Não informado'}</span></div>
                <div className="space-y-0.5"><span className="text-neutral-500 block text-[10px]">Possui Troca?</span><span className="text-neutral-200 font-medium truncate block">{activeChatDetails.possui_troca || 'Não informado'}</span></div>
                <div className="space-y-0.5"><span className="text-neutral-500 block text-[10px]">Urgência / Prazo</span><span className="text-amber-400 font-semibold truncate block">{activeChatDetails.prazo_compra || 'Não informado'}</span></div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 CustomScrollbar">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === 'contact' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[70%] p-3 rounded-2xl ${msg.sender === 'contact' ? 'bg-neutral-800 text-white rounded-tl-sm' : msg.sender === 'ai' ? 'bg-neutral-900 text-white rounded-tr-sm border border-neutral-800' : 'bg-emerald-600 text-white rounded-tr-sm'}`}>
                    <p className="text-sm break-words">{decryptData(msg.text)}</p>
                    <span className="text-[9px] text-white/40 block mt-1 text-right">
                      {msg.sender === 'contact' ? 'Cliente' : msg.sender === 'ai' ? 'Robô AI' : 'Você'}
                    </span>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-neutral-950 border-t border-neutral-900 flex-shrink-0">
              <div className="flex gap-2 flex-col sm:flex-row">
                <input type="text" required value={manualMessage} onChange={(e) => setManualMessage(e.target.value)} placeholder="Intervenha no fluxo..." className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-emerald-500 text-white" />
                <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold px-6 py-3 rounded-xl text-sm whitespace-nowrap">Enviar via Web</button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-500">
            <span className="text-4xl mb-2">💬</span>
            <p className="text-sm">Selecione um cliente na barra lateral para ler a ficha técnica do lead.</p>
          </div>
        )}
      </main>
    </div>
  )
}