"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type TeamRow = { team_id: string; team_name: string; points: number; avg_rr: number | null };
type PlayerRow = { user_id: string; name: string; team: string | null; points: number; avg_rr: number | null };

export default function LeaderboardsPage() {
  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [playersTotal, setPlayersTotal] = useState<number>(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    (async () => {
      const fetchLeaderboards = async () => {
        // Call RPCs with no params; both return aggregated rows
        const [{ data: t, error: teamError }, { data: p, error: playerError }] = await Promise.all([
          supabase.rpc('rfl_team_leaderboard'),
          supabase.rpc('rfl_individual_leaderboard'),
        ]);

        // Teams: RPC already returns team_id, team_name, points, avg_rr
        if (!teamError) {
          const teamsRows = (t || []) as TeamRow[];
          const teamsSorted = [...teamsRows].sort((a,b)=> (b.points - a.points) || ((b.avg_rr||0) - (a.avg_rr||0)));
          setTeams(teamsSorted);
        } else {
          setTeams([]);
        }

        // Individuals: RPC returns user_id, points, avg_rr
        if (!playerError) {
          const rp = (p || []) as Array<{ user_id: string; points: number; avg_rr: number | null }>;
          const userIds = rp.map(r => r.user_id);

          const { data: users } = userIds.length ? await supabase
            .from('accounts')
            .select('id, first_name, team_id')
            .in('id', userIds) : { data: [] } as { data: Array<{ id: string; first_name: string; team_id: string | null }> };

          const teamIds = Array.from(new Set((users || []).map((u)=> String(u.team_id)).filter(Boolean)));
          const { data: teamsMeta } = teamIds.length ? await supabase
            .from('teams')
            .select('id, name')
            .in('id', teamIds) : { data: [] } as { data: Array<{ id: string; name: string }> };
          const teamNameById = new Map<string,string>();
          (teamsMeta || []).forEach((t)=> teamNameById.set(String(t.id), String(t.name)));

          const usersById = new Map((users || []).map((u)=> [String(u.id), u]));
          const playersAll: PlayerRow[] = rp.map(row => {
            const u = usersById.get(String(row.user_id));
            const teamName = u?.team_id ? (teamNameById.get(String(u.team_id)) || null) : null;
            return {
              user_id: String(row.user_id),
              name: String(u?.first_name || '—'),
              team: teamName,
              points: row.points,
              avg_rr: row.avg_rr,
            } as PlayerRow;
          }).sort((a,b)=> (b.points - a.points) || ((b.avg_rr||0) - (a.avg_rr||0)));

          const from = (page - 1) * pageSize;
          const to = from + pageSize;
          setPlayersTotal(playersAll.length);
          setPlayers(playersAll.slice(from, to));
        } else {
          setPlayersTotal(0);
          setPlayers([]);
        }
      };

      fetchLeaderboards();
    })();
  }, [page]);

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
            <CardDescription>Sorted by points, RR as tiebreaker</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teams.map((t, idx) => (
                <div key={t.team_id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rfl-navy text-white flex items-center justify-center font-semibold">{idx+1}</div>
                    <div className="font-medium text-rfl-navy">{t.team_name}</div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-rfl-coral">{t.points}</div>
                      <div className="text-gray-600">points</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-rfl-navy">{t.avg_rr ?? '-'}</div>
                      <div className="text-gray-600">RR</div>
                    </div>
                  </div>
                </div>
              ))}
              {!teams.length && <div className="text-gray-600">No data yet.</div>}
            </div>
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
                <div key={p.user_id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rfl-coral text-white flex items-center justify-center font-semibold">{idx+1 + (page-1)*pageSize}</div>
                    <div>
                      <div className="font-medium text-rfl-navy">{p.name}</div>
                      <div className="text-xs text-gray-600">{p.team ?? '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-rfl-coral">{p.points}</div>
                      <div className="text-gray-600">points</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-rfl-navy">{p.avg_rr ?? '-'}</div>
                      <div className="text-gray-600">RR</div>
                    </div>
                  </div>
                </div>
              ))}
              {!players.length && <div className="text-gray-600">No data yet.</div>}
            </div>
            {/* Pagination */}
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
