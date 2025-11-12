'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

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
  const [loading, setLoading] = useState(true)
  const [teams, setTeams] = useState<Team[]>([])
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)

  useEffect(() => {
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
  }, [])

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

  if (loading) {
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="text-left text-gray-600">
              <tr>
                <th className="py-2 pr-2 w-64">Challenge</th>
                <th className="py-2 pr-2 w-40">Date Range</th>
                {teams.map((t) => (
                  <th key={String(t.id)} className="py-2 px-2 text-right whitespace-nowrap">
                    {t.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {challenges.map((ch) => (
                <tr key={ch.id} className="border-t align-top">
                  <td className="py-2 pr-2">
                    <button
                      className="font-medium text-blue-600 underline hover:text-blue-700"
                      onClick={()=>{
                        if (!ch.doc_url) return
                        setViewerUrl(ch.doc_url)
                      }}
                    >
                      {ch.name}
                    </button>
                  </td>
                  <td className="py-2 pr-2 whitespace-nowrap">
                    <span className="text-gray-700">{formatRangeNoYear(ch.start_date, ch.end_date)}</span>
                  </td>
                  {teams.map((t) => (
                    <td key={`${ch.id}-${String(t.id)}`} className="py-2 px-2 text-right">
                      <span className="[font-variant-numeric:tabular-nums]">
                        {ch.scores[String(t.id)] ?? ''}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
              {!challenges.length && (
                <tr>
                  <td colSpan={2 + teams.length} className="py-8 text-center text-gray-500">
                    No challenges yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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


