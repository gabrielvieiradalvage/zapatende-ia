import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Atenção: As variáveis de ambiente do Supabase não foram encontradas no arquivo .env.local')
}

// Essa é a ponte oficial que usaremos nos componentes do site, agora blindada para salvar a sessão
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // 💾 Salva o login do usuário para sempre no navegador (localStorage)
    autoRefreshToken: true,     // 🔄 Renova os tokens de acesso sozinho em segundo plano para nunca deslogar
    detectSessionInUrl: true    // 🔑 Importante para detectar logins por links mágicos ou recuperação de senha
  }
})