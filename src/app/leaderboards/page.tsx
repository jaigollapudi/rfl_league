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
      // Aggregate all-time approved entries
      const { data: teamAgg } = await supabase
        .from('entries')
        .select('team_id, rr_value, teams(name)', { count: 'exact' })
        .eq('status', 'approved');

      const teamMap = new Map<string, { name: string; points: number; rrSum: number; rrCount: number }>();
      (teamAgg || []).forEach((e: any) => {
        const tid = String(e.team_id);
        const name = e.teams?.name || '—';
        const rec = teamMap.get(tid) || { name, points: 0, rrSum: 0, rrCount: 0 };
        rec.points += 1;
        if (typeof e.rr_value === 'number' && e.rr_value > 0) { rec.rrSum += e.rr_value; rec.rrCount += 1; }
        teamMap.set(tid, rec);
      });
      const teamsSorted: TeamRow[] = Array.from(teamMap.entries()).map(([team_id, r]) => ({ team_id, team_name: r.name, points: r.points, avg_rr: r.rrCount ? Math.round((r.rrSum/r.rrCount)*100)/100 : null }))
        .sort((a,b)=> b.points - a.points || (b.avg_rr||0) - (a.avg_rr||0));
      setTeams(teamsSorted);

      // Individuals aggregation (two-step to avoid cross-table join issues)
      const { data: playerEntries } = await supabase
        .from('entries')
        .select('user_id, rr_value')
        .eq('status','approved');

      const aggMap = new Map<string, { points: number; rrSum: number; rrCount: number }>();
      (playerEntries || []).forEach((e: any) => {
        const uid = String(e.user_id);
        const rec = aggMap.get(uid) || { points: 0, rrSum: 0, rrCount: 0 };
        rec.points += 1;
        if (typeof e.rr_value === 'number' && e.rr_value > 0) { rec.rrSum += e.rr_value; rec.rrCount += 1; }
        aggMap.set(uid, rec);
      });

      const userIds = Array.from(aggMap.keys());
      let usersMeta: Record<string, { name: string; team: string | null }> = {};
      if (userIds.length) {
        const { data: users } = await supabase
          .from('accounts')
          .select('id, first_name, teams(name)')
          .in('id', userIds);
        (users || []).forEach((u: any) => {
          usersMeta[String(u.id)] = { name: u.first_name || '—', team: u.teams?.name || null };
        });
      }

      const playersAll: PlayerRow[] = userIds.map((uid) => {
        const a = aggMap.get(uid)!;
        const meta = usersMeta[uid] || { name: '—', team: null };
        return {
          user_id: uid,
          name: meta.name,
          team: meta.team,
          points: a.points,
          avg_rr: a.rrCount ? Math.round((a.rrSum / a.rrCount) * 100) / 100 : null,
        };
      }).sort((a,b)=> b.points - a.points || (b.avg_rr||0) - (a.avg_rr||0));

      const from = (page - 1) * pageSize;
      const to = from + pageSize;
      setPlayersTotal(playersAll.length);
      setPlayers(playersAll.slice(from, to));
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
                    <div className="w-8 h-8 rounded-full bg-rfl-coral text-white flex items-center justify-center font-semibold">{idx+1}</div>
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
