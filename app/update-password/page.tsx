'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../src/lib/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Atualiza a senha do usuário que veio autenticado pelo link do token do e-mail
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      alert('Sua senha foi atualizada com sucesso! 🎉')
      router.push('/login')
    } catch (err: any) {
      setError(err.message || 'Erro ao redefinir.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <form onSubmit={handleUpdatePassword} className="max-w-md w-full border border-neutral-800 bg-neutral-900/40 p-8 rounded-2xl space-y-4">
        <h1 className="text-xl font-bold text-emerald-400">Nova Senha</h1>
        <p className="text-xs text-neutral-400">Digite a nova combinação de segurança para a sua conta corporativa.</p>
        
        <input
          type="password"
          required
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-sm focus:border-emerald-500 text-white focus:outline-none"
          placeholder="Mínimo 6 caracteres"
        />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button type="submit" disabled={loading} className="w-full bg-emerald-500 text-black font-bold py-2 rounded-lg text-xs">
          {loading ? 'Salvando...' : 'Confirmar Nova Senha'}
        </button>
      </form>
    </div>
  )
}