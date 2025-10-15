"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import LeagueStandings, { LeagueTeam } from "../(app)/dashboard/LeagueStandings";

type TeamRow = { team_id: string; team_name: string; points: number; avg_rr: number | null };
type PlayerRow = { user_id: string; name: string; team: string | null; points: number; avg_rr: number | null };

export default function LeaderboardsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [playersTotal, setPlayersTotal] = useState<number>(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Fetch leaderboards (existing)
  useEffect(() => {
    (async () => {
      const fetchLeaderboards = async () => {
        const [{ data: t, error: teamError }, { data: p, error: playerError }] = await Promise.all([
          getSupabase().rpc('rfl_team_leaderboard'),
          getSupabase().rpc('rfl_individual_leaderboard'),
        ]);

        if (!teamError) {
          const teamsRows = (t || []) as TeamRow[];
          const teamsSorted = [...teamsRows].sort((a,b)=> (b.points - a.points) || ((b.avg_rr||0) - (a.avg_rr||0)));
          setTeams(teamsSorted);
        } else { setTeams([]); }

        if (!playerError) {
          const rp = (p || []) as Array<{ user_id: string; points: number; avg_rr: number | null }>;
          const userIds = rp.map(r => r.user_id);
          const { data: users } = userIds.length ? await getSupabase()
            .from('accounts').select('id, first_name, team_id').in('id', userIds) : { data: [] } as { data: Array<{ id: string; first_name: string; team_id: string | null }> };
          const teamIds = Array.from(new Set((users || []).map((u)=> String(u.team_id)).filter(Boolean)));
          const { data: teamsMeta } = teamIds.length ? await getSupabase().from('teams').select('id, name').in('id', teamIds) : { data: [] } as { data: Array<{ id: string; name: string }> };
          const teamNameById = new Map<string,string>();
          (teamsMeta || []).forEach((t)=> teamNameById.set(String(t.id), String(t.name)));
          const usersById = new Map((users || []).map((u)=> [String(u.id), u]));
          const playersAll: PlayerRow[] = rp.map(row => {
            const u = usersById.get(String(row.user_id));
            const teamName = u?.team_id ? (teamNameById.get(String(u.team_id)) || null) : null;
            return { user_id: String(row.user_id), name: String(u?.first_name || '—'), team: teamName, points: row.points, avg_rr: row.avg_rr } as PlayerRow;
          }).sort((a,b)=> (b.points - a.points) || ((b.avg_rr||0) - (a.avg_rr||0)));
          const from = (page - 1) * pageSize; const to = from + pageSize;
          setPlayersTotal(playersAll.length); setPlayers(playersAll.slice(from, to));
        } else { setPlayersTotal(0); setPlayers([]); }
      };
      fetchLeaderboards();
    })();
  }, [page]);

  // Build standings + bars (moved from dashboard)
  const [standings, setStandings] = useState<LeagueTeam[]>([]);
  useEffect(() => {
    (async () => {
      const start = new Date(Date.UTC(new Date().getUTCFullYear(), 8, 1));
      const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
      const { data: rawEntries } = await getSupabase()
        .from('entries')
        .select('date, team_id, rr_value, type')
        .eq('status', 'approved')
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0]);
      const teamIds = Array.from(new Set((rawEntries || []).map((e: any) => String(e.team_id)).filter(Boolean)));
      const { data: teamsMeta } = teamIds.length ? await getSupabase().from('teams').select('id, name').in('id', teamIds) : { data: [] } as { data: Array<{ id: string; name: string }> };
      const teamNameById = new Map<string, string>(); (teamsMeta || []).forEach((t: any) => teamNameById.set(String(t.id), String(t.name)));

      const dates: string[] = []; let cursor = start; while (cursor.getTime() <= today.getTime()) { dates.push(new Date(cursor).toISOString().split('T')[0]); cursor = new Date(cursor.getTime() + 24*3600*1000); }
      const pointsByTeam = new Map<string, number>(); const rrAggByTeam = new Map<string,{sum:number;count:number}>(); const restByTeam = new Map<string, number>();
      // Build map of team -> date -> set(user_ids) to determine per-day completeness
      const byTeamDateUsers = new Map<string, Map<string, Set<string>>>();
      (rawEntries || []).forEach((e: any) => {
        const tid = String(e.team_id || ''); if (!tid) return; const ds = String(e.date);
        // Match team page points rule: workouts always 1; rest day counts 1 only if RR > 0
        const rrNum = typeof e.rr_value === 'number' ? e.rr_value : Number(e.rr_value || 0);
        const isRest = String(e.type) === 'rest';
        const addPoint = isRest ? (rrNum > 0) : true;
        if (addPoint) pointsByTeam.set(tid, (pointsByTeam.get(tid) || 0) + 1);
        const rr = typeof e.rr_value === 'number' ? e.rr_value : Number(e.rr_value || 0);
        if (rr > 0) { const agg = rrAggByTeam.get(tid) || { sum: 0, count: 0 }; agg.sum += rr; agg.count += 1; rrAggByTeam.set(tid, agg); }
        if (String(e.type) === 'rest') { restByTeam.set(tid, (restByTeam.get(tid) || 0) + 1); }
        const perDate = byTeamDateUsers.get(tid) || new Map<string, Set<string>>();
        const set = perDate.get(ds) || new Set<string>();
        // We don't have user_id in this query, so fetch them separately
        // To avoid extra queries per row, we will fetch team members below and only compare counts. For now mark a placeholder.
        // perDate will count number of entries regardless of who made them.
        // We'll store string 'count' by duplicating entries via set.add(`${tid}-${Math.random()}`) would be wrong. Instead, we will refetch with user_id below.
      });

      // Re-fetch minimal set containing user_id for completeness check
      const { data: rawEntriesUsers } = await getSupabase()
        .from('entries')
        .select('date, team_id, user_id')
        .eq('status','approved')
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', today.toISOString().split('T')[0]);
      const perTeamDateUsers = new Map<string, Map<string, Set<string>>>();
      (rawEntriesUsers || []).forEach((e: any) => {
        const tid = String(e.team_id || ''); if (!tid) return; const ds = String(e.date); const uid = String(e.user_id || '');
        const m = perTeamDateUsers.get(tid) || new Map<string, Set<string>>();
        const s = m.get(ds) || new Set<string>(); if (uid) s.add(uid); m.set(ds, s); perTeamDateUsers.set(tid, m);
      });

      // Fetch team members to know per-team size
      const { data: teamMembers } = teamIds.length ? await getSupabase().from('accounts').select('id, team_id').in('team_id', teamIds) : { data: [] } as { data: Array<{ id: string; team_id: string }> };
      const memberIdsByTeam = new Map<string, Set<string>>();
      (teamMembers || []).forEach((m:any)=>{ const tid = String(m.team_id); const set = memberIdsByTeam.get(tid) || new Set<string>(); set.add(String(m.id)); memberIdsByTeam.set(tid,set); });

      const missedByTeam = new Map<string, number>(); const allTeamIds = new Set<string>(teamIds);
      allTeamIds.forEach((tid)=>{ missedByTeam.set(tid,0); });
      dates.forEach((ds)=>{
        allTeamIds.forEach((tid)=>{
          const members = memberIdsByTeam.get(tid) || new Set<string>();
          if (members.size === 0) return; // no members
          const presentUsers = (perTeamDateUsers.get(tid)?.get(ds)) || new Set<string>();
          if (presentUsers.size < members.size) {
            missedByTeam.set(tid, (missedByTeam.get(tid) || 0) + 1);
          }
        });
      });
      const standingsData: LeagueTeam[] = Array.from(allTeamIds).map((tid) => ({
        teamId: tid,
        teamName: teamNameById.get(tid) || `Team ${tid.slice(0,4)}`,
        points: pointsByTeam.get(tid) || 0,
        missedDays: missedByTeam.get(tid) || 0,
        avgRR: (() => { const a = rrAggByTeam.get(tid); return a && a.count>0 ? Math.round((a.sum / a.count) * 100)/100 : 0; })(),
        restUsed: restByTeam.get(tid) || 0,
      })).sort((a,b)=> b.points - a.points);
      setStandings(standingsData);
    })();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-rfl-navy mb-2">Leaderboards</h1>
        <p className="text-gray-600">Live standings across all approved entries</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-rfl-navy">Teams</CardTitle>
            <CardDescription>Team Standings</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Rank cards + bars */}
            {standings.length ? (
              <div className="space-y-3 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {standings.slice(0,3).map((t, idx) => (
                    <div key={t.teamId} className="p-4 rounded border bg-white flex flex-col items-center text-center">
                      <div className="text-sm text-gray-700">{idx===0?'🥇 Rank 1': idx===1?'🥈 Rank 2':'🥉 Rank 3'}</div>
                      <div className="text-lg font-semibold text-rfl-navy mt-1">{t.teamName}</div>
                      <div className="text-3xl font-bold text-rfl-coral mt-2">{t.points}</div>
                      <div className="text-xs text-gray-600 mt-1 flex gap-3">
                        <span><b>Missed days:</b> {t.missedDays}</span>
                        <span>|</span>
                        <span><b>Avg RR:</b> {typeof t.avgRR === 'number' ? t.avgRR.toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <LeagueStandings teams={standings} />
              </div>
            ) : null}

            {/* Old teams list removed per request */}
          </CardContent>
        </Card>

        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-rfl-navy">Individuals</CardTitle>
            <CardDescription>Top performers across all teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {players.map((p, idx) => (
                <div key={p.user_id} className="grid grid-cols-3 sm:flex sm:items-center sm:justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rfl-coral text-white flex items-center justify-center font-semibold">{idx+1 + (page-1)*pageSize}</div>
                    <div>
                      <div className="font-medium text-rfl-navy">{p.name}</div>
                      <div className="text-xs text-gray-600">{p.team ?? '—'}</div>
                    </div>
                  </div>
                  {/* Fixed-width stats to avoid zigzag */}
                  <div className="col-span-2 sm:col-auto flex items-center justify-end gap-8 text-sm">
                    <div className="text-center" style={{ minWidth: 48 }}>
                      <div className="font-semibold text-rfl-coral">{p.points}</div>
                      <div className="text-gray-600">points</div>
                    </div>
                    <div className="text-center" style={{ minWidth: 48 }}>
                      <div className="font-semibold text-rfl-navy">{p.avg_rr ?? '-'}</div>
                      <div className="text-gray-600">RR</div>
                    </div>
                  </div>
                </div>
              ))}
              {!players.length && <div className="text-gray-600">No data yet.</div>}
            </div>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button className={`p-1 rounded border ${page > 1 ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`} onClick={()=>page>1 && setPage(page-1)} aria-label="Previous page">‹</button>
              <div className="px-3 py-1 rounded bg-gray-100 text-sm font-medium text-gray-800">Page {page}</div>
              <button className={`p-1 rounded border ${page * pageSize < playersTotal ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`} onClick={()=> page * pageSize < playersTotal && setPage(page+1)} aria-label="Next page">›</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
