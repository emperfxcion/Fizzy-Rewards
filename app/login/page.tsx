'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

export default function Login() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  async function login(e: React.FormEvent) {
    e.preventDefault()
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/dashboard' } })
    setMessage(error ? error.message : 'Check your email for the magic link!')
  }
  return (
    <div className="card">
      <h2 className="font-display text-3xl mb-1">Magic-link Login</h2>
      <form onSubmit={login} className="space-y-3">
        <input className="w-full rounded-2xl border px-4 py-2" type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>
        <button className="btn w-full" type="submit">Send link</button>
      </form>
      {message && <p className="mt-3">{message}</p>}
    </div>
  )
}
