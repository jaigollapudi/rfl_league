"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

type MemberRow = {
  user_id: string;
  name: string;
  approved_points: number;
  avg_rr: number | null;
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

export default function TeamPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [teamId, setTeamId] = useState<string | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [pending, setPending] = useState<PendingEntry[]>([]);

  // discover the user's team
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const { data } = await supabase.from('accounts').select('team_id').eq('id', userId).maybeSingle();
      setTeamId(data?.team_id ?? null);
    })();
  }, [userId]);

  useEffect(() => {
    if (!teamId) return;
    (async () => {
      const { data } = await supabase.rpc('rfl_team_week_summary', { p_team_id: teamId });
      setMembers((data as MemberRow[]) || []);
      // Fetch ALL pending entries for the team (not just this week)
      const { data: pend } = await supabase
        .from('entries')
        .select('id,user_id,date,type,workout_type,duration,distance,steps,holes,rr_value,status,proof_url,accounts!inner(first_name)')
        .eq('team_id', teamId)
        .eq('status','pending')
        .order('date', { ascending: false });
      setPending((pend as PendingEntry[]) || []);
    })();
  }, [teamId]);

  const totals = useMemo(() => {
    const pts = members.reduce((a, m) => a + (m.approved_points || 0), 0);
    const rrVals = members.map(m => m.avg_rr).filter((v): v is number => !!v);
    const rr = rrVals.length ? (rrVals.reduce((a,b)=>a+b,0)/rrVals.length) : 0;
    return { pts, rr: Math.round(rr * 100) / 100 };
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
          <CardDescription>Sorted by points</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.user_id} className="flex items-center justify-between p-3 border rounded">
                <div className="font-medium text-rfl-navy">{m.name}</div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <div className="font-semibold text-rfl-coral">{m.approved_points}</div>
                    <div className="text-gray-600">points</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-rfl-navy">{m.avg_rr ?? '-'}</div>
                    <div className="text-gray-600">RR</div>
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
        <Card className="bg-white shadow-md mt-6">
          <CardHeader>
            <CardTitle className="text-xl text-rfl-navy">Pending approvals</CardTitle>
            <CardDescription>Approve or reject all pending entries</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pending.map((e) => (
                <div key={e.id} className="p-3 border rounded flex items-center justify-between">
                  <div>
                    <div className="font-medium text-rfl-navy">{e.accounts.first_name} — {formatLocalDateLabel(e.date)}</div>
                    <div className="text-sm text-gray-600">
                      {e.type === 'rest' ? 'Rest Day' : `${e.workout_type || ''}`}
                      {e.duration ? ` • ${e.duration}m` : ''}
                      {e.distance ? ` • ${e.distance}km` : ''}
                      {e.steps ? ` • ${e.steps} steps` : ''}
                      {e.holes ? ` • ${e.holes} holes` : ''}
                      {e.rr_value ? ` • RR ${e.rr_value}` : ''}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 rounded border text-green-700 border-green-300 hover:bg-green-50" onClick={async()=>{
                      await supabase.from('entries').update({ status: 'approved' }).eq('id', e.id);
                      setPending(p=>p.filter(x=>x.id!==e.id));
                    }}>Approve</button>
                    <button className="px-3 py-1 rounded border text-red-700 border-red-300 hover:bg-red-50" onClick={async()=>{
                      await supabase.from('entries').update({ status: 'rejected' }).eq('id', e.id);
                      setPending(p=>p.filter(x=>x.id!==e.id));
                    }}>Reject</button>
                  </div>
                </div>
              ))}
              {!pending.length && <div className="text-gray-600">No pending entries this week.</div>}
            </div>
            {pending.length > 0 && (
              <div className="mt-4">
                <button className="px-4 py-2 rounded bg-rfl-coral text-white" onClick={async()=>{
                  const ids = pending.map(p=>p.id);
                  await supabase.from('entries').update({ status: 'approved' }).in('id', ids);
                  setPending([]);
                }}>Approve all</button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
