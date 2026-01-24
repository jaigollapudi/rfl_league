"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { getSupabase } from "@/lib/supabase";
import { getTeamSummary, getTeamMembers, type StaticTeamSummary, type StaticMemberData } from "@/lib/static-team-data";

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

function ymd(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function TeamPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role as 'player' | 'leader' | 'governor' | undefined;

  useEffect(() => {
    if (role === 'governor') {
      router.replace('/governor');
    }
  }, [role, router]);

  const userId = session?.user?.id;
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamSummary, setTeamSummary] = useState<StaticTeamSummary | null>(null);
  const [members, setMembers] = useState<StaticMemberData[]>([]);
  const [pending, setPending] = useState<PendingEntry[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const pageSize = 10;
  const [previewEntry, setPreviewEntry] = useState<PendingEntry | null>(null);

  // Discover the user's team
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await getSupabase().from('accounts').select('team_id').eq('id', userId).maybeSingle();
      setTeamId(data?.team_id ?? null);
    })();
  }, [userId]);

  // Load static data when teamId is available
  useEffect(() => {
    if (!teamId) return;
    
    // Load static team summary
    const summary = getTeamSummary(teamId);
    setTeamSummary(summary || null);
    
    // Load static members
    const teamMembers = getTeamMembers(teamId);
    setMembers(teamMembers);
  }, [teamId]);

  // Load pending entries for leaders (still dynamic)
  async function loadPending(currentTeamId: string, pageNum: number) {
    const from = (pageNum - 1) * pageSize;
    const to = from + pageSize - 1;
    // Only show entries from today and yesterday
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    const startStr = ymd(yesterday);
    const endStr = ymd(today);
    
    // Total count
    const { count } = await getSupabase()
      .from('entries')
      .select('id', { count: 'exact', head: true })
      .eq('team_id', currentTeamId)
      .eq('status', 'approved')
      .gte('date', startStr)
      .lte('date', endStr);
    setPendingCount(count || 0);

    // Page data
    const { data: pend } = await getSupabase()
      .from('entries')
      .select('id,user_id,date,type,workout_type,duration,distance,steps,holes,rr_value,status,proof_url,accounts!inner(first_name)')
      .eq('team_id', currentTeamId)
      .eq('status','approved')
      .gte('date', startStr)
      .lte('date', endStr)
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
    loadPending(teamId, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, page]);

  // Calculate totals from static data
  const totals = useMemo(() => {
    if (teamSummary) {
      return {
        pts: Math.ceil(teamSummary.scaled_team_points), // Use scaled points, rounded up
        rr: teamSummary.team_avg_rr,
        missed: teamSummary.total_missed_days,
        rest: teamSummary.total_rest_days,
      };
    }
    return { pts: 0, rr: 0, missed: 0, rest: 0 };
  }, [teamSummary]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-rfl-navy mb-2">Team Dashboard</h1>
          <p className="text-gray-600">Your team's progress and participation — all in one view.</p>
        </div>

      <Card className="bg-white shadow-md mb-6">
        <CardHeader>
          <CardTitle className="text-xl text-rfl-navy">Team Summary</CardTitle>
          <CardDescription>{teamSummary?.team_name || 'Loading...'} • Season Total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-rfl-peach/50 rounded">
              <div className="text-xs text-gray-600">Points</div>
              <div className="text-lg font-bold text-rfl-coral">{totals.pts}</div>
            </div>
            <div className="p-3 bg-rfl-peach/50 rounded">
              <div className="text-xs text-gray-600">Avg RR</div>
              <div className="text-lg font-bold text-rfl-navy">{totals.rr}</div>
            </div>
            <div className="p-3 bg-rfl-peach/50 rounded">
              <div className="text-xs text-gray-600">Days Missed</div>
              <div className="text-lg font-bold text-rfl-navy">{totals.missed}</div>
            </div>
            <div className="p-3 bg-rfl-peach/50 rounded">
              <div className="text-xs text-gray-600">Rest Days Used</div>
              <div className="text-lg font-bold text-rfl-navy">{totals.rest}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl text-rfl-navy">Members</CardTitle>
              <CardDescription>Season Total • Sorted by points & RR</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((m, idx) => (
              <div key={m.user_id} className="p-3 border rounded">
                <div className="flex sm:flex-row flex-col sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rfl-navy text-white flex items-center justify-center font-semibold">{idx+1}</div>
                    <div className="font-medium text-rfl-navy">{m.full_name.split(' ')[0]}</div>
                  </div>
                  <div className="grid grid-cols-4 sm:gap-6 gap-3 text-xs sm:text-sm w-full sm:w-auto">
                    <div className="text-center whitespace-nowrap">
                      <div className="font-semibold text-rfl-coral">{m.total_points}</div>
                      <div className="text-gray-600">Points</div>
                    </div>
                    <div className="text-center whitespace-nowrap">
                      <div className="font-semibold text-rfl-coral">{m.total_rest_days}</div>
                      <div className="text-gray-600">Rest</div>
                    </div>
                    <div className="text-center whitespace-nowrap">
                      <div className="font-semibold text-rfl-navy">{m.total_missed_days}</div>
                      <div className="text-gray-600">Missed</div>
                    </div>
                    <div className="text-center whitespace-nowrap">
                      <div className="font-semibold text-rfl-navy">{m.avg_rr}</div>
                      <div className="text-gray-600">RR</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {!members.length && <div className="text-gray-600">No data yet.</div>}
          </div>
        </CardContent>
      </Card>

      {/* Leader approvals - still dynamic */}
      {session?.user?.role === 'leader' && (
        <>
          <Card className="bg-white shadow-md mt-6">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl text-rfl-navy">Submitted Entries</CardTitle>
                  <CardDescription>View and manage submitted entries</CardDescription>
                </div>
                <div className="px-3 py-1 text-xs font-semibold rounded-full border bg-white whitespace-nowrap">Submitted: {pendingCount}</div>
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
                        <button className="px-3 py-1 rounded border text-blue-700 border-blue-300 hover:bg-blue-50" onClick={()=> setPreviewEntry(e)}>View</button>
                        <button className="px-3 py-1 rounded border text-red-700 border-red-300 hover:bg-red-50" onClick={async()=>{
                          const confirmed = window.confirm(`Are you sure you want to reject ${e.accounts.first_name}'s entry? This action cannot be undone. Please inform the player to correct and resubmit.`);
                          if (!confirmed) return;
                          await getSupabase().from('entries').update({ status: 'rejected' }).eq('id', e.id);
                          setPending(p=>p.filter(x=>x.id!==e.id));
                          if (teamId) { await loadPending(teamId, page); }
                        }}>Don't Accept</button>
                      </div>
                    </div>
                    {/* Mobile action row */}
                    <div className="mt-2 flex sm:hidden gap-2">
                      <button className="flex-1 py-2 rounded border text-blue-700 border-blue-300 hover:bg-blue-50" onClick={()=> setPreviewEntry(e)}>View</button>
                      <button className="flex-1 py-2 rounded border text-red-700 border-red-300 hover:bg-red-50" onClick={async()=>{
                        const confirmed = window.confirm(`Are you sure you want to reject ${e.accounts.first_name}'s entry? This action cannot be undone. Please inform the player to correct and resubmit.`);
                        if (!confirmed) return;
                        await getSupabase().from('entries').update({ status: 'rejected' }).eq('id', e.id);
                        setPending(p=>p.filter(x=>x.id!==e.id));
                        if (teamId) { await loadPending(teamId, page); }
                      }}>Don't Accept</button>
                    </div>
                  </div>
                ))}
                {!pending.length && <div className="text-gray-600">No submitted entries.</div>}
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
              ) : (
                <div className="w-full flex justify-center py-8">
                  <div className="text-gray-500">No proof image available</div>
                </div>
              )}
              {/* Workout details */}
              <div className="mt-6 text-sm text-gray-800">
                <div className="font-semibold text-rfl-navy mb-1">Workout Details</div>
                <div className="space-y-1">
                  <div><b>Type:</b> {previewEntry.type === 'rest' ? 'Rest Day' : (previewEntry.workout_type || '—')}</div>
                  {previewEntry.duration ? <div><b>Duration:</b> {previewEntry.duration} min</div> : null}
                  {previewEntry.distance ? <div>Distance: {previewEntry.distance} km</div> : null}
                  {previewEntry.steps ? <div><b>Steps:</b> {previewEntry.steps}</div> : null}
                  {previewEntry.holes ? <div><b>Holes:</b> {previewEntry.holes}</div> : null}
                  {typeof previewEntry.rr_value === 'number' ? <div><b>RR:</b> {Number(previewEntry.rr_value).toFixed(2)}</div> : null}
                </div>
              </div>
            </div>
          </div>
        )}

        </>
      )}
      </div>
    </div>
  )
}
