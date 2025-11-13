'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import React from 'react'

type Team = { id: string; name: string }
type Challenge = {
  id: string
  name: string
  doc_url: string | null
  start_date: string
  end_date: string
  scores: Record<string, number | null>
}

export default function MyChallengesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [authReady, setAuthReady] = useState(false)
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.replace('/signin')
      return
    }
    const role = (session.user as any)?.role
    if (role === 'governor') {
      router.replace('/governor')
      return
    }
    setAuthReady(true)
  }, [status, session, router])

  useEffect(() => {
    if (!authReady) return
    const load = async () => {
      setLoading(true)
      try {
        const { data: tms } = await getSupabase().from('teams').select('id,name').order('name', { ascending: true })
        const teamList = (tms || []) as Team[]
        setTeams(teamList)

        const emptyScores = (list: Team[]) => {
          const s: Record<string, number | null> = {}
          for (const t of list) s[String(t.id)] = null
          return s
        }

        const { data: chRows } = await getSupabase()
          .from('special_challenges')
          .select('id,name,doc_url,start_date,end_date')
          .order('created_at', { ascending: false })
        const { data: scRows } = await getSupabase()
          .from('special_challenge_team_scores')
          .select('challenge_id,team_id,score')

        const byId = new Map<string, Challenge>();
        (chRows || []).forEach((r: any) => {
          byId.set(String(r.id), {
            id: String(r.id),
            name: String(r.name),
            doc_url: r.doc_url || null,
            start_date: r.start_date || '',
            end_date: r.end_date || '',
            scores: emptyScores(teamList),
          })
        })
        ;(scRows || []).forEach((r: any) => {
          const id = String(r.challenge_id)
          const tid = String(r.team_id)
          if (!byId.has(id)) return
          const ch = byId.get(id)!
          ch.scores[tid] = r.score === null || r.score === undefined ? null : Number(r.score)
        })
        setChallenges(Array.from(byId.values()))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [authReady])

  function formatRangeNoYear(startStr: string, endStr: string) {
    if (!startStr && !endStr) return '—'
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const ps = (s: string) => {
      const [y,m,d] = s.split('-').map(v=>parseInt(v,10))
      return new Date(y,(m||1)-1,d||1)
    }
    const s = startStr ? ps(startStr) : null
    const e = endStr ? ps(endStr) : null
    if (s && e) {
      const sameMonth = s.getMonth() === e.getMonth()
      const sm = months[s.getMonth()]
      const em = months[e.getMonth()]
      const sd = s.getDate(); const ed = e.getDate()
      return sameMonth ? `${sm} ${sd} – ${ed}` : `${sm} ${sd} – ${em} ${ed}`
    }
    if (s && !e) return `${months[s.getMonth()]} ${s.getDate()}`
    if (!s && e) return `${months[e.getMonth()]} ${e.getDate()}`
    return '—'
  }

  if (status === 'loading' || !authReady || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <p className="text-sm text-gray-600">Loading challenges…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-4">
      <h1 className="text-xl font-semibold text-rfl-navy">My Challenges</h1>
      <div className="bg-white rounded-lg shadow p-4">
        {/* Matrix: challenges as columns, teams as rows */}
        <div className="overflow-x-auto">
          <div
            className="text-sm inline-grid gap-x-10"
            style={{ gridTemplateColumns: `auto repeat(${Math.max(challenges.length, 1)}, minmax(100px, max-content))` }}
          >
            <div className="px-2 py-2 border-b">
              <div className="text-sm font-semibold text-gray-700">Challenge</div>
              <div className="text-xs text-gray-500 mt-1">Timeline</div>
            </div>
            {challenges.map((ch) => (
              <div key={`h-${ch.id}`} className="pl-4 pr-3 py-2 border-b whitespace-nowrap">
                <button
                  className="text-blue-600 underline hover:text-blue-700 text-sm font-medium"
                  onClick={()=> { if (ch.doc_url) setViewerUrl(ch.doc_url) }}
                >
                  {ch.name}
                </button>
                <div className="text-xs font-semibold text-gray-700 mt-1">{formatRangeNoYear(ch.start_date, ch.end_date)}</div>
              </div>
            ))}

            {teams.map((t, idx) => {
              const logoName = String(t.name).replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'') + '_Logo.jpeg'
              const logoPath = `/img/${logoName}`
              const isLast = idx >= teams.length - 1
              return (
                <React.Fragment key={t.id}>
                  <div className={`px-2 py-3 ${!isLast ? 'border-b' : ''}`}>
                    <div className="flex items-center gap-2">
                      <img
                        src={logoPath}
                        alt={`${t.name} logo`}
                        className="w-6 h-6 rounded border border-gray-200 object-cover flex-shrink-0"
                        onError={(e)=> { (e.target as HTMLImageElement).src = '/img/placeholder-team.svg' }}
                      />
                      <span className="font-medium text-rfl-navy whitespace-nowrap">{t.name}</span>
                    </div>
                  </div>
                  {challenges.map((ch) => (
                    <div
                      key={`${t.id}-${ch.id}`}
                      className={`pl-4 pr-3 py-3 text-right [font-variant-numeric:tabular-nums] ${!isLast ? 'border-b' : ''}`}
                    >
                      {ch.scores[String(t.id)] ?? ''}
                    </div>
                  ))}
                </React.Fragment>
              )
            })}
            {!teams.length && (
              <div className="py-8 text-center text-gray-500" style={{ gridColumn: `span ${Math.max(challenges.length, 1) + 1}` }}>
                No challenges yet.
              </div>
            )}
          </div>
        </div>
      </div>
      {!!viewerUrl && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={()=> setViewerUrl(null)}>
          <div className="bg-white w-[95%] h-[85%] max-w-5xl rounded shadow relative" onClick={(e)=> e.stopPropagation()}>
            <button className="absolute top-2 right-2 p-2 rounded border hover:bg-gray-50" onClick={()=> setViewerUrl(null)} aria-label="Close"><X className="w-4 h-4" /></button>
            <iframe src={viewerUrl || ''} className="w-full h-full rounded-b" title="Challenge document"></iframe>
          </div>
        </div>
      )}
    </div>
  )
}


