'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'

type Profile = { id: string; full_name: string | null; phone: string | null; role: 'customer'|'staff'|'owner'|null }
type Loyalty = { user_id: string; stamps: number }

export default function StaffPage() {
  const [me, setMe] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  // search state
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Profile[]>([])
  const [loyaltyMap, setLoyaltyMap] = useState<Record<string, number>>({})

  // redeem state
  const [code, setCode] = useState('')
  const allow = useMemo(() => me?.role === 'staff' || me?.role === 'owner', [me])

  useEffect(() => {
    init()
  }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { location.href = '/login'; return }

    const { data: p } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role')
      .eq('id', user.id)
      .maybeSingle()

    setMe(p as Profile | null)
    setLoading(false)

    if (!p || (p.role !== 'staff' && p.role !== 'owner')) {
      alert('Staff only area')
      location.href = '/dashboard'
    }
  }

  async function runSearch() {
    const digits = query.replace(/\D/g, '')
    if (!digits) { setResults([]); setLoyaltyMap({}); return }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, phone, role')
      .ilike('phone', `%${digits}%`)
      .limit(25)

    if (error) { alert(error.message); return }

    setResults((profiles ?? []) as Profile[])

    const ids = (profiles ?? []).map(p => p.id)
    if (ids.length) {
      const { data: loy } = await supabase
        .from('loyalty')
        .select('user_id, stamps')
        .in('user_id', ids)

      const map: Record<string, number> = {}
      for (const row of (loy ?? []) as Loyalty[]) map[row.user_id] = row.stamps
      setLoyaltyMap(map)
    } else {
      setLoyaltyMap({})
    }
  }

  async function giveStamp(target: Profile, delta = 1) {
    if (!allow) return
    // increment stamps
    await supabase.from('loyalty')
      .update({ stamps: (loyaltyMap[target.id] ?? 0) + delta })
      .eq('user_id', target.id)

    // audit trail
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('stamp_events').insert({
        user_id: target.id,
        staff_id: user.id,
        delta,
        note: 'stamp given'
      })
    }

    // refresh this row
    const { data: l } = await supabase.from('loyalty').select('user_id, stamps').eq('user_id', target.id).maybeSingle()
    setLoyaltyMap(prev => ({ ...prev, [target.id]: (l?.stamps ?? (prev[target.id] ?? 0)) }))
  }

  async function redeemByCode() {
    if (!allow) return
    const c = code.trim().toUpperCase()
    if (!c) return

    // find the redemption
    const { data: red, error } = await supabase
      .from('redemptions')
      .select('id, user_id, status')
      .eq('code', c)
      .maybeSingle()

    if (error) { alert(error.message); return }
    if (!red) { alert('Code not found'); return }
    if (red.status !== 'issued') { alert('Code already used/invalid'); return }

    // mark redeemed
    await supabase
      .from('redemptions')
      .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
      .eq('id', red.id)

    // clear stamps
    await supabase.from('loyalty').update({ stamps: 0 }).eq('user_id', red.user_id)

    // log event: negative clear
    const { data: l } = await supabase.from('loyalty').select('stamps').eq('user_id', red.user_id).maybeSingle()
    const cleared = 0 // after update it’s zero
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('stamp_events').insert({
        user_id: red.user_id,
        staff_id: user.id,
        delta: -(cleared), // informational; zero after clear
        note: 'redeemed free drink'
      })
    }

    alert('Redeemed! Stamps cleared.')
    setCode('')
    // refresh the result row if we have it on screen
    const idx = results.findIndex(r => r.id === red.user_id)
    if (idx >= 0) {
      const { data: l2 } = await supabase.from('loyalty').select('user_id, stamps').eq('user_id', red.user_id).maybeSingle()
      setLoyaltyMap(prev => ({ ...prev, [red.user_id]: l2?.stamps ?? 0 }))
    }
  }

  if (loading) return <p>Loading…</p>

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="font-display text-3xl">Staff Tools</h2>
        <p className="opacity-80">
          Signed in as: {me?.full_name || 'Unknown'} ({me?.role || '—'})
        </p>
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold text-lg">Search by phone</h3>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-2xl border px-4 py-2"
            placeholder="Enter phone digits (e.g., 864...)"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <button className="btn" onClick={runSearch}>Search</button>
        </div>

        {!!results.length && (
          <div className="mt-3 space-y-2">
            {results.map(r => (
              <div key={r.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <div className="font-semibold">{r.full_name || '(no name)'} — {r.phone || '(no phone)'}</div>
                  <div className="text-sm opacity-70">Stamps: {loyaltyMap[r.id] ?? 0}</div>
                </div>
                <div className="flex gap-2">
                  <button className="btn" onClick={() => giveStamp(r, 1)}>Give 1 stamp</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card space-y-3">
        <h3 className="font-semibold text-lg">Redeem by code</h3>
        <div className="flex gap-2">
          <input
            className="flex-1 rounded-2xl border px-4 py-2"
            placeholder="Enter 6-digit code"
            value={code}
            onChange={e => setCode(e.target.value)}
          />
          <button className="btn" onClick={redeemByCode}>Redeem</button>
        </div>
      </div>
    </div>
  )
        }
