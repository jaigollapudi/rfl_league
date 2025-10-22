"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { getSupabase } from "@/lib/supabase";
import TeamProgressChart from "./TeamProgressChart";

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

function formatDateYYYYMMDD(d: Date): string {
  // Use UTC components to avoid timezone shifting across boundaries
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
    .toISOString()
    .split("T")[0];
}

function addDaysUTC(d: Date, days: number): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days));
}

function firstWeekStart(year: number): Date {
  // Week 1 starts at the Monday on/after Sept 1
  const sept1 = new Date(Date.UTC(year, 8, 1));
  const day = sept1.getUTCDay(); // 0 Sun .. 6 Sat
  // Compute days to add to reach Monday (1). If already Monday, add 0.
  const add = day === 0 ? 1 : (day <= 1 ? (1 - day) : (7 - (day - 1)));
  const monday = addDaysUTC(sept1, add);
  return monday;
}

function seasonEndStart(year: number): Date {
  // Last allowed week start is Dec 1
  return new Date(Date.UTC(year, 11, 1)); // Dec = 11
}

function formatLocalDateLabel(yyyyMmDd: string): string {
  // Parse as local date to avoid timezone shifts (YYYY-MM-DD is treated as UTC if passed to Date constructor)
  const [y, m, d] = yyyyMmDd.split('-').map((v) => parseInt(v, 10));
  const localDate = new Date(y, (m || 1) - 1, d || 1);
  return localDate.toDateString();
}

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
  field: {
    name: "Field Sports",
    fields: ['duration'],
    rules: ["45 mins minimum"],
    minDuration: 45,
  },
  meditation: {
    name: "Meditation/Chanting/Breathing",
    fields: ['duration'],
    rules: ["30–45 mins minimum (30 for seniors)"],
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
  const [isSenior, setIsSenior] = useState<boolean>(false);

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
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofError, setProofError] = useState<string>("");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string>("");
  const [teamPoints, setTeamPoints] = useState<number | null>(null);
  const [teamAvgRR, setTeamAvgRR] = useState<number | null>(null);
  const [teamPosition, setTeamPosition] = useState<number | null>(null);
  const [chartDates, setChartDates] = useState<string[]>([]);
  const [weekRestDays, setWeekRestDays] = useState<number>(0);
  const [teamMissedWeek, setTeamMissedWeek] = useState<number>(0);
  const [teamRestWeek, setTeamRestWeek] = useState<number>(0);
  const [myPoints, setMyPoints] = useState<number>(0);
  const [myAvgRR, setMyAvgRR] = useState<number | null>(null);
  const [myMissedDays, setMyMissedDays] = useState<number>(0);
  const [myRestUsed, setMyRestUsed] = useState<number>(0);
  const [viewWeekStart, setViewWeekStart] = useState<Date>(() => {
    const now = new Date();
    const y = now.getUTCFullYear();
    const seasonStart = firstWeekStart(y);
    const end = seasonEndStart(y);
    let idx = Math.floor((new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).getTime() - seasonStart.getTime()) / (7 * 24 * 3600 * 1000));
    if (idx < 0) idx = 0;
    const maxIdx = Math.floor((end.getTime() - seasonStart.getTime()) / (7 * 24 * 3600 * 1000));
    if (idx > maxIdx) idx = maxIdx;
    return addDaysUTC(seasonStart, idx * 7);
  });

  const currentConfig = ACTIVITY_CONFIGS[activity];
  const sessionAge = (session?.user as any)?.age as number | undefined;
  const isSeniorEffective = (typeof sessionAge === 'number' && sessionAge >= 65) || isSenior;
  const PROOF_BUCKET = (process.env.NEXT_PUBLIC_PROOF_BUCKET as string) || 'rofl_proof_pics';
  

  const validateWorkout = useMemo(() => {
    if (!userId) return { valid: false, error: "" };
    const config = ACTIVITY_CONFIGS[activity];

    if (activity === "steps") {
      const minSteps = isSeniorEffective ? 5000 : (config.minSteps || 0);
      if (!steps || Number(steps) < minSteps) {
        return { valid: false, error: `Minimum ${minSteps.toLocaleString()} steps required` };
      }
      return { valid: true, error: "" };
    }

    if (activity === "golf") {
      const holesProvided = holes !== "" && holes !== null && Number(holes) > 0;
      const stepsProvided = steps !== "" && steps !== null && Number(steps) > 0;
      if (holesProvided && stepsProvided) {
        return { valid: false, error: "Please provide only one: Holes OR Steps" };
      }
      const holesValid = holesProvided && Number(holes) >= (config.minHoles || 0);
      const stepsValid = stepsProvided && Number(steps) >= (config.minSteps || 0);
      if (!holesValid && !stepsValid) {
        return { valid: false, error: `Minimum ${config.minHoles} holes OR ${config.minSteps?.toLocaleString()} steps required` };
      }
      return { valid: true, error: "" };
    }

    const durationProvided = duration !== "" && duration !== null && Number(duration) > 0;
    const distanceProvided = distance !== "" && distance !== null && Number(distance) > 0;
    const minDur = isSeniorEffective ? 30 : (config.minDuration || 0);
    const durationValid = durationProvided && Number(duration) >= minDur;
    const distanceValid = distanceProvided && Number(distance) >= (config.minDistance || 0);

    if (config.fields.includes('distance') && config.minDistance) {
      if (durationProvided && distanceProvided) {
        return { valid: false, error: "Please provide only one: Duration OR Distance" };
      }
      if (!durationValid && !distanceValid) {
        return { valid: false, error: `Minimum ${minDur} mins OR ${config.minDistance} kms required` };
      }
    } else {
      if (!durationValid) {
        return { valid: false, error: `Minimum ${minDur} mins required` };
      }
    }

    return { valid: true, error: "" };
  }, [userId, activity, duration, distance, steps, holes]);

  async function fetchActivity(weekStart?: Date) {
    if (!userId) return;
    const ws = weekStart || viewWeekStart;
    const we = new Date(ws);
    we.setUTCDate(ws.getUTCDate() + 6);
    const { data, error } = await getSupabase()
      .from('entries')
      .select('date,type,workout_type,duration,distance,steps,holes,status,rr_value')
      .eq('user_id', userId)
      .gte('date', formatDateYYYYMMDD(ws))
      .lte('date', formatDateYYYYMMDD(we))
      .order('date', { ascending: true });
    if (error) return;
    const entries = (data || []) as Array<Omit<ActivityRow,'points'>>;
    const filled: ActivityRow[] = [];
    let restCount = 0;
    for (let i = 0; i < 7; i++) {
      const day = new Date(ws);
      day.setUTCDate(ws.getUTCDate() + i);
      const ds = formatDateYYYYMMDD(day);
      const e = entries.find(x => String(x.date) === ds);
      const isRest = e?.type === 'rest' && e?.status === 'approved';
      if (isRest) restCount++;
      filled.push({
        date: ds,
        type: e?.type ?? null,
        workout_type: e?.workout_type ?? null,
        duration: e?.duration ?? null,
        distance: e?.distance ?? null,
        steps: e?.steps ?? null,
        holes: e?.holes ?? null,
        status: (e?.status as ActivityRow['status']) ?? null,
        rr_value: e?.rr_value ?? null,
        points: e && e.status === 'approved' ? 1 : 0,
      });
    }
    setRows(filled);
    setWeekRestDays(restCount);
  }

  useEffect(() => {
    fetchActivity(viewWeekStart);
    (async () => {
      if (!userId) return;
      // Fetch user's team id, age and name
      const { data: acct } = await getSupabase()
        .from('accounts')
        .select('team_id, age, teams(name)')
        .eq('id', userId)
        .maybeSingle();
      type Acct = { team_id: string | null; age: number | null; teams?: { name?: string } | null } | null;
      const tId = (acct as Acct)?.team_id || null;
      const tName = (acct as Acct)?.teams?.name || "";
      setTeamId(tId);
      setTeamName(tName || "");
      const ageVal = (acct as Acct)?.age ?? null;
      setIsSenior(typeof ageVal === 'number' && ageVal >= 65);

      // Fetch rest day count
      const { count } = await getSupabase()
        .from('entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('type', 'rest')
        .eq('status', 'approved');
      setRestUsed(count || 0);

      // Fetch leaderboard to compute team position (overall)
      const { data: leaderboard } = await getSupabase().rpc('rfl_team_leaderboard');
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
  }, [userId, viewWeekStart]);

  // Load individual overall stats (season-to-date)
  useEffect(() => {
    (async () => {
      if (!userId) return;
      const seasonStart = new Date(Date.UTC(new Date().getUTCFullYear(), 8, 1)); // Sept 1
      const today = new Date();
      const seasonStartStr = seasonStart.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];

      // Fetch all my approved entries for the season
      const { data: myEntries } = await getSupabase()
        .from('entries')
        .select('type, rr_value, date')
        .eq('user_id', userId)
        .eq('status', 'approved')
        .gte('date', seasonStartStr)
        .lte('date', todayStr);

      const entries = (myEntries || []) as Array<{ type: string; rr_value: number | null; date: string }>;

      // Calculate my stats
      const points = entries.length; // every approved entry counts 1
      const rrVals = entries.map(e => (typeof e.rr_value === 'number' ? e.rr_value : Number(e.rr_value || 0))).filter(v => v > 0);
      const avgRR = rrVals.length ? Math.round((rrVals.reduce((a,b)=>a+b,0)/rrVals.length)*100)/100 : null;
      const restUsed = entries.filter(e => String(e.type) === 'rest').length;

      // Calculate missed days (days from season start to today with no entry)
      const byDate = new Set(entries.map(e => String(e.date)));
      let missed = 0;
      let cur = new Date(seasonStart);
      while (cur.getTime() <= today.getTime()) {
        const ds = cur.toISOString().split('T')[0];
        if (!byDate.has(ds)) missed += 1;
        cur = new Date(cur.getTime() + 24 * 3600 * 1000);
      }

      setMyPoints(points);
      setMyAvgRR(avgRR);
      setMyMissedDays(missed);
      setMyRestUsed(restUsed);
    })();
  }, [userId]);

  // Compute Team overall summary (approved entries only) for season-to-date
  useEffect(() => {
    (async () => {
      let effectiveTeamId = teamId;
      if (!effectiveTeamId && userId) {
        const { data: acct } = await getSupabase()
          .from('accounts')
          .select('team_id')
          .eq('id', userId)
          .maybeSingle();
        effectiveTeamId = (acct as any)?.team_id || null;
        if (effectiveTeamId) setTeamId(effectiveTeamId);
      }
      if (!effectiveTeamId) return;
      
      const seasonStart = new Date(Date.UTC(new Date().getUTCFullYear(), 8, 1)); // Sept 1
      const today = new Date();
      const seasonStartStr = seasonStart.toISOString().split('T')[0];
      const todayStr = today.toISOString().split('T')[0];
      
      // Fetch team members
      const { data: teamUsers } = await getSupabase()
        .from('accounts')
        .select('id')
        .eq('team_id', effectiveTeamId);
      const memberIds = ((teamUsers || []) as Array<{ id: string }>).map((u)=> String(u.id));
      
      // Fetch all approved entries for the team for the season
      const { data } = await getSupabase()
        .from('entries')
        .select('id, user_id, date, type, rr_value')
        .eq('team_id', effectiveTeamId)
        .eq('status', 'approved')
        .gte('date', seasonStartStr)
        .lte('date', todayStr);
      const entries = (data || []) as Array<{ id: string; user_id: string; date: string; type: string | null; rr_value: number | null }>;
      const teamPts = entries.length; // every approved entry counts 1
      const rrVals = entries.map(e => (typeof e.rr_value === 'number' ? e.rr_value : Number(e.rr_value || 0))).filter(v => v > 0);
      const teamRR = rrVals.length ? Math.round((rrVals.reduce((a,b)=>a+b,0)/rrVals.length)*100)/100 : null;
      // Team rest days (approved)
      const restUsed = entries.filter(e => String(e.type) === 'rest').length;
      
      // Team missed days: per member per day with no entry from season start to today
      const memberSet = new Set(memberIds);
      const byDateUser = new Set(entries.map(e => `${String(e.date)}|${String(e.user_id)}`));
      let missed = 0;
      {
        let day = new Date(seasonStart);
        while (day.getTime() <= today.getTime()) {
          const ds = day.toISOString().split('T')[0];
          memberSet.forEach((uid)=>{ if (!byDateUser.has(`${ds}|${uid}`)) missed += 1; });
          day = new Date(day.getTime() + 24 * 3600 * 1000);
        }
      }
      setTeamPoints(teamPts);
      setTeamAvgRR(teamRR);
      setTeamRestWeek(restUsed);
      setTeamMissedWeek(missed);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId, userId]);

  // Removed league-wide standings from dashboard (moved to leaderboards page)

  useEffect(() => {
    setDuration(currentConfig.minDuration || "");
    setDistance("");
    setSteps("");
    setHoles("");
    setValidationError("");
    setProofError("");
    setProofFile(null);
  }, [activity, currentConfig.minDuration]);

  async function onSaveWorkout() {
    if (!userId) return;
    if (!validateWorkout.valid) {
      setValidationError(validateWorkout.error);
      return;
    }
    // Temporarily disable strict proof requirement; allow saving without an image
    if (date > todayStr()) {
      alert("Future dates are not allowed.");
      return;
    }

      const { data: hasExisting } = await getSupabase().rpc("rfl_has_entry_on_date", {
      p_user_id: userId,
      p_date: date,
    });
    if (hasExisting) {
      const ok = window.confirm("You already have a log for this day. Overwrite it?");
      if (!ok) return;
    }

    setLoading(true);
    try {
      // 1) Upload proof image to Supabase Storage (optional for now)
      let proofUrl: string | null = null;
      if (proofFile) {
        const safeName = proofFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const filePath = `${userId}/${date}/${Date.now()}-${safeName}`;
        const { error: uploadErr } = await getSupabase().storage.from(PROOF_BUCKET).upload(filePath, proofFile, {
          cacheControl: '3600', upsert: true, contentType: proofFile.type || 'image/jpeg'
        });
        if (uploadErr) { setProofError('Upload failed, please try again.'); throw uploadErr; }
        const { data: pub } = getSupabase().storage.from(PROOF_BUCKET).getPublicUrl(filePath);
        proofUrl = pub?.publicUrl || null;
      }

      // 2) Save workout entry with proof URL as approved (auto-approved)
      await getSupabase().rpc("rfl_upsert_workout", {
        p_user_id: userId,
        p_date: date,
        p_workout_type: activity,
        p_team_id: null,
        p_duration: duration === "" ? null : Number(duration),
        p_distance: distance === "" ? null : (distance as number),
        p_steps: steps === "" ? null : Number(steps),
        p_holes: holes === "" ? null : Number(holes),
        p_proof_url: proofUrl,
        p_status: "approved",
      });
      setOpenWorkout(false);
      setValidationError("");
      setProofError("");
      setProofFile(null);
      await fetchActivity(viewWeekStart);
      // Refresh individual stats after saving
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  async function onSaveRest() {
    if (!userId) return;
    if (date > todayStr()) { alert('Future dates are not allowed.'); return; }
      const { data: hasExisting } = await getSupabase().rpc('rfl_has_entry_on_date', { p_user_id: userId, p_date: date });
    if (hasExisting) { const ok = window.confirm('You already have a log for this day. Overwrite it?'); if (!ok) return; }
    setLoading(true);
    try {
      await getSupabase().rpc('rfl_upsert_rest_day', { p_user_id: userId, p_date: date, p_team_id: null, p_status: 'approved' });
      setOpenRest(false);
      await fetchActivity(viewWeekStart);
      // Refresh individual stats after saving
      window.location.reload();
    } finally { setLoading(false); }
  }

  // League bounds (Sept 1 to Dec 1 of current year) for navigation
  const currentYear = new Date().getUTCFullYear();
  const seasonStart = firstWeekStart(currentYear);
  const seasonEnd = seasonEndStart(currentYear);
  const canGoPrev = viewWeekStart.getTime() > seasonStart.getTime();
  const canGoNext = viewWeekStart.getTime() < seasonEnd.getTime();
  const weekNumber = Math.max(
    1,
    Math.floor(
      (viewWeekStart.getTime() - seasonStart.getTime()) /
        (7 * 24 * 3600 * 1000)
    ) + 1
  );
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8 mb-8">
        {/* Dashboard title positioned above Summary card content */}
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-rfl-navy mb-2">Welcome back, {session?.user?.name?.split(' ')[0] || 'User'}!</h1>
          <p className="text-gray-600">Let's crush those fitness goals today 💪</p>
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Button className="bg-rfl-coral hover:bg-rfl-coral/90 h-8 flex-1" onClick={() => { setDate(todayStr()); setOpenWorkout(true); }}>Add Workout</Button>
              <Button variant="outline" className="h-8 flex-1 border-rfl-navy text-rfl-navy hover:bg-rfl-navy/10" onClick={() => { setDate(todayStr()); setOpenRest(true); }}>Add Rest Day</Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* My Summary */}
            <div className="rounded-lg border bg-white p-3 sm:p-4 mb-4">
              <div className="text-sm font-semibold text-rfl-navy mb-2">My Summary</div>
              
              {/* Row 1: Points and Avg RR */}
              <div className="grid grid-cols-2 gap-3 text-center mb-4">
                <div className="p-3 bg-rfl-peach/50 rounded">
                  <div className="text-xs text-gray-600">Points</div>
                  <div className="text-lg font-bold text-rfl-coral">{myPoints}</div>
                </div>
                <div className="p-3 bg-rfl-peach/50 rounded">
                  <div className="text-xs text-gray-600">Avg RR</div>
                  <div className="text-lg font-bold text-rfl-navy">{myAvgRR !== null ? Number(myAvgRR).toFixed(2) : '—'}</div>
                </div>
              </div>

              {/* Row 2: Rest Days Used, Rest Days Unused, Missed Days */}
              <div className="grid grid-cols-3 gap-3 text-center mb-4">
                <div className="p-3 bg-rfl-peach/50 rounded">
                  <div className="text-xs text-gray-600">Rest Days Used</div>
                  <div className="text-lg font-bold text-rfl-navy">{myRestUsed}</div>
                </div>
                <div className="p-3 bg-rfl-peach/50 rounded">
                  <div className="text-xs text-gray-600">Rest Days Unused</div>
                  <div className="text-lg font-bold text-rfl-navy">{Math.max(0, 18 - myRestUsed)}</div>
                </div>
                <div className="p-3 bg-rfl-peach/50 rounded">
                  <div className="text-xs text-gray-600">Days Missed</div>
                  <div className="text-lg font-bold text-rfl-navy">{myMissedDays}</div>
                </div>
              </div>

              {/* Row 3: Avg RR — You vs Team */}
              <div className="rounded-lg border bg-white p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-semibold text-rfl-navy">Avg RR — You vs Team</div>
                  <div className="text-xs text-gray-600">Scale: 1.00 → 2.50</div>
                </div>
                {(() => {
                  const you = typeof myAvgRR === 'number' ? myAvgRR : 1.0;
                  const team = typeof teamAvgRR === 'number' ? teamAvgRR : 1.0;
                  const min = 1.0, max = 2.5, span = max - min;
                  const pct = (v: number) => Math.max(0, Math.min(100, ((v - min) / span) * 100));
                  const youPct = pct(you);
                  const teamPct = pct(team);
                  return (
                    <div>
                      <div className="relative h-2 sm:h-3 rounded-full bg-gradient-to-r from-gray-200 via-gray-300 to-gray-400">
                        <span className="absolute top-1/2 -translate-y-1/2" style={{ left: `calc(${youPct}% - 4px)` }}>
                          <span className="block w-2 h-2 rounded-full bg-rfl-coral border border-white"></span>
                        </span>
                        <span className="absolute top-1/2 -translate-y-1/2" style={{ left: `calc(${teamPct}% - 4px)` }}>
                          <span className="block w-2 h-2 rounded-full bg-rfl-light-blue border border-white"></span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-700 mt-2">
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rfl-coral inline-block"></span> You: {typeof myAvgRR === 'number' ? myAvgRR.toFixed(2) : '—'}</div>
                        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rfl-light-blue inline-block"></span> Team: {typeof teamAvgRR === 'number' ? teamAvgRR.toFixed(2) : '—'}</div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {/* Team Summary */}
            <div className="rounded-lg border bg-white p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold text-rfl-navy">Team Summary {teamName ? `— ${teamName}` : ''}</div>
                {teamPosition ? (
                  <div className="text-xs px-2 py-0.5 rounded-full bg-rfl-coral text-white">Position #{teamPosition}</div>
                ) : null}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-rfl-peach/50 rounded">
                  <div className="text-xs text-gray-600">Points</div>
                  <div className="text-lg font-bold text-rfl-coral">{teamPoints ?? '—'}</div>
                </div>
                <div className="p-3 bg-rfl-peach/50 rounded">
                  <div className="text-xs text-gray-600">Avg RR</div>
                  <div className="text-lg font-bold text-rfl-navy">{teamAvgRR !== null ? Number(teamAvgRR).toFixed(2) : '—'}</div>
                </div>
                <div className="p-3 bg-rfl-peach/50 rounded">
                  <div className="text-xs text-gray-600">Days Missed</div>
                  <div className="text-lg font-bold text-rfl-navy">{teamMissedWeek}</div>
                </div>
                <div className="p-3 bg-rfl-peach/50 rounded">
                  <div className="text-xs text-gray-600">Rest Days Used</div>
                  <div className="text-lg font-bold text-rfl-navy">{teamRestWeek}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Calendar className="w-5 h-5 text-rfl-light-blue" /> This Week</CardTitle>
              <div className="flex items-center gap-2">
                <button
                  className={`p-1 rounded border ${canGoPrev ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={() => canGoPrev && setViewWeekStart(prev => {
                    const prevWs = addDaysUTC(prev, -7);
                    return prevWs.getTime() < seasonStart.getTime() ? seasonStart : prevWs;
                  })}
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-3 py-1 rounded bg-gray-100 text-sm font-medium text-gray-800">Week {weekNumber}</div>
                <button
                  className={`p-1 rounded border ${canGoNext ? 'hover:bg-gray-50' : 'opacity-50 cursor-not-allowed'}`}
                  onClick={() => canGoNext && setViewWeekStart(prev => {
                    const nextWs = addDaysUTC(prev, 7);
                    return nextWs.getTime() > seasonEnd.getTime() ? seasonEnd : nextWs;
                  })}
                  aria-label="Next week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {rows.map((r) => (
                <div key={r.date} className="bg-white rounded border p-3 flex items-start justify-between">
                  <div>
                    <div className="font-medium text-rfl-navy">{formatLocalDateLabel(r.date)}</div>
                    <div className="text-sm text-gray-600">
                      {r?.type
                        ? (
                          r.type === 'rest'
                            ? (
                              <div>
                                <div>Rest Day</div>
                                {typeof r.rr_value === 'number' && <div>RR: {Number(r.rr_value).toFixed(2)}</div>}
                              </div>
                            )
                            : (() => {
                                const cfg = ACTIVITY_CONFIGS[r.workout_type || ''] as any;
                                const label = cfg?.name ? String(cfg.name).split(' / ')[0] : (r.workout_type || 'Activity');
                                const metric = r.duration ? `${r.duration} mins` : (r.distance ? `${r.distance} km` : (r.steps ? `${Number(r.steps).toLocaleString()} steps` : (r.holes ? `${r.holes} holes` : '')));
                                return (
                                  <div>
                                    <div>{label}{metric ? ` (${metric})` : ''}</div>
                                    {typeof r.rr_value === 'number' && <div>RR: {Number(r.rr_value).toFixed(2)}</div>}
                                  </div>
                                );
                              })()
                          )
                        : 'No Entry'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-rfl-coral">{r.points ?? 0} pt</div>
                    {r?.status && (
                      <div className={`text-xs inline-block mt-1 px-2 py-0.5 rounded-full ${
                        r.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                        r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>{r.status === 'approved' ? 'submitted' : r.status}</div>
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
            {proofError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">{proofError}</div>
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
                <option value="field">Field Sports</option>
                <option value="steps">Steps</option>
                <option value="golf">Golf</option>
                {isSeniorEffective && <option value="meditation">Meditation/Chanting/Breathing</option>}
              </select>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-gray-700">
                <div className="font-medium text-rfl-navy mb-1">Requirements:</div>
                {currentConfig.rules.map((rule, idx) => (<div key={idx}>• {rule}</div>))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {currentConfig.fields.includes('duration') && (
                  <div className={currentConfig.fields.length === 1 ? 'col-span-2' : 'flex items-end gap-2'}>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Duration (mins){currentConfig.minDuration ? ` — min ${currentConfig.minDuration}` : ''}</label>
                      <input value={duration ?? ''} onChange={(e)=>{ setDuration(e.target.value === '' ? '' : Number(e.target.value)); setValidationError(""); }} type="number" min={0} className="w-full border rounded-md px-3 py-2" />
                    </div>
                    {currentConfig.fields.length > 1 && <div className="pb-2 text-xs font-semibold text-gray-600">OR</div>}
                  </div>
                )}
                {currentConfig.fields.includes('distance') && (
                  <div className={currentConfig.fields.length === 1 ? 'col-span-2' : 'flex-1'}>
                    <label className="block text-sm font-medium text-gray-700">Distance (km){currentConfig.minDistance ? ` — min ${currentConfig.minDistance}` : ''}</label>
                    <input value={distance ?? ''} onChange={(e)=>{ setDistance(e.target.value === '' ? '' : Number(e.target.value)); setValidationError(""); }} type="number" min={0} step="0.1" className="w-full border rounded-md px-3 py-2" />
                  </div>
                )}
                {activity === 'golf' ? (
                  <div className="col-span-2 flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Holes (golf){currentConfig.minHoles ? ` — min ${currentConfig.minHoles}` : ''}</label>
                      <input value={holes ?? ''} onChange={(e)=>{ setHoles(e.target.value === '' ? '' : Number(e.target.value)); setValidationError(""); }} type="number" min={0} className="w-full border rounded-md px-3 py-2" />
                    </div>
                    <div className="pb-2 text-xs font-semibold text-gray-600">OR</div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700">Steps{currentConfig.minSteps ? ` — min ${currentConfig.minSteps.toLocaleString()}` : ''}</label>
                      <input value={steps ?? ''} onChange={(e)=>{ setSteps(e.target.value === '' ? '' : Number(e.target.value)); setValidationError(""); }} type="number" min={0} className="w-full border rounded-md px-3 py-2" />
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
              </div>

              {/* Proof upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Upload proof (image)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e)=>{ setProofFile(e.target.files && e.target.files[0] ? e.target.files[0] : null); setProofError(""); }}
                  className="w-full border rounded-md px-3 py-2"
                />
                <div className="text-xs text-gray-500 mt-1">Required. Screenshots/photos only.</div>
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
              <div className="text-sm text-rfl-navy font-semibold">You are taking a rest day. You have {Math.max(0, 18 - myRestUsed)} / 18 rest days left.</div>
              <div className="text-sm text-gray-700">Rest days remaining: <span className="font-semibold">{Math.max(0, 18 - myRestUsed)}</span> / 18</div>
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


