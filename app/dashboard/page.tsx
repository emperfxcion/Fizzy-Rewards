'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase-browser'
import CupProgress from '@/components/CupProgress'
import ConfettiBurst from '@/components/ConfettiBurst'
import { REWARD_THRESHOLD, makeCode } from '@/lib/utils'

type Profile = { id: string; full_name: string | null; phone: string | null; role: string | null; email?: string | null }
type Loyalty = { user_id: string; stamps: number }

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null)
  const [loading, setLoading] = useState(true)
  const [code, setCode] = useState<string | null>(null)
  const [confetti, setConfetti] = useState(false)

  useEffect(() => { init() }, [])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { location.href = '/login'; return }

    // load (or create) profile
    const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    let profileRow = p

    if (!profileRow) {
      // fallback create if trigger didn’t run yet
      const nameLS = localStorage.getItem('pendingName') || ''
      const phoneLS = localStorage.getItem('pendingPhone') || ''
      await supabase.from('profiles').insert({ id: user.id, full_name: nameLS, phone: phoneLS, role: 'customer' })
      await supabase.from('loyalty').insert({ user_id: user.id, stamps: 0 })
      const { data: np } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
      profileRow = np
    }

    setProfile(profileRow)

    // ensure name/phone captured from magic-link params or localStorage
    try {
      const params = new URLSearchParams(location.search)
      const pendingName = params.get('name') || localStorage.getItem('pendingName') || ''
      const pendingPhone = params.get('phone') || localStorage.getItem('pendingPhone') || ''
      const needName = !profileRow?.full_name && !!pendingName
      const needPhone = !profileRow?.phone && !!pendingPhone
      if (needName || needPhone) {
        const updates: any = {}
        if (needName) updates.full_name = pendingName
        if (needPhone) updates.phone = pendingPhone
        await supabase.from('profiles').update(updates).eq('id', user.id)
        const { data: fresh } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
        if (fresh) setProfile(fresh)
      }
      localStorage.removeItem('pendingName')
      localStorage.removeItem('pendingPhone')
    } catch {}

    // load loyalty
    const { data: l } = await supabase.from('loyalty').select('*').eq('user_id', user.id).maybeSingle()
    setLoyalty(l)
    setLoading(false)

    // realtime: watch redemptions for this user
    supabase
      .channel('redemptions')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'redemptions', filter: `user_id=eq.${user.id}` },
        (payload: any) => {
          if ((payload.new as any).status === 'redeemed') {
            setConfetti(true); setTimeout(() => setConfetti(false), 1200)
            setCode(null); refresh()
          }
        }
      )
      .subscribe()
  }

  async function refresh() {
    if (!profile) return
    const { data: l } = await supabase.from('loyalty').select('*').eq('user_id', profile.id).maybeSingle()
    setLoyalty(l)
  }

  async function redeem() {
    if (!loyalty || loyalty.stamps < REWARD_THRESHOLD) return
    const candidate = makeCode()
    const { error } = await supabase.from('redemptions').insert({ user_id: profile!.id, code: candidate, status: 'issued' })
    if (!error) { setCode(candidate); setConfetti(true); setTimeout(() => setConfetti(false), 1000) }
    else alert(error.message)
  }

  if (loading) return <p>Loading…</p>

  return (
    <div className="space-y-4">
      <ConfettiBurst fire={confetti}/>
      <div className="card">
        <h2 className="font-display text-3xl">Hey {profile?.full_name || 'there'}!</h2>
        <p className="opacity-80">Show this screen when ordering to earn stamps.</p>
        <div className="flex items-center gap-6 mt-4">
          <CupProgress stamps={loyalty?.stamps ?? 0} threshold={REWARD_THRESHOLD} />
          <div>
            <p className="text-lg font-semibold">{loyalty?.stamps ?? 0} / {REWARD_THRESHOLD} stamps</p>
            <p className="opacity-70 text-sm">10 stamps = 1 free drink</p>
            <div className="mt-4 flex gap-2">
              <a className="btn" href="/staff" style={{background:'#3EC9F5'}}>Staff</a>
              <button className="btn" onClick={redeem} disabled={!loyalty || loyalty.stamps < REWARD_THRESHOLD}>Redeem free drink</button>
            </div>
            {code && (
              <div className="mt-4 p-3 rounded-2xl bg-brand-blush/60 border">
                <p className="font-semibold">Your redeem code:</p>
                <p className="text-3xl font-display tracking-widest">{code}</p>
                <p className="text-sm opacity-80">Show this to staff to claim your free drink.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
        }
