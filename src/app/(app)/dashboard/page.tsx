"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { supabase } from "@/lib/supabase";

type ActivityRow = {
  date: string;
  type: string | null;
  workout_type: string | null;
  duration: number | null;
  distance: number | null;
  steps: number | null;
  holes: number | null;
  status: "pending" | "approved" | "rejected" | null;
  rr_value: number | null;
  points: number | null;
};

const todayStr = () => new Date().toISOString().split("T")[0];

export default function DashboardPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [openWorkout, setOpenWorkout] = useState(false);
  const [openRest, setOpenRest] = useState(false);
  const [date, setDate] = useState<string>(todayStr());
  const [activity, setActivity] = useState("gym");
  const [duration, setDuration] = useState<number | "">(45);
  const [distance, setDistance] = useState<number | "">("");
  const [steps, setSteps] = useState<number | "">("");
  const [holes, setHoles] = useState<number | "">("");
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [restUsed, setRestUsed] = useState<number>(0);

  const canSubmitWorkout = useMemo(() => {
    if (!userId) return false;
    if (activity === "steps") return !!steps && Number(steps) > 0;
    if (activity === "golf") return !!holes && Number(holes) > 0;
    return !!duration && Number(duration) > 0;
  }, [userId, activity, duration, steps, holes]);

  async function fetchActivity() {
    if (!userId) return;
    const { data, error } = await supabase.rpc("rfl_activity_last_n_days", {
      p_user_id: userId,
      p_days: 7,
    });
    if (!error) setRows(data as ActivityRow[]);
  }

  useEffect(() => {
    fetchActivity();
    (async () => {
      if (!userId) return;
      const { count } = await supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'rest')
        .eq('status', 'approved');
      setRestUsed(count || 0);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function onSaveWorkout() {
    if (!userId || !canSubmitWorkout) return;
    if (date > todayStr()) {
      alert("Future dates are not allowed.");
      return;
    }

    const { data: hasExisting } = await supabase.rpc("rfl_has_entry_on_date", {
      p_user_id: userId,
      p_date: date,
    });
    if (hasExisting) {
      const ok = window.confirm("You already have a log for this day. Overwrite it?");
      if (!ok) return;
    }

    setLoading(true);
    try {
      await supabase.rpc("rfl_upsert_workout", {
        p_user_id: userId,
        p_date: date,
        p_workout_type: activity,
        p_team_id: null,
        p_duration: duration === "" ? null : Number(duration),
        p_distance: distance === "" ? null : (distance as number),
        p_steps: steps === "" ? null : Number(steps),
        p_holes: holes === "" ? null : Number(holes),
        p_proof_url: null,
        p_status: "approved",
      });
      setOpenWorkout(false);
      await fetchActivity();
    } finally {
      setLoading(false);
    }
  }

  async function onSaveRest() {
    if (!userId) return;
    if (date > todayStr()) { alert('Future dates are not allowed.'); return; }
    const { data: hasExisting } = await supabase.rpc('rfl_has_entry_on_date', { p_user_id: userId, p_date: date });
    if (hasExisting) { const ok = window.confirm('You already have a log for this day. Overwrite it?'); if (!ok) return; }
    setLoading(true);
    try {
      await supabase.rpc('rfl_upsert_rest_day', { p_user_id: userId, p_date: date, p_team_id: null, p_status: 'approved' });
      setOpenRest(false);
      await fetchActivity();
      const { count } = await supabase.from('entries').select('id', { count: 'exact', head: true })
        .eq('user_id', userId).eq('type','rest').eq('status','approved');
      setRestUsed(count || 0);
    } finally { setLoading(false); }
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-rfl-navy mb-2">Dashboard</h1>
        <p className="text-gray-600">Track your workouts and rest days.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-rfl-coral" /> Add Workout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Button className="bg-rfl-coral" onClick={() => { setDate(todayStr()); setOpenWorkout(true); }}>Log Workout</Button>
              <Button variant="outline" onClick={() => { setDate(todayStr()); setOpenRest(true); }}>Log Rest Day</Button>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <div>Points this week: <span className="font-semibold text-rfl-coral">{rows.reduce((a,r)=>a+(r.points||0),0)}</span></div>
              <div>Avg RR this week: <span className="font-semibold text-rfl-navy">{(() => { const rr = rows.map(r=>r.rr_value||0).filter(v=>v>0); return rr.length ? (Math.round((rr.reduce((a,b)=>a+b,0)/rr.length)*100)/100) : 0; })()}</span></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-rfl-light-blue" /> This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.date} className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="font-medium text-rfl-navy">{new Date(r.date).toDateString()}</div>
                    <div className="text-sm text-gray-600">
                      {r?.type ? (r.type === 'rest' ? 'Rest Day' : r.workout_type) : 'No entry'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-rfl-coral">{r.points ?? 0} pt</div>
                    {r?.status && (
                      <div className={`text-xs inline-block mt-1 px-2 py-0.5 rounded-full ${
                        r.status === 'approved' ? 'bg-green-100 text-green-800' :
                        r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>{r.status}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {openWorkout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-rfl-navy">Add Workout</h2>
              <button onClick={() => setOpenWorkout(false)} className="text-gray-500">✕</button>
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input value={date} onChange={(e)=>setDate(e.target.value)} type="date" max={todayStr()} className="w-full border rounded-md px-3 py-2" />
              <label className="block text-sm font-medium text-gray-700">Activity</label>
              <select value={activity} onChange={(e)=>setActivity(e.target.value)} className="w-full border rounded-md px-3 py-2">
                <option value="run">Run/Walk/Jog</option>
                <option value="gym">Gym</option>
                <option value="yoga">Yoga/Pilates/Zumba</option>
                <option value="cycling">Cycling</option>
                <option value="swimming">Swimming</option>
                <option value="racket">Racket Sports</option>
                <option value="steps">Steps</option>
                <option value="golf">Golf</option>
              </select>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duration (mins)</label>
                  <input value={duration ?? ''} onChange={(e)=>setDuration(e.target.value === '' ? '' : Number(e.target.value))} type="number" min={0} className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Distance (km)</label>
                  <input value={distance ?? ''} onChange={(e)=>setDistance(e.target.value === '' ? '' : Number(e.target.value))} type="number" min={0} className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Steps</label>
                  <input value={steps ?? ''} onChange={(e)=>setSteps(e.target.value === '' ? '' : Number(e.target.value))} type="number" min={0} className="w-full border rounded-md px-3 py-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Holes (golf)</label>
                  <input value={holes ?? ''} onChange={(e)=>setHoles(e.target.value === '' ? '' : Number(e.target.value))} type="number" min={0} className="w-full border rounded-md px-3 py-2" />
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpenWorkout(false)}>Cancel</Button>
              <Button disabled={!canSubmitWorkout || loading} className="bg-rfl-navy" onClick={onSaveWorkout}>{loading ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}

      {openRest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-rfl-navy">Add Rest Day</h2>
              <button onClick={() => setOpenRest(false)} className="text-gray-500">✕</button>
            </div>
            <div className="space-y-3">
              <div className="text-sm text-gray-700">Rest days remaining: <span className="font-semibold">{Math.max(0, 18 - restUsed)}</span> / 18</div>
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input value={date} onChange={(e)=>setDate(e.target.value)} type="date" max={todayStr()} className="w-full border rounded-md px-3 py-2" />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setOpenRest(false)}>Cancel</Button>
              <Button disabled={loading} className="bg-rfl-navy" onClick={onSaveRest}>{loading ? 'Saving…' : 'Save'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


