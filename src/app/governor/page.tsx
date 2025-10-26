'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { getSupabase } from '@/lib/supabase'

type TeamRow = { team_id: string; team_name: string; points: number; avg_rr: number | null; rest_days?: number | null }
type IndividualRow = { user_id: string; first_name?: string; last_name?: string; username?: string | null; team_id?: string | null; team_name?: string | null; points: number; avg_rr: number | null; rest_days?: number | null; missed_days?: number | null }
type Team = { id: string; name: string }
type Account = { id: string; first_name: string | null; last_name: string | null; username: string | null; team_id: string | null }

// Local-date helpers (device-local semantics)
function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function addDaysLocal(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function parseYmdLocal(s: string): Date {
  const [y,m,d] = s.split('-').map(v=>parseInt(v,10));
  return new Date(y, (m||1)-1, d||1);
}

const SEASON_START = '2025-10-25';

export default function GovernorPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [asOf, setAsOf] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [teamLeaderboard, setTeamLeaderboard] = useState<TeamRow[]>([]);
  const [individualLeaderboard, setIndividualLeaderboard] = useState<IndividualRow[]>([]);
  const [entriesForAggregates, setEntriesForAggregates] = useState<any[]>([]);
  const [restDaysByUser, setRestDaysByUser] = useState<Record<string, number>>({});
  const [missedDaysByUser, setMissedDaysByUser] = useState<Record<string, number>>({});
  const [teamMembers, setTeamMembers] = useState<Account[]>([]);
  const [ilbPage, setIlbPage] = useState<number>(1);
  const ilbPageSize = 10;

  // Gate by role and compute as-of (yesterday local)
  useEffect(() => {
    if (status === 'loading') return;
    const role = (session?.user as any)?.role;
    if (role !== 'governor') {
      router.replace('/dashboard');
      return;
    }
    const yesterday = addDaysLocal(new Date(), -1);
    setAsOf(ymdLocal(yesterday));
  }, [session, status, router]);

  // Load data when asOf set
  useEffect(() => {
    const load = async () => {
      if (!asOf) return;
      setLoading(true);
      try {
        // Teams list (for naming and ordering)
        const { data: tms } = await getSupabase().from('teams').select('id,name').order('name', { ascending: true });
        const teamList = (tms || []) as Team[];
        setTeams(teamList);
        if (!selectedTeamId && teamList.length) setSelectedTeamId(String(teamList[0].id));

        // Accounts (players + leaders) to ensure zero-entry users are included
        const { data: allAccounts } = await getSupabase().from('accounts').select('id, first_name, last_name, username, team_id, role');
        const filteredAccounts = ((allAccounts||[]) as Array<{ id: string; first_name: string|null; last_name: string|null; username: string|null; team_id: string|null; role: string }>)
          .filter(a => (a.role === 'player' || a.role === 'leader'));

        // Entries for season-to-date up to asOf (yesterday local)
        const { data: ents } = await getSupabase()
          .from('entries')
          .select('user_id,team_id,workout_type,duration,distance,steps,type,status,date,rr_value')
          .gte('date', SEASON_START)
          .lte('date', asOf)
          .eq('status', 'approved');
        const all = (ents || []) as Array<{ user_id: string; team_id: string | null; type: string; rr_value: number | null; workout_type: string | null; duration: number | null; distance: number | null; steps: number | null; date: string }>;        
        setEntriesForAggregates(all);
        // Build rest-day counts per user for season to date through asOf
        const restMap: Record<string, number> = {};
        const datesByUser: Record<string, Set<string>> = {};
        for (const e of all) {
          if (String(e.type) === 'rest') {
            const uid = String(e.user_id);
            restMap[uid] = (restMap[uid] || 0) + 1;
          }
          const uid2 = String(e.user_id);
          const ds = String(e.date);
          if (!datesByUser[uid2]) datesByUser[uid2] = new Set<string>();
          datesByUser[uid2].add(ds);
        }
        setRestDaysByUser(restMap);
        // Compute missed days per user = total days since season start through asOf minus unique entry days
        const start = parseYmdLocal(SEASON_START);
        const end = parseYmdLocal(asOf);
        const totalDays = Math.floor((end.getTime() - start.getTime()) / (24*3600*1000)) + 1;
        const missedMap: Record<string, number> = {};
        Object.entries(datesByUser).forEach(([uid, set]) => {
          const done = (set as Set<string>).size;
          missedMap[uid] = Math.max(totalDays - done, 0);
        });
        setMissedDaysByUser(missedMap);

        // Team aggregates from entries (points = count of approved entries; RR avg excluding zero values)
        const teamAgg = new Map<string, { points: number; rrSum: number; rrCnt: number }>();
        for (const e of all) {
          const tid = String(e.team_id || '');
          if (!tid) continue;
          const rec = teamAgg.get(tid) || { points: 0, rrSum: 0, rrCnt: 0 };
          rec.points += 1;
          const rr = typeof e.rr_value === 'number' ? e.rr_value : Number(e.rr_value || 0);
          if (rr > 0) { rec.rrSum += rr; rec.rrCnt += 1; }
          teamAgg.set(tid, rec);
        }
        const teamRows: TeamRow[] = teamList.map(t => {
          const agg = teamAgg.get(String(t.id)) || { points: 0, rrSum: 0, rrCnt: 0 };
          const avg = agg.rrCnt > 0 ? Math.round((agg.rrSum / agg.rrCnt) * 100) / 100 : 0;
          return { team_id: String(t.id), team_name: String(t.name), points: agg.points, avg_rr: avg } as TeamRow;
        });
        setTeamLeaderboard(teamRows);

        // Individual leaderboard from entries
        const userAgg = new Map<string, { points: number; rrSum: number; rrCnt: number }>();
        for (const e of all) {
          const uid = String(e.user_id);
          const rec = userAgg.get(uid) || { points: 0, rrSum: 0, rrCnt: 0 };
          rec.points += 1;
          const rr = typeof e.rr_value === 'number' ? e.rr_value : Number(e.rr_value || 0);
          if (rr > 0) { rec.rrSum += rr; rec.rrCnt += 1; }
          userAgg.set(uid, rec);
        }
        const teamNameById = new Map<string,string>();
        teamList.forEach(t => teamNameById.set(String(t.id), String(t.name)));
        const indiv: IndividualRow[] = filteredAccounts.map(a => {
          const agg = userAgg.get(String(a.id)) || { points: 0, rrSum: 0, rrCnt: 0 };
          const avg = agg.rrCnt > 0 ? Math.round((agg.rrSum / agg.rrCnt) * 100) / 100 : 0;
          const tName = a.team_id ? (teamNameById.get(String(a.team_id)) || null) : null;
          return {
            user_id: String(a.id),
            first_name: a.first_name || undefined,
            last_name: a.last_name || undefined,
            username: a.username || null,
            team_id: a.team_id ? String(a.team_id) : undefined,
            team_name: tName || undefined,
            points: agg.points,
            avg_rr: avg,
            rest_days: restMap[String(a.id)] || 0,
            missed_days: missedMap[String(a.id)] || 0,
          } as IndividualRow;
        });
        setIndividualLeaderboard(indiv);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [asOf, selectedTeamId]);

  // Load accounts for selected team to include players and leaders even if they have 0 entries
  useEffect(() => {
    const loadMembers = async () => {
      if (!selectedTeamId) { setTeamMembers([]); return; }
      const { data } = await getSupabase().from('accounts').select('id, first_name, last_name, username, team_id').eq('team_id', selectedTeamId);
      setTeamMembers(((data||[]) as Account[]).sort((a,b)=>{
        const an = (a.first_name||'').toLowerCase();
        const bn = (b.first_name||'').toLowerCase();
        return an.localeCompare(bn);
      }));
    };
    loadMembers();
  }, [selectedTeamId]);

  // Team drilldown list: filter individual leaderboard by team
  const teamPlayers = useMemo(() => {
    if (!selectedTeamId) return [] as IndividualRow[];
    // Map leaderboard by user for quick lookup
    const lbByUser = new Map<string, { points: number; avg_rr: number | null }>();
    (individualLeaderboard || []).forEach(r => lbByUser.set(String(r.user_id), { points: Number(r.points), avg_rr: r.avg_rr }));
    // Build rows for every member of the team
    const rows: IndividualRow[] = (teamMembers || []).map(m => {
      const lb = lbByUser.get(String(m.id));
      return {
        user_id: String(m.id),
        first_name: m.first_name || '',
        last_name: m.last_name || '',
        username: m.username,
        team_id: m.team_id ? String(m.team_id) : undefined,
        points: lb ? lb.points : 0,
        avg_rr: lb ? lb.avg_rr : null,
        rest_days: restDaysByUser[String(m.id)] || 0,
        missed_days: missedDaysByUser[String(m.id)] || 0,
      } as IndividualRow;
    });
    return rows.sort((a,b)=> (Number(b.points)-Number(a.points)) || (Number(b.avg_rr||0)-Number(a.avg_rr||0)));
  }, [individualLeaderboard, selectedTeamId, teamMembers, restDaysByUser, missedDaysByUser]);

  // Aggregate by activity
  const aggregates = useMemo(() => {
    const by: Record<string, { entries: number; duration: number; distance: number; steps: number }> = {};
    for (const e of entriesForAggregates) {
      const key = e.workout_type ?? 'unknown';
      if (!by[key]) by[key] = { entries: 0, duration: 0, distance: 0, steps: 0 };
      by[key].entries += 1;
      by[key].duration += Number(e.duration ?? 0);
      by[key].distance += Number(e.distance ?? 0);
      by[key].steps += Number(e.steps ?? 0);
    }
    return Object.entries(by).map(([workout_type, v]) => ({ workout_type, ...v })).sort((a,b)=> b.entries - a.entries);
  }, [entriesForAggregates]);

  // Sorted individual leaderboard and pagination (as of yesterday)
  const sortedIndividuals = useMemo(() => {
    return (individualLeaderboard || [])
      .slice()
      .sort((a,b)=> (Number(b.points)-Number(a.points)) || (Number(b.avg_rr||0)-Number(a.avg_rr||0)));
  }, [individualLeaderboard]);
  const ilbTotalPages = Math.max(1, Math.ceil(sortedIndividuals.length / ilbPageSize));
  const ilbPageSafe = Math.min(Math.max(ilbPage, 1), ilbTotalPages);
  const ilbSlice = useMemo(() => {
    const from = (ilbPageSafe - 1) * ilbPageSize; const to = from + ilbPageSize;
    return sortedIndividuals.slice(from, to);
  }, [sortedIndividuals, ilbPageSafe]);

  if (status === 'loading' || loading || !asOf) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6">
        <p className="text-sm text-gray-600">Loading governor dashboard…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <div className="text-sm text-gray-600">As of {asOf}</div>

      {/* Card 1: Team leaderboard */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-base font-semibold mb-3">Team Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr>
                <th className="py-2 pr-2 w-12">Rank</th>
                <th className="py-2 pr-2">Team Name</th>
                <th className="py-2 pr-2 text-right w-20">Points</th>
                <th className="py-2 pr-2 text-right w-24">Avg RR</th>
              </tr>
            </thead>
            <tbody>
              {teamLeaderboard
                .slice()
                .sort((a,b)=> (Number(b.points)-Number(a.points)) || (Number(b.avg_rr||0)-Number(a.avg_rr||0)))
                .map((t, idx) => (
                  <tr key={t.team_id} className="border-t hover:bg-gray-50">
                    <td className="py-2 pr-2 [font-variant-numeric:tabular-nums] font-bold text-rfl-navy">{idx+1}</td>
                    <td className="py-2 pr-2 font-medium text-rfl-navy">{t.team_name}</td>
                    <td className="py-2 pr-2 text-right [font-variant-numeric:tabular-nums] font-bold text-rfl-coral">{t.points}</td>
                    <td className="py-2 pr-2 text-right [font-variant-numeric:tabular-nums] font-semibold text-rfl-navy">{typeof t.avg_rr === 'number' ? t.avg_rr.toFixed(2) : '0.00'}</td>
                  </tr>
                ))}
              {!teamLeaderboard.length && (
                <tr><td colSpan={4} className="py-8 text-center text-gray-500">No data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 2: Aggregate activity snapshot (moved up under leaderboard) */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-base font-semibold mb-3">League Activity Snapshot (Aggregate)</h2>
        <div className="overflow-x-auto pb-2">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-gray-600">
              <tr>
                <th className="py-2 px-2">Activity</th>
                <th className="py-2 px-2 text-right">Entries</th>
                <th className="py-2 px-2 text-right">Total Duration</th>
                <th className="py-2 px-2 text-right">Total Distance</th>
                <th className="py-2 px-2 text-right">Total Steps</th>
              </tr>
            </thead>
            <tbody>
              {aggregates.map((r) => (
                <tr key={r.workout_type} className="border-t">
                  <td className="py-2 px-2 whitespace-nowrap">{r.workout_type}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap [font-variant-numeric:tabular-nums]">{r.entries}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap [font-variant-numeric:tabular-nums]">{r.duration}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap [font-variant-numeric:tabular-nums]">{r.distance}</td>
                  <td className="py-2 px-2 text-right whitespace-nowrap [font-variant-numeric:tabular-nums]">{r.steps}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-xs text-gray-500">Season-to-date through {asOf}</div>
      </div>

      {/* Card 3: Team drilldown */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Team Summary (Players)</h2>
          <select className="border rounded px-2 py-1 text-sm" value={selectedTeamId ?? ''} onChange={(e)=> setSelectedTeamId(e.target.value)}>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr>
                <th className="py-2 pr-2 w-12">Rank</th>
                <th className="py-2 pr-2">Player</th>
                <th className="py-2 pr-2 text-right w-20">Points</th>
                <th className="py-2 pr-2 text-right w-24">Avg RR</th>
                <th className="py-2 pr-2 text-right w-24">Rest Days</th>
                <th className="py-2 pr-2 text-right w-24">Missed Days</th>
              </tr>
            </thead>
            <tbody>
              {teamPlayers.map((p, idx) => (
                <tr key={String(p.user_id)} className="border-t hover:bg-gray-50">
                  <td className="py-2 pr-2 [font-variant-numeric:tabular-nums] font-bold text-rfl-navy">{idx+1}</td>
                  <td className="py-2 pr-2">
                    <div className="font-medium">{(p as any).first_name ?? ''} {(p as any).last_name ?? ''}</div>
                    {p.username && <div className="text-xs text-gray-500">@{p.username}</div>}
                  </td>
                  <td className="py-2 pr-2 text-right [font-variant-numeric:tabular-nums] font-bold text-rfl-coral">{p.points}</td>
                  <td className="py-2 pr-2 text-right [font-variant-numeric:tabular-nums] font-semibold text-rfl-navy">{typeof p.avg_rr === 'number' ? p.avg_rr.toFixed(2) : '0.00'}</td>
                  <td className="py-2 pr-2 text-right">{p.rest_days ?? restDaysByUser[String(p.user_id)] ?? 0}</td>
                  <td className="py-2 pr-2 text-right">{p.missed_days ?? 0}</td>
                </tr>
              ))}
              {!teamPlayers.length && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">No players yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Card 4: Individual leaderboard (league-wide) with pagination */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-base font-semibold mb-3">Individual Leaderboard</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-gray-600">
              <tr>
                <th className="py-2 pr-2 w-12">Rank</th>
                <th className="py-2 pr-2">Player</th>
                <th className="py-2 pr-2 text-right w-20">Points</th>
                <th className="py-2 pr-2 text-right w-24">RR</th>
                <th className="py-2 pr-2 text-right w-24">Rest Days</th>
                <th className="py-2 pr-2 text-right w-24">Missed Days</th>
              </tr>
            </thead>
            <tbody>
              {ilbSlice
                .map((u, idx) => (
                  <tr key={String(u.user_id)} className="border-t hover:bg-gray-50">
                    <td className="py-2 pr-2 [font-variant-numeric:tabular-nums] font-bold text-rfl-navy">{(ilbPageSafe - 1) * ilbPageSize + idx + 1}</td>
                    <td className="py-2 pr-2">
                      <div className="font-medium">{(u as any).first_name ?? 'Player'} {(u as any).last_name ?? ''}</div>
                      {u.team_name && <div className="text-xs text-gray-500">{u.team_name}</div>}
                    </td>
                    <td className="py-2 pr-2 text-right [font-variant-numeric:tabular-nums] font-bold text-rfl-coral">{u.points}</td>
                    <td className="py-2 pr-2 text-right [font-variant-numeric:tabular-nums] font-semibold text-rfl-navy">{typeof u.avg_rr === 'number' ? u.avg_rr.toFixed(2) : '0.00'}</td>
                    <td className="py-2 pr-2 text-right">{u.rest_days ?? restDaysByUser[String(u.user_id)] ?? 0}</td>
                    <td className="py-2 pr-2 text-right">{missedDaysByUser[String(u.user_id)] ?? 0}</td>
                  </tr>
                ))}
              {!sortedIndividuals.length && (
                <tr><td colSpan={6} className="py-8 text-center text-gray-500">No data yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-gray-600">Page {ilbPageSafe} of {ilbTotalPages}</div>
          <div className="flex items-center gap-2">
            <button
              className={`px-3 py-1 rounded border text-sm ${ilbPageSafe<=1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              onClick={() => setIlbPage(p => Math.max(1, p-1))}
              disabled={ilbPageSafe<=1}
            >
              Prev
            </button>
            <button
              className={`px-3 py-1 rounded border text-sm ${ilbPageSafe>=ilbTotalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
              onClick={() => setIlbPage(p => Math.min(ilbTotalPages, p+1))}
              disabled={ilbPageSafe>=ilbTotalPages}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


