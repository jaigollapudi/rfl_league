"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { getSupabase } from "@/lib/supabase";

type MemberRow = {
  user_id: string;
  name: string;
  approved_points: number;
  avg_rr: number | null;
  rest_used?: number;
  missed_days?: number;
};

type PendingEntry = {
  id: string;
  user_id: string;
  date: string;
  type: string;
  workout_type: string | null;
  duration: number | null;
  distance: number | null;
  steps: number | null;
  holes: number | null;
  rr_value: number | null;
  status: 'pending' | 'approved' | 'rejected';
  proof_url: string | null;
  accounts: { first_name: string };
};

function formatLocalDateLabel(yyyyMmDd: string): string {
  const [y, m, d] = yyyyMmDd.split('-').map(v => parseInt(v, 10));
  const dt = new Date(y, (m || 1) - 1, d || 1);
  return dt.toDateString();
}

function startOfWeekMondayLocal(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // 0 = Monday
  const copy = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  copy.setDate(copy.getDate() - day);
  copy.setHours(0,0,0,0);
  return copy;
}

function ymd(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function TeamPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [teamId, setTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [previewEntry, setPreviewEntry] = useState<PendingEntry | null>(null);

  // discover the user's team
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await getSupabase().from('accounts').select('team_id').eq('id', userId).maybeSingle();
      setTeamId(data?.team_id ?? null);
    })();
  }, [userId]);

  async function loadMembersSummary(currentTeamId: string) {
    // Fetch team members
    const { data: teamUsers } = await getSupabase()
      .from('accounts')
      .select('id, first_name')
      .eq('team_id', currentTeamId);
    const memberMap = new Map<string, MemberRow>();
    (teamUsers || []).forEach((u: { id: string; first_name: string }) => {
      memberMap.set(String(u.id), {
        user_id: String(u.id),
        name: String(u.first_name || ''),
        approved_points: 0,
        avg_rr: null,
        rest_used: 0,
        missed_days: 0,
      });
    });

    // Fetch ALL approved entries for team (no date filter)
    const { data: entries } = await getSupabase()
      .from('entries')
      .select('user_id, rr_value, type, date')
      .eq('team_id', currentTeamId)
      .eq('status', 'approved');

    const rrAgg = new Map<string, { sum: number; count: number }>();
    (entries || []).forEach((e: { user_id: string; rr_value: number | null; type: string }) => {
      const uid = String(e.user_id);
      const row = memberMap.get(uid);
      if (row) {
        const rrNum = typeof e.rr_value === 'number' ? e.rr_value : Number(e.rr_value || 0);
        const isRest = e.type === 'rest';
        row.approved_points += isRest ? (rrNum > 0 ? 1 : 0) : 1;
        if (isRest) row.rest_used = (row.rest_used || 0) + 1;
        if (rrNum > 0) {
          const agg = rrAgg.get(uid) || { sum: 0, count: 0 };
          agg.sum += rrNum;
          agg.count += 1;
          rrAgg.set(uid, agg);
        }
      }
    });

    // finalize avg rr
    rrAgg.forEach((agg, uid) => {
      const row = memberMap.get(uid);
      if (row) {
        row.avg_rr = Math.round((agg.sum / Math.max(1, agg.count)) * 100) / 100;
      }
    });

    // Missed days since season start for each member
    const seasonStart = new Date(Date.UTC(new Date().getUTCFullYear(), 8, 1));
    const today = new Date();
    const datesByUser = new Map<string, Set<string>>();
    (entries || []).forEach((e: any) => {
      const ds = String(e.date);
      const uid = String(e.user_id);
      const set = datesByUser.get(uid) || new Set<string>();
      set.add(ds);
      datesByUser.set(uid, set);
    });
    memberMap.forEach((row, uid) => {
      let missed = 0;
      let cur = new Date(seasonStart);
      const set = datesByUser.get(uid) || new Set<string>();
      while (cur <= today) {
        const ds = new Date(cur).toISOString().split('T')[0];
        if (!set.has(ds)) missed += 1;
        cur = new Date(cur.getTime() + 24 * 3600 * 1000);
      }
      row.missed_days = missed;
    });

    const sortedMembers = Array.from(memberMap.values()).sort((a,b)=> (b.approved_points||0)-(a.approved_points||0) || ((b.avg_rr||0)-(a.avg_rr||0)) );
    setMembers(sortedMembers);
  }

  async function loadPending(currentTeamId: string, pageNum: number) {
    const from = (pageNum - 1) * pageSize;
    const to = from + pageSize - 1;
    // total count
    const { count } = await getSupabase()
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', currentTeamId)
      .eq('status', 'pending');
    setPendingCount(count || 0);

    // page data
    const { data: pend } = await getSupabase()
      .from('entries')
      .select('id,user_id,date,type,workout_type,duration,distance,steps,holes,rr_value,status,proof_url,accounts!inner(first_name)')
      .eq('team_id', currentTeamId)
      .eq('status','pending')
      .order('date', { ascending: false })
      .range(from, to);
    const normalized = (pend || []).map((e: any) => ({
      ...e,
      accounts: Array.isArray(e.accounts) ? (e.accounts[0] || { first_name: '' }) : e.accounts,
    })) as PendingEntry[];
    setPending(normalized || []);
  }

  useEffect(() => {
    if (!teamId) return;
    (async () => {
      await loadMembersSummary(teamId);
      await loadPending(teamId, page);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, page]);

  const totals = useMemo(() => {
    const pts = members.reduce((a, m) => a + (m.approved_points || 0), 0);
    const rrVals = members.map(m => m.avg_rr).filter((v): v is number => typeof v === 'number');
    const rr = rrVals.length ? (rrVals.reduce((a,b)=>a+b,0)/rrVals.length) : 0;
    return { pts, rr: Number((Math.round(rr * 100) / 100).toFixed(2)) };
  }, [members]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-rfl-navy mb-2">Team</h1>
        <p className="text-gray-600">This week&apos;s approved points and average RR.</p>
      </div>

      <Card className="bg-white shadow-md mb-6">
        <CardHeader>
          <CardTitle className="text-xl text-rfl-navy">Team Summary</CardTitle>
          <CardDescription>Points from approved entries only</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-8">
            <div>
              <div className="text-sm text-gray-600">Total Points</div>
              <div className="text-2xl font-bold text-rfl-coral">{totals.pts}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg RR</div>
              <div className="text-2xl font-bold text-rfl-navy">{totals.rr}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-rfl-navy">Members</CardTitle>
          <CardDescription>Sorted by points & RR</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((m, idx) => (
              <div key={m.user_id} className="p-3 border rounded">
                <div className="flex sm:flex-row flex-col sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rfl-navy text-white flex items-center justify-center font-semibold">{idx+1}</div>
                    <div className="font-medium text-rfl-navy">{m.name}</div>
                  </div>
                  <div className="grid grid-cols-4 sm:gap-6 gap-3 text-xs sm:text-sm w-full sm:w-auto">
                    <div className="text-center whitespace-nowrap">
                      <div className="font-semibold text-rfl-coral">{m.approved_points ?? 0}</div>
                      <div className="text-gray-600">Points</div>
                    </div>
                    <div className="text-center whitespace-nowrap">
                      <div className="font-semibold text-rfl-navy">{typeof m.avg_rr === 'number' ? m.avg_rr : '-'}</div>
                      <div className="text-gray-600">RR</div>
                    </div>
                    <div className="text-center whitespace-nowrap">
                      <div className="font-semibold text-rfl-coral">{m.rest_used ?? 0}</div>
                      <div className="text-gray-600">Rest</div>
                    </div>
                    <div className="text-center whitespace-nowrap">
                      <div className="font-semibold text-rfl-navy">{m.missed_days ?? 0}</div>
                      <div className="text-gray-600">Missed</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!members.length && <div className="text-gray-600">No data yet.</div>}
          </div>
        </CardContent>
      </Card>

      {/* Leader approvals */}
      {session?.user?.role === 'leader' && (
        <>
          <Card className="bg-white shadow-md mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl text-rfl-navy">Pending approvals</CardTitle>
                  <CardDescription>Approve or reject all pending entries</CardDescription>
                </div>
                <div className="px-3 py-1 text-xs font-semibold rounded-full border bg-white whitespace-nowrap">Pending: {pendingCount}</div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pending.map((e) => (
                  <div key={e.id} className="p-3 border rounded">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-rfl-navy truncate">{e.accounts.first_name} — {formatLocalDateLabel(e.date)}</div>
                        <div className="text-sm text-gray-600">
                          {e.type === 'rest' ? 'Rest Day' : `${e.workout_type || ''}`}
                          {e.duration ? ` • ${e.duration}m` : ''}
                          {e.distance ? ` • ${e.distance}km` : ''}
                          {e.steps ? ` • ${e.steps} steps` : ''}
                          {e.holes ? ` • ${e.holes} holes` : ''}
                          {typeof e.rr_value === 'number' ? ` • RR ${Number(e.rr_value).toFixed(2)}` : ''}
                        </div>
                      </div>
                      {/* Desktop action group */}
                      <div className="hidden sm:flex shrink-0 gap-2">
                        {e.proof_url && (
                          <button className="px-3 py-1 rounded border text-blue-700 border-blue-300 hover:bg-blue-50" onClick={()=> setPreviewEntry(e)}>View</button>
                        )}
                        <button className="px-3 py-1 rounded border text-green-700 border-green-300 hover:bg-green-50" onClick={async()=>{
                          await getSupabase().from('entries').update({ status: 'approved' }).eq('id', e.id);
                          setPending(p=>p.filter(x=>x.id!==e.id));
                          if (teamId) { await loadMembersSummary(teamId); await loadPending(teamId, page); }
                        }}>Approve</button>
                        <button className="px-3 py-1 rounded border text-red-700 border-red-300 hover:bg-red-50" onClick={async()=>{
                          await getSupabase().from('entries').update({ status: 'rejected' }).eq('id', e.id);
                          setPending(p=>p.filter(x=>x.id!==e.id));
                          if (teamId) { await loadMembersSummary(teamId); await loadPending(teamId, page); }
                        }}>Reject</button>
                      </div>
                    </div>
                    {/* Mobile action row */}
                    <div className="mt-2 flex sm:hidden gap-2">
                      {e.proof_url && (
                        <button className="flex-1 py-2 rounded border text-blue-700 border-blue-300 hover:bg-blue-50" onClick={()=> setPreviewEntry(e)}>View</button>
                      )}
                      <button className="flex-1 py-2 rounded border text-green-700 border-green-300 hover:bg-green-50" onClick={async()=>{
                        await getSupabase().from('entries').update({ status: 'approved' }).eq('id', e.id);
                        setPending(p=>p.filter(x=>x.id!==e.id));
                        if (teamId) { await loadMembersSummary(teamId); await loadPending(teamId, page); }
                      }}>Approve</button>
                      <button className="flex-1 py-2 rounded border text-red-700 border-red-300 hover:bg-red-50" onClick={async()=>{
                        await getSupabase().from('entries').update({ status: 'rejected' }).eq('id', e.id);
                        setPending(p=>p.filter(x=>x.id!==e.id));
                        if (teamId) { await loadMembersSummary(teamId); await loadPending(teamId, page); }
                      }}>Reject</button>
                    </div>
                  </div>
                ))}
                {!pending.length && <div className="text-gray-600">No pending entries.</div>}
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  className={`p-1 rounded border ${page > 1 ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={async()=>{ if (page > 1) setPage(page-1); }}
                  aria-label="Previous page"
                >
                  ‹
                </button>
                <div className="px-3 py-1 rounded bg-gray-100 text-sm font-medium text-gray-800">Page {page}</div>
                <button
                  className={`p-1 rounded border ${page * pageSize < pendingCount ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={async()=>{ if (page * pageSize < pendingCount) setPage(page+1); }}
                  aria-label="Next page"
                >
                  ›
                </button>
              </div>
            </CardContent>
          </Card>

        {/* Proof preview modal */}
        {previewEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={()=> setPreviewEntry(null)}>
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-[90%] p-3" onClick={(e)=> e.stopPropagation()}>
              <div className="flex justify-end mb-2">
                <button className="text-gray-500 hover:text-gray-700" onClick={()=> setPreviewEntry(null)}>✕</button>
              </div>
              {previewEntry.proof_url ? (
                <div className="w-full flex justify-center">
                  <img src={previewEntry.proof_url} alt="Proof" className="max-h-[60vh] object-contain" />
                </div>
              ) : null}
              {/* Workout details */}
              <div className="mt-3 text-sm text-gray-800">
                <div className="font-semibold text-rfl-navy mb-1">Log details</div>
                <div className="space-y-1">
                  <div>Type: {previewEntry.type === 'rest' ? 'Rest Day' : (previewEntry.workout_type || '—')}</div>
                  {previewEntry.duration ? <div>Duration: {previewEntry.duration} min</div> : null}
                  {previewEntry.distance ? <div>Distance: {previewEntry.distance} km</div> : null}
                  {previewEntry.steps ? <div>Steps: {previewEntry.steps}</div> : null}
                  {previewEntry.holes ? <div>Holes: {previewEntry.holes}</div> : null}
                  {typeof previewEntry.rr_value === 'number' ? <div>RR: {Number(previewEntry.rr_value).toFixed(2)}</div> : null}
                </div>
              </div>
            </div>
          </div>
        )}

          {pendingCount > 0 && (
            <div className="mt-4">
              <button className="px-4 py-2 rounded bg-rfl-coral text-white" onClick={async()=>{
                if (!teamId) return;
                // Approve ALL pending for the team (not just the page)
                const { data: allIds } = await getSupabase()
                  .from('entries')
                  .select('id')
                  .eq('team_id', teamId)
                  .eq('status','pending');
                const ids = (allIds || []).map((x:any)=>x.id);
                if (ids.length) {
                  await getSupabase().from('entries').update({ status: 'approved' }).in('id', ids);
                }
                await loadMembersSummary(teamId);
                await loadPending(teamId, page);
              }}>Approve all</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
