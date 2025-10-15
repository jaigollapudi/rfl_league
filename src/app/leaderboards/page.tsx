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

  // Build standings + bars: simplified using direct per-team aggregation matching Team page
  const [standings, setStandings] = useState<LeagueTeam[]>([]);
  useEffect(() => {
    (async () => {
      const start = new Date(Date.UTC(new Date().getUTCFullYear(), 8, 1));
      const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
      const seasonStart = start.toISOString().split('T')[0];
      const seasonEnd = today.toISOString().split('T')[0];

      // Fetch all teams
      const { data: allTeams } = await getSupabase().from('teams').select('id, name');
      const teams = (allTeams || []) as Array<{ id: string; name: string }>;

      const standingsData: LeagueTeam[] = [];
      for (const team of teams) {
        const tid = String(team.id);

        // Roster size
        const { count: rosterSize } = await getSupabase()
          .from('accounts')
          .select('id', { count: 'exact', head: true })
          .eq('team_id', tid);
        const roster = rosterSize || 0;

        // Approved entries with user_id
        const { data: entries } = await getSupabase()
          .from('entries')
          .select('type, rr_value, date, user_id')
          .eq('team_id', tid)
          .eq('status', 'approved')
          .gte('date', seasonStart)
          .lte('date', seasonEnd);
        const ents = (entries || []) as Array<{ type: string; rr_value: number | null; date: string; user_id: string }>;

        // Points: workout=1, rest=1 only if RR>0
        let pts = 0; let rrSum = 0; let rrCnt = 0; let restUsed = 0;
        ents.forEach(e => {
          const rr = typeof e.rr_value === 'number' ? e.rr_value : Number(e.rr_value || 0);
          const isRest = String(e.type) === 'rest';
          if (isRest && rr > 0) pts += 1;
          else if (!isRest) pts += 1;
          if (rr > 0) { rrSum += rr; rrCnt += 1; }
          if (isRest) restUsed += 1;
        });
        const avgRR = rrCnt > 0 ? Math.round((rrSum / rrCnt) * 100) / 100 : 0;

        // Missed days: per day, check if all members have entry
        const byDateUsers = new Map<string, Set<string>>();
        ents.forEach(e => {
          const ds = String(e.date); const uid = String(e.user_id);
          const s = byDateUsers.get(ds) || new Set<string>();
          s.add(uid);
          byDateUsers.set(ds, s);
        });
        let missed = 0; let cur = new Date(start);
        while (cur.getTime() <= today.getTime()) {
          const ds = cur.toISOString().split('T')[0];
          const present = byDateUsers.get(ds)?.size || 0;
          if (roster > 0 && present < roster) missed += 1;
          cur = new Date(cur.getTime() + 24 * 3600 * 1000);
        }

        standingsData.push({
          teamId: tid,
          teamName: String(team.name),
          points: pts,
          missedDays: missed,
          avgRR,
          restUsed,
        });
      }
      standingsData.sort((a,b)=> b.points - a.points);
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
