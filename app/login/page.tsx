'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase as supabaseClient } from '../../src/lib/client'

const supabase = supabaseClient as any

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  // 🔄 Controle de visualização: 'login', 'signup' ou 'forgot'
  const [view, setView] = useState<'login' | 'signup' | 'forgot'>('login')
  
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // 🕵️‍♂️ ECO SENSOR: Captura o clique do e-mail de confirmação e faz o login automático
  useEffect(() => {
    async function detectEmailVerification() {
      // 1. Checa se o usuário acabou de pousar na página já com uma sessão ativa (vinda do e-mail)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setMessage({ 
          type: 'success', 
          text: '⚡ Verificação completa e login bem-sucedido! Entrando no sistema...' 
        })
        setLoading(true)
        setTimeout(() => {
          router.push('/overview')
        }, 2500) // Dá tempo do usuário ler a mensagem de sucesso
      }
    }

    detectEmailVerification()

    // 2. Ouvinte em tempo real com tipagem explícita (event: any, session: any) para matar o erro TS7006
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === 'SIGNED_IN' && session) {
        setMessage({ 
          type: 'success', 
          text: '⚡ Verificação completa e login bem-sucedido! Entrando no sistema...' 
        })
        setLoading(true)
        setTimeout(() => {
          router.push('/overview')
        }, 2500)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (view === 'signup') {
        // 1. REGISTRO DE NOVA CONTA
        const { error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            // Garante que o link do e-mail traga ele de volta para a rota certa
            emailRedirectTo: `${window.location.origin}/login`
          }
        })
        if (error) throw error
        setMessage({ type: 'success', text: 'Cadastro realizado! Acesse seu Gmail e clique no link de confirmação para ativar sua conta.' })
      } 
      else if (view === 'login') {
        // 2. AUTENTICAÇÃO / LOGIN PADRÃO
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        
        router.push('/overview')
      } 
      else if (view === 'forgot') {
        // 3. DISPARADOR DE RECUPERAÇÃO DE SENHA
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        })
        if (error) throw error
        setMessage({ type: 'success', text: 'Link de recuperação enviado com sucesso! Verifique seu Gmail. 📬' })
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Ocorreu um erro na autenticação.' })
    } finally {
      setLoading(false)
    }
  }

  // 🎛️ Variáveis auxiliares para mudar as cores e textos sem quebrar o Tailwind
  const isSignup = view === 'signup'
  const isForgot = view === 'forgot'

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6 select-none">
      <div className={`max-w-md w-full border p-8 rounded-2xl space-y-6 shadow-xl backdrop-blur-sm transition-all duration-300 ${
        isSignup ? 'border-blue-900/50 bg-neutral-900/60' : 'border-neutral-800 bg-neutral-900/40'
      }`}>
        
        {/* Cabeçalho do Card */}
        <div className="text-center space-y-2">
          <h1 className={`text-3xl font-extrabold tracking-tight transition-colors duration-300 ${
            isSignup ? 'text-blue-400' : isForgot ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {isSignup ? '✨ Criar Nova Conta' : isForgot ? '🔒 Recuperar Acesso' : '🚀 ZapAtende AI'}
          </h1>
          <p className="text-sm text-neutral-400">
            {isSignup && 'Faça o seu cadastro para começar a usar'}
            {view === 'login' && 'Entre com suas credenciais para acessar'}
            {isForgot && 'Digite seu e-mail para recuperar o acesso'}
          </p>
        </div>

        {/* 💡 Banner informativo exclusivo da tela de Cadastro */}
        {isSignup && (
          <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-xl text-xs text-blue-300 leading-relaxed animate-fade-in">
            👋 <strong>Seja muito bem-vindo!</strong> Após preencher os campos abaixo, nós enviaremos um link de ativação seguro diretamente para o seu e-mail.
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {/* Campo E-mail */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-neutral-400">E-mail corporativo</label>
            <input
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full bg-neutral-950 border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors text-white disabled:opacity-50 ${
                isSignup ? 'border-neutral-800 focus:border-blue-500' : 'border-neutral-800 focus:border-emerald-500'
              }`}
              placeholder="seu@email.com"
            />
          </div>

          {/* Campo Senha */}
          {!isForgot && (
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-neutral-400">Senha</label>
                
                {view === 'login' && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => { setView('forgot'); setMessage(null); }}
                    className="text-[11px] text-neutral-500 hover:text-emerald-400 transition-colors underline disabled:opacity-50"
                  >
                    Esqueceu sua senha?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full bg-neutral-950 border rounded-lg px-3 py-2 text-sm focus:outline-none transition-colors text-white disabled:opacity-50 ${
                  isSignup ? 'border-neutral-800 focus:border-blue-500' : 'border-neutral-800 focus:border-emerald-500'
                }`}
                placeholder="••••••••"
              />
            </div>
          )}

          {/* Renderizador de Mensagens */}
          {message && (
            <p className={`text-xs p-3 rounded-lg border leading-relaxed ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                : 'bg-red-500/10 border-red-500/20 text-red-400'
            }`}>
              {message.text}
            </p>
          )}

          {/* Botão de Envio Principal Dinâmico */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full font-bold text-black py-2.5 rounded-lg text-sm transition-colors disabled:bg-neutral-800 disabled:text-neutral-500 ${
              isSignup 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : isForgot 
                  ? 'bg-amber-500 hover:bg-amber-600' 
                  : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {loading ? 'Aguarde...' : isSignup ? '🚀 Criar Minha Conta' : view === 'login' ? 'Entrar no Sistema' : 'Enviar Link no Gmail'}
          </button>
        </form>

        {/* Links de Alternância de Interface (Rodapé do Card) */}
        <div className="text-center pt-2 border-t border-neutral-900/60">
          {isForgot ? (
            <button
              type="button"
              disabled={loading}
              onClick={() => { setView('login'); setMessage(null); }}
              className="text-xs text-neutral-400 hover:text-white transition-colors underline"
            >
              ← Voltar para o Login
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={() => { setView(view === 'login' ? 'signup' : 'login'); setMessage(null); }}
              className={`text-xs transition-colors underline ${
                isSignup ? 'text-blue-400 hover:text-blue-300' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {view === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </button>
          )}
        </div>

      </div>
    </div>
  )
}