'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

type Profile = { id: string, full_name: string | null, phone: string | null, role: string | null }
type Loyalty = { user_id: string, stamps: number }

export default function PhoneSearch({ onFound }:{ onFound: (p: Profile, l: Loyalty | null) => void }) {
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function search() {
    setLoading(true); setError(null)
    const digits = phone.replace(/\D/g, '').slice(-10)
    const { data: profile, error: e1 } = await supabase
      .from('profiles').select('*').ilike('phone', `%${digits}%`).maybeSingle()
    if (e1) { setError(e1.message); setLoading(false); return }
    if (!profile) { setError('No match'); setLoading(false); return }
    const { data: loyalty } = await supabase.from('loyalty').select('*').eq('user_id', profile.id).maybeSingle()
    onFound(profile as Profile, loyalty as Loyalty | null)
    setLoading(false)
  }
  return (
    <div className="card">
      <label className="block mb-2 font-semibold">Search by phone</label>
      <div className="flex gap-2">
        <input className="flex-1 rounded-2xl border px-4 py-2" placeholder="(555) 123-4567" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <button className="btn" onClick={search} disabled={loading}>{loading ? 'Searching...' : 'Search'}</button>
      </div>
      {error && <p className="text-red-600 mt-2">{error}</p>}
      <p className="text-sm opacity-70 mt-2">Tip: enter last 4 digits or full phone.</p>
    </div>
  )
                                                                                                                                    }
