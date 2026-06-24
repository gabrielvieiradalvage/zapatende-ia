import { redirect } from 'next/navigation'

export default function IndexPage() {
  // Redireciona automaticamente qualquer pessoa que entrar na raiz (/) para o login
  redirect('/login')
}