'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { Brand } from '@/components/Brand'

export default function Home() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setMessage(null)
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.origin + '/dashboard' } })
    if (error) setMessage(error.message)
    else setMessage('Check your email for the magic link!')
    localStorage.setItem('pendingName', name)
    localStorage.setItem('pendingPhone', phone)
    setLoading(false)
  }

  return (
    <div className="card">
      <h2 className="font-display text-3xl mb-1">Join {Brand.name} Rewards</h2>
      <p className="mb-6 opacity-80">Get a stamp every drink. 10 stamps = 1 free drink.</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="w-full rounded-2xl border px-4 py-2" placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} required/>
        <input className="w-full rounded-2xl border px-4 py-2" type="email" placeholder="Email (for magic link)" value={email} onChange={e=>setEmail(e.target.value)} required/>
        <input className="w-full rounded-2xl border px-4 py-2" placeholder="Phone (digits only)" value={phone} onChange={e=>setPhone(e.target.value)} required/>
        <button className="btn w-full" type="submit" disabled={loading}>{loading ? 'Sending…' : 'Email me a magic-link'}</button>
      </form>
      {message && <p className="mt-3">{message}</p>}
      <div className="mt-6 text-sm opacity-80">Already a member? <a className="underline" href="/login">Log in</a></div>
    </div>
  )
}
