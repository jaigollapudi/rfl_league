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

type ActivityConfig = {
  name: string;
  fields: Array<'duration' | 'distance' | 'steps' | 'holes'>;
  rules: string[];
  minDuration?: number;
  minDistance?: number;
  minSteps?: number;
  minHoles?: number;
};

const ACTIVITY_CONFIGS: Record<string, ActivityConfig> = {
  run: {
    name: "Brisk Walk/Jog/Run",
    fields: ['duration', 'distance'],
    rules: ["4 kms OR 45 mins minimum"],
    minDistance: 4,
    minDuration: 45,
  },
  gym: {
    name: "Weightlifting / Gym Workout",
    fields: ['duration'],
    rules: ["45 mins minimum"],
    minDuration: 45,
  },
  yoga: {
    name: "Yoga/Pilates/Zumba",
    fields: ['duration'],
    rules: ["45 mins minimum"],
    minDuration: 45,
  },
  cycling: {
    name: "Cycling",
    fields: ['duration', 'distance'],
    rules: ["10 kms OR 45 mins minimum"],
    minDistance: 10,
    minDuration: 45,
  },
  swimming: {
    name: "Swimming",
    fields: ['duration'],
    rules: ["45 mins minimum"],
    minDuration: 45,
  },
  racket: {
    name: "Racket Sports",
    fields: ['duration'],
    rules: ["45 mins minimum"],
    minDuration: 45,
  },
  steps: {
    name: "Steps",
    fields: ['steps'],
    rules: ["10,000 steps minimum"],
    minSteps: 10000,
  },
  golf: {
    name: "Golf",
    fields: ['holes', 'steps'],
    rules: ["9 holes (8000+ steps)"],
    minHoles: 9,
    minSteps: 8000,
  },
};

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
  const [validationError, setValidationError] = useState<string>("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string>("");
  const [teamPoints, setTeamPoints] = useState<number | null>(null);
  const [teamAvgRR, setTeamAvgRR] = useState<number | null>(null);
  const [teamPosition, setTeamPosition] = useState<number | null>(null);

  const currentConfig = ACTIVITY_CONFIGS[activity];

  const validateWorkout = useMemo(() => {
    if (!userId) return { valid: false, error: "" };
    const config = ACTIVITY_CONFIGS[activity];

    if (activity === "steps") {
      if (!steps || Number(steps) < (config.minSteps || 0)) {
        return { valid: false, error: `Minimum ${config.minSteps?.toLocaleString()} steps required` };
      }
      return { valid: true, error: "" };
    }

    if (activity === "golf") {
      const holesValid = holes && Number(holes) >= (config.minHoles || 0);
      const stepsValid = steps && Number(steps) >= (config.minSteps || 0);
      if (!holesValid && !stepsValid) {
        return { valid: false, error: `Minimum ${config.minHoles} holes OR ${config.minSteps?.toLocaleString()} steps required` };
      }
      return { valid: true, error: "" };
    }

    const durationValid = duration && Number(duration) >= (config.minDuration || 0);
    const distanceValid = distance && Number(distance) >= (config.minDistance || 0);

    if (config.fields.includes('distance') && config.minDistance) {
      if (!durationValid && !distanceValid) {
        return { valid: false, error: `Minimum ${config.minDuration} mins OR ${config.minDistance} kms required` };
      }
    } else {
      if (!durationValid) {
        return { valid: false, error: `Minimum ${config.minDuration} mins required` };
      }
    }

    return { valid: true, error: "" };
  }, [userId, activity, duration, distance, steps, holes]);

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
      // Fetch user's team id and name
      const { data: acct } = await supabase
        .from('accounts')
        .select('team_id, teams(name)')
        .eq('id', userId)
        .maybeSingle();
      const tId = (acct as unknown as { team_id?: string } | null)?.team_id || null;
      const tName = ((acct as unknown as { teams?: { name?: string } } | null)?.teams?.name) || "";
      setTeamId(tId);
      setTeamName(tName || "");

      // Fetch rest day count
      const { count } = await supabase
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'rest')
        .eq('status', 'approved');
      setRestUsed(count || 0);

      // Fetch leaderboard to compute team summary and position
      const { data: leaderboard } = await supabase.rpc('rfl_team_leaderboard');
      const rowsAny = (leaderboard as unknown as Array<Record<string, unknown>>) || [];
      // Try to derive rank by points desc, rr desc if not present
      const getNum = (v: unknown): number => (typeof v === 'number' ? v : Number(v) || 0);
      const findKey = (obj: Record<string, unknown>, keys: string[]): string | null => {
        for (const k of keys) if (k in obj) return k; return null;
      };
      const idKey = rowsAny[0] ? (findKey(rowsAny[0], ['team_id','id','teamid']) || 'team_id') : 'team_id';
      const nameKey = rowsAny[0] ? (findKey(rowsAny[0], ['team_name','name']) || 'team_name') : 'team_name';
      const ptsKey = rowsAny[0] ? (findKey(rowsAny[0], ['points','total_points','sum_points']) || 'points') : 'points';
      const rrKey = rowsAny[0] ? (findKey(rowsAny[0], ['avg_rr','average_rr','rr']) || 'avg_rr') : 'avg_rr';

      const sorted = [...rowsAny].sort((a,b)=>{
        const dp = getNum(b[ptsKey]) - getNum(a[ptsKey]);
        if (dp !== 0) return dp;
        return getNum(b[rrKey]) - getNum(a[rrKey]);
      });
      let pos: number | null = null;
      let pts: number | null = null;
      let rr: number | null = null;
      if (tId) {
        const idx = sorted.findIndex(r => String(r[idKey]) === String(tId));
        if (idx >= 0) {
          pos = idx + 1;
          pts = getNum(sorted[idx][ptsKey]);
          rr = getNum(sorted[idx][rrKey]);
        }
      } else if (tName) {
        const idx = sorted.findIndex(r => String(r[nameKey]) === String(tName));
        if (idx >= 0) {
          pos = idx + 1;
          pts = getNum(sorted[idx][ptsKey]);
          rr = getNum(sorted[idx][rrKey]);
        }
      }
      if (pts !== null) setTeamPoints(pts);
      if (rr !== null) setTeamAvgRR(Math.round((rr as number) * 100) / 100);
      if (pos !== null) setTeamPosition(pos);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    setDuration(currentConfig.minDuration || "");
    setDistance("");
    setSteps("");
    setHoles("");
    setValidationError("");
  }, [activity, currentConfig.minDuration]);

  async function onSaveWorkout() {
    if (!userId) return;
    if (!validateWorkout.valid) {
      setValidationError(validateWorkout.error);
      return;
    }
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
      setValidationError("");
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
            <CardTitle className="flex items-center gap-2"><Plus className="w-5 h-5 text-rfl-coral" /> Add Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 divide-x divide-gray-200">
              <div className="pr-4 flex flex-col items-center">
                <Button className="bg-rfl-coral hover:bg-rfl-coral/90 mb-4" onClick={() => { setDate(todayStr()); setOpenWorkout(true); }}>Log Workout</Button>
                <div className="text-xs text-gray-600 space-y-1.5 w-full">
                  <div className="font-semibold text-rfl-navy mb-2">Approved Workouts:</div>
                  <div>• Walk/Jog/Run: 4 km OR 45 min</div>
                  <div>• Gym: 45 min</div>
                  <div>• Yoga/Pilates/Zumba: 45 min</div>
                  <div>• Cycling: 10 km OR 45 min</div>
                  <div>• Swimming: 45 min</div>
                  <div>• Steps: 10,000 steps</div>
                  <div>• Golf: 9 holes (8000+ steps)</div>
                </div>
              </div>
              <div className="pl-4 flex flex-col items-center justify-start">
                <Button variant="outline" className="border-rfl-navy text-rfl-navy hover:bg-rfl-navy/10 mb-4" onClick={() => { setDate(todayStr()); setOpenRest(true); }}>Log Rest Day</Button>
                <div className="text-center space-y-3 w-full">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Rest Days Remaining</div>
                    <div className="text-2xl font-bold text-rfl-navy">{Math.max(0, 18 - restUsed)} / 18</div>
                  </div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="font-semibold text-rfl-navy">This Week:</div>
                    <div>Points: <span className="font-semibold text-rfl-coral">{rows.reduce((a,r)=>a+(r.points||0),0)}</span></div>
                    <div>Avg RR: <span className="font-semibold text-rfl-navy">{(() => { const rr = rows.map(r=>r.rr_value||0).filter(v=>v>0); return rr.length ? (Math.round((rr.reduce((a,b)=>a+b,0)/rr.length)*100)/100) : 0; })()}</span></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Team Summary full-width beneath the two halves */}
            <div className="mt-6">
              <div className="rounded-lg border bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-rfl-navy">Team Summary {teamName ? `— ${teamName}` : ''}</div>
                  {teamPosition ? (
                    <div className="text-xs px-2 py-0.5 rounded-full bg-rfl-coral text-white">Position #{teamPosition}</div>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-rfl-peach/50 rounded">
                    <div className="text-xs text-gray-600">Points (week)</div>
                    <div className="text-lg font-bold text-rfl-coral">{teamPoints ?? '—'}</div>
                  </div>
                  <div className="p-3 bg-rfl-peach/50 rounded">
                    <div className="text-xs text-gray-600">Avg RR</div>
                    <div className="text-lg font-bold text-rfl-navy">{teamAvgRR ?? '—'}</div>
                  </div>
                  <div className="p-3 bg-rfl-peach/50 rounded">
                    <div className="text-xs text-gray-600">Your week points</div>
                    <div className="text-lg font-bold text-rfl-navy">{rows.reduce((a,r)=>a+(r.points||0),0)}</div>
                  </div>
                </div>
              </div>
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
              <button onClick={() => { setOpenWorkout(false); setValidationError(""); }} className="text-gray-500">✕</button>
            </div>
            {validationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{validationError}</div>
            )}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Date</label>
              <input value={date} onChange={(e)=>setDate(e.target.value)} type="date" max={todayStr()} className="w-full border rounded-md px-3 py-2" />
              <label className="block text-sm font-medium text-gray-700">Activity</label>
              <select value={activity} onChange={(e)=>setActivity(e.target.value)} className="w-full border rounded-md px-3 py-2">
                <option value="run">Brisk Walk/Jog/Run</option>
                <option value="gym">Weightlifting / Gym Workout</option>
                <option value="yoga">Yoga/Pilates/Zumba</option>
                <option value="cycling">Cycling</option>
                <option value="swimming">Swimming</option>
                <option value="racket">Racket Sports</option>
                <option value="steps">Steps</option>
                <option value="golf">Golf</option>
              </select>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-gray-700">
                <div className="font-medium text-rfl-navy mb-1">Requirements:</div>
                {currentConfig.rules.map((rule, idx) => (<div key={idx}>• {rule}</div>))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {currentConfig.fields.includes('duration') && (
                  <div className={currentConfig.fields.length === 1 ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700">Duration (mins){currentConfig.minDuration ? ` — min ${currentConfig.minDuration}` : ''}</label>
                    <input value={duration ?? ''} onChange={(e)=>{ setDuration(e.target.value === '' ? '' : Number(e.target.value)); setValidationError(""); }} type="number" min={0} className="w-full border rounded-md px-3 py-2" />
                  </div>
                )}
                {currentConfig.fields.includes('distance') && (
                  <div className={currentConfig.fields.length === 1 ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700">Distance (km){currentConfig.minDistance ? ` — min ${currentConfig.minDistance}` : ''}</label>
                    <input value={distance ?? ''} onChange={(e)=>{ setDistance(e.target.value === '' ? '' : Number(e.target.value)); setValidationError(""); }} type="number" min={0} step="0.1" className="w-full border rounded-md px-3 py-2" />
                  </div>
                )}
                {currentConfig.fields.includes('steps') && (
                  <div className={currentConfig.fields.length === 1 ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700">Steps{currentConfig.minSteps ? ` — min ${currentConfig.minSteps.toLocaleString()}` : ''}</label>
                    <input value={steps ?? ''} onChange={(e)=>{ setSteps(e.target.value === '' ? '' : Number(e.target.value)); setValidationError(""); }} type="number" min={0} className="w-full border rounded-md px-3 py-2" />
                  </div>
                )}
                {currentConfig.fields.includes('holes') && (
                  <div className={currentConfig.fields.length === 1 ? 'col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700">Holes (golf){currentConfig.minHoles ? ` — min ${currentConfig.minHoles}` : ''}</label>
                    <input value={holes ?? ''} onChange={(e)=>{ setHoles(e.target.value === '' ? '' : Number(e.target.value)); setValidationError(""); }} type="number" min={0} className="w-full border rounded-md px-3 py-2" />
                  </div>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setOpenWorkout(false); setValidationError(""); }}>Cancel</Button>
              <Button disabled={loading} className="bg-rfl-navy" onClick={onSaveWorkout}>{loading ? 'Saving…' : 'Save'}</Button>
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


