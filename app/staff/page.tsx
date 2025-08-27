'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import PhoneSearch from '@/components/PhoneSearch'
import { REWARD_THRESHOLD } from '@/lib/utils'

type Profile = { id: string, full_name: string | null, phone: string | null, role: string | null }
type Loyalty = { user_id: string, stamps: number }

export default function Staff() {
  const [me, setMe] = useState<Profile | null>(null)
  const [target, setTarget] = useState<Profile | null>(null)
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null)
  const [code, setCode] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => { init() }, [])
  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { location.href = '/login'; return }
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    if (!p || !['staff','owner'].includes(p.role)) { alert('Staff only area'); location.href = '/dashboard'; return }
    setMe(p as Profile)
  }

  function onFound(p: Profile, l: Loyalty | null) { setTarget(p); setLoyalty(l); setMessage(null) }

  async function giveStamp() {
    if (!target) return
    if (!loyalty) { await supabase.from('loyalty').insert({ user_id: target.id, stamps: 0 }) }
    const { data, error } = await supabase.from('loyalty').update({ stamps: (loyalty?.stamps ?? 0) + 1 }).eq('user_id', target.id).select().maybeSingle()
    if (!error) { setLoyalty(data as any); await supabase.from('stamp_events').insert({ user_id: target.id, staff_id: me!.id, delta: 1 }); setMessage('Stamp added!') }
    else setMessage(error.message)
  }

  async function redeemByCode() {
    if (!code) return
    const { data: record, error } = await supabase.from('redemptions').select('*').eq('code', code).eq('status', 'issued').maybeSingle()
    if (error || !record) { setMessage('Invalid code.'); return }
    await supabase.from('redemptions').update({ status: 'redeemed', redeemed_at: new Date().toISOString() }).eq('id', record.id)
    await supabase.from('loyalty').update({ stamps: 0 }).eq('user_id', record.user_id)
    await supabase.from('stamp_events').insert({ user_id: record.user_id, staff_id: me!.id, delta: -REWARD_THRESHOLD, note: 'Free drink redeemed' })
    setMessage('Redeemed! Stamps cleared.')
    setCode('')
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-display text-3xl">Staff Tools</h2>
        <p className="opacity-80 text-sm">Signed in as: <b>{me?.full_name}</b> ({me?.role})</p>
      </div>
      <PhoneSearch onFound={onFound}/>
      {target && (
        <div className="card">
          <h3 className="font-semibold text-lg mb-2">Customer</h3>
          <p><b>Name:</b> {target.full_name || '—'} • <b>Phone:</b> {target.phone || '—'}</p>
          <p className="mt-1"><b>Stamps:</b> {loyalty?.stamps ?? 0}</p>
          <div className="mt-3 flex gap-2"><button className="btn" onClick={giveStamp}>Give 1 stamp</button></div>
        </div>
      )}
      <div className="card">
        <h3 className="font-semibold text-lg mb-2">Redeem a code</h3>
        <div className="flex gap-2">
          <input className="flex-1 rounded-2xl border px-4 py-2" placeholder="6-digit code" value={code} onChange={e=>setCode(e.target.value)} />
          <button className="btn" onClick={redeemByCode}>Redeem</button>
        </div>
        {message && <p className="mt-2">{message}</p>}
      </div>
    </div>
  )
}
