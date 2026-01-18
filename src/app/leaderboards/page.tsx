"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Volume2, VolumeX, Info } from 'lucide-react';
import { getSupabase } from "@/lib/supabase";

type TeamRow = { team_id: string; team_name: string; points: number; avg_rr: number | null };
type PlayerRow = { user_id: string; name: string; team: string | null; points: number; avg_rr: number | null };

type TeamStanding = {
  teamId: string;
  teamName: string;
  points: number;
  avgRR: number;
  position: number; 
  delta: number; 
};

type RealTimeStanding = {
  teamId: string;
  teamName: string;
  todayPoints: number;
  yesterdayPoints: number;
  avgRR: number;
  position: number;
};

// ---------------------------
//  NEW ROSTER BALANCING LOGIC
// ---------------------------

// Canonical "full" roster size
const CANONICAL_ROSTER_SIZE = 12;

// Set roster sizes by team name (lowercase)
const TEAM_ROSTER_SIZES: Record<string, number> = {
  "pristine titans": 11,
  "interstellar": 11,
  "amigos": 10,   // YOU SAID AMIGOS = 11 PLAYERS

};

// Returns multiplier: 12/12, 12/11, 12/10, etc.
function getRosterFactor(teamName: string): number {
  const size =
    TEAM_ROSTER_SIZES[teamName.toLowerCase()] ?? CANONICAL_ROSTER_SIZE;

  if (size >= CANONICAL_ROSTER_SIZE) return 1;
  return CANONICAL_ROSTER_SIZE / size;
}

// ---------------------------
// COMPONENT START
// ---------------------------

export default function LeaderboardsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = (session?.user as any)?.role as 'player' | 'leader' | 'governor' | undefined;

  useEffect(() => {
    if (role === 'governor') {
      router.replace('/governor');
    }
  }, [role, router]);

  const [teams, setTeams] = useState<TeamRow[]>([]);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [playersTotal, setPlayersTotal] = useState<number>(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTopInfo, setShowTopInfo] = useState(false);
  const [showRealTimeInfo, setShowRealTimeInfo] = useState(false);

  // AUDIO LOGIC
  const ensureAudio = () => {
    if (!audioRef.current) {
      const el = new Audio('/audio/leaderboard-theme.mp3');
      el.preload = 'auto';
      el.onended = () => setIsPlaying(false);
      audioRef.current = el;
    }
    return audioRef.current;
  };

  const toggleAudio = async () => {
    try {
      const el = ensureAudio();
      if (isPlaying) {
        el.pause();
        el.currentTime = 0;
        setIsPlaying(false);
      } else {
        await el.play();
        setIsPlaying(true);
      }
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  useEffect(() => {
    return () => {
      const el = audioRef.current;
      if (el) {
        try {
          el.pause();
          el.currentTime = 0;
        } catch {}
      }
    };
  }, []);

  // FETCH LEADERBOARDS
  useEffect(() => {
    (async () => {
      setIsLoading(true);

      const fetchLeaderboards = async () => {
        const [{ data: t }, { data: p }] = await Promise.all([
          getSupabase().rpc('rfl_team_leaderboard'),
          getSupabase().rpc('rfl_individual_leaderboard'),
        ]);

        if (t) {
          const teamsSorted = [...t].sort((a: any, b: any) =>
            (b.points - a.points) || ((b.avg_rr || 0) - (a.avg_rr || 0))
          );
          setTeams(teamsSorted);
        } else setTeams([]);

        if (p) {
          const rp = p as Array<{ user_id: string; points: number; avg_rr: number | null }>;
          const userIds = rp.map(r => r.user_id);
          const { data: users } = userIds.length
            ? await getSupabase().from('accounts').select('id, first_name, team_id').in('id', userIds)
            : { data: [] };

          const teamIds = [...new Set((users || []).map(u => String(u.team_id)).filter(Boolean))];
          const { data: teamsMeta } = teamIds.length
            ? await getSupabase().from('teams').select('id, name').in('id', teamIds)
            : { data: [] };

          const teamNameById = new Map<string, string>();
          (teamsMeta || []).forEach(t => teamNameById.set(String(t.id), String(t.name)));

          const usersById = new Map((users || []).map(u => [String(u.id), u]));

          const playersAll: PlayerRow[] =
            rp.map(row => {
              const u = usersById.get(String(row.user_id));
              const teamName = u?.team_id ? teamNameById.get(String(u.team_id)) || null : null;
              return {
                user_id: String(row.user_id),
                name: String(u?.first_name || '—'),
                team: teamName,
                points: row.points,
                avg_rr: row.avg_rr
              };
            }).sort((a, b) =>
              (b.points - a.points) || ((b.avg_rr || 0) - (a.avg_rr || 0))
            );

          const from = (page - 1) * pageSize;
          const to = from + pageSize;

          setPlayersTotal(playersAll.length);
          setPlayers(playersAll.slice(from, to));

        } else {
          setPlayersTotal(0);
          setPlayers([]);
        }
      };

      await fetchLeaderboards();
      setIsLoading(false);
    })();
  }, [page]);

  // DATE UTILITIES
  const seasonStartDate = useMemo(() => new Date(2025, 9, 25), []);
  const startOfLocalDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayLocal = () => startOfLocalDay(new Date());
  const ymdLocal = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  const addDaysLocal = (d: Date, n: number) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

  // PERIOD OPTIONS
  const periodOptions = useMemo(() => {
    const opts: Array<{ value: string; label: string; start: Date; end: Date }> = [];
    const start = seasonStartDate;
    const today = todayLocal();
    opts.push({ value: 'overall', label: 'Season Total', start, end: today });

    let wkStart = new Date(start);
    let weekNum = 1;
    while (wkStart <= today) {
      const wkEnd = addDaysLocal(wkStart, 6);
      const shownEnd = wkEnd <= today ? wkEnd : today;
      opts.push({
        value: `week-${weekNum}`,
        label: `Week ${weekNum}`,
        start: new Date(wkStart),
        end: shownEnd
      });
      wkStart = addDaysLocal(wkStart, 7);
      weekNum++;
    }
    return opts;
  }, [seasonStartDate]);

  // Default to "Season Total" (overall)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('overall');
  const currentPeriod = periodOptions.find(o => o.value === selectedPeriod) || periodOptions[0];

  // STANDINGS FOR PERIOD (as of day before yesterday)
  const [standings, setStandings] = useState<TeamStanding[]>([]);
  
  // REAL-TIME STANDINGS (today + yesterday only)
  const [realTimeStandings, setRealTimeStandings] = useState<RealTimeStanding[]>([]);
  const [isLoadingRealTime, setIsLoadingRealTime] = useState(false);

  // Helper: day before yesterday
  const dayBeforeYesterday = useMemo(() => addDaysLocal(todayLocal(), -2), []);
  const dayBeforeYesterdayStr = useMemo(() => ymdLocal(dayBeforeYesterday), [dayBeforeYesterday]);
  
  // Today and yesterday for real-time table
  const todayDate = useMemo(() => todayLocal(), []);
  const yesterdayDate = useMemo(() => addDaysLocal(todayLocal(), -1), []);
  const todayDateStr = useMemo(() => ymdLocal(todayDate), [todayDate]);
  const yesterdayDateStr = useMemo(() => ymdLocal(yesterdayDate), [yesterdayDate]);
  
  // Format date for display (e.g., "Nov 30")
  const formatDateDisplay = (d: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}`;
  };

  useEffect(() => {
    (async () => {
      setIsLoadingPeriod(true);
      setStandings([]);

      const start = currentPeriod.start;
      // Use day before yesterday as the end date for the top table
      const periodEnd = dayBeforeYesterday < currentPeriod.end ? dayBeforeYesterday : currentPeriod.end;
      
      // If period end is before period start, show empty standings (0 points for all)
      const { data: allTeams } = await getSupabase().from('teams').select('id, name');
      const teams = allTeams || [];
      
      if (periodEnd < start) {
        // Show all teams with 0 points
        const emptyStandings = teams.map((team, idx) => ({
          teamId: String(team.id),
          teamName: String(team.name),
          points: 0,
          avgRR: 0,
          position: idx + 1,
          delta: 0,
        }));
        setStandings(emptyStandings);
        setIsLoadingPeriod(false);
        return;
      }
      
      const prevEnd = ymdLocal(periodEnd) === ymdLocal(start) ? null : addDaysLocal(periodEnd, -1);

      // Fetch challenges with their end_dates and scores
      const { data: challenges } = await getSupabase()
        .from('special_challenges')
        .select('id, end_date');
      
      const { data: chScores } = await getSupabase()
        .from('special_challenge_team_scores')
        .select('challenge_id, team_id, score');

      // Build a map of challenge_id -> end_date
      const challengeEndDates = new Map<string, string>();
      (challenges || []).forEach((c: any) => {
        challengeEndDates.set(String(c.id), c.end_date || '');
      });

      // Only include challenge bonus if the challenge's end_date falls within the selected period (up to day before yesterday)
      const periodStartStr = ymdLocal(start);
      const periodEndStr = ymdLocal(periodEnd);
      
      const challengeBonusByTeam = new Map<string, number>();
      (chScores || []).forEach((r: any) => {
        const challengeId = String(r.challenge_id);
        const challengeEndDate = challengeEndDates.get(challengeId) || '';
        
        // Only add bonus if challenge end_date is within the selected period
        if (challengeEndDate && challengeEndDate >= periodStartStr && challengeEndDate <= periodEndStr) {
          const tid = String(r.team_id);
          const val = Number(r.score || 0);
          challengeBonusByTeam.set(tid, (challengeBonusByTeam.get(tid) || 0) + val);
        }
      });

      const compute = async (s: Date, e: Date) => {
        const res: any[] = [];
        for (const team of teams) {
          const tid = String(team.id);

          // Paginate to bypass Supabase's 1000-row server limit
          let allEntries: any[] = [];
          let offset = 0;
          const batchSize = 1000;
          while (true) {
            const { data: batch } = await getSupabase()
              .from('entries')
              .select('type, rr_value, date')
              .eq('team_id', tid)
              .eq('status', 'approved')
              .gte('date', ymdLocal(s))
              .lte('date', ymdLocal(e))
              .range(offset, offset + batchSize - 1);
            
            if (!batch || batch.length === 0) break;
            allEntries = allEntries.concat(batch);
            if (batch.length < batchSize) break;
            offset += batchSize;
          }

          const ents = allEntries;
          let pts = 0, rrSum = 0, rrCnt = 0;

          ents.forEach(e2 => {
            const rr = Number(e2.rr_value || 0);

            // Every approved entry counts as 1 point
            pts += 1;

            if (rr > 0) {
              rrSum += rr;
              rrCnt++;
            }
          });

          // -------------------------
          // REPLACED SECTION (FACTOR)
          // -------------------------
          const factor = getRosterFactor(String(team.name));
          const pointsRounded = Math.round(pts * factor);

          const bonus = Number(challengeBonusByTeam.get(tid) || 0);
          const finalPoints = pointsRounded + bonus;

          const avgRR = rrCnt > 0 ? Math.round((rrSum / rrCnt) * 100) / 100 : 0;

          res.push({
            teamId: tid,
            teamName: String(team.name),
            points: finalPoints,
            avgRR,
          });
        }

        res.sort((a, b) => (b.points - a.points) || (b.avgRR - a.avgRR));
        return res;
      };

      const curr = await compute(start, periodEnd);
      const prev = prevEnd && prevEnd >= start ? await compute(start, prevEnd) : null;

      const posPrev = new Map<string, number>();
      if (prev) prev.forEach((t: any, i: number) => posPrev.set(t.teamId, i + 1));

      const withMeta = curr.map((t: any, idx: number) => {
        const prevPos = posPrev.get(t.teamId);
        const position = idx + 1;
        const delta = prevPos ? position - prevPos : 0;
        return { ...t, position, delta };
      });

      setStandings(withMeta);
      setIsLoadingPeriod(false);
    })();
  }, [selectedPeriod, dayBeforeYesterday]);

  // REAL-TIME SCOREBOARD: fetch today's and yesterday's entries
  useEffect(() => {
    (async () => {
      setIsLoadingRealTime(true);
      setRealTimeStandings([]);

      const { data: allTeams } = await getSupabase().from('teams').select('id, name');
      const teams = allTeams || [];

      const results: RealTimeStanding[] = [];

      for (const team of teams) {
        const tid = String(team.id);

        // Fetch today's entries
        const { data: todayEntries } = await getSupabase()
          .from('entries')
          .select('type, rr_value')
          .eq('team_id', tid)
          .eq('status', 'approved')
          .eq('date', todayDateStr);

        // Fetch yesterday's entries
        const { data: yesterdayEntries } = await getSupabase()
          .from('entries')
          .select('type, rr_value')
          .eq('team_id', tid)
          .eq('status', 'approved')
          .eq('date', yesterdayDateStr);

        const todayEnts = todayEntries || [];
        const yesterdayEnts = yesterdayEntries || [];

        // Calculate today's points - every approved entry counts as 1 point
        let todayPts = todayEnts.length;

        // Calculate yesterday's points - every approved entry counts as 1 point
        let yesterdayPts = yesterdayEnts.length;

        // Apply roster factor
        const factor = getRosterFactor(String(team.name));
        const todayPointsScaled = Math.round(todayPts * factor);
        const yesterdayPointsScaled = Math.round(yesterdayPts * factor);

        // Calculate avg RR from both today and yesterday
        let rrSum = 0, rrCnt = 0;
        [...todayEnts, ...yesterdayEnts].forEach(e => {
          const rr = Number(e.rr_value || 0);
          if (rr > 0) {
            rrSum += rr;
            rrCnt++;
          }
        });
        const avgRR = rrCnt > 0 ? Math.round((rrSum / rrCnt) * 100) / 100 : 0;

        results.push({
          teamId: tid,
          teamName: String(team.name),
          todayPoints: todayPointsScaled,
          yesterdayPoints: yesterdayPointsScaled,
          avgRR,
          position: 0, // will be set after sorting
        });
      }

      // Sort by today's points desc, then avgRR desc
      results.sort((a, b) => {
        return (b.todayPoints - a.todayPoints) || (b.avgRR - a.avgRR);
      });

      // Assign positions
      results.forEach((r, idx) => {
        r.position = idx + 1;
      });

      setRealTimeStandings(results);
      setIsLoadingRealTime(false);
    })();
  }, [todayDateStr, yesterdayDateStr]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-rfl-navy mb-2">Leaderboard</h1>
          <p className="text-gray-600">🔥 Track your team’s race to the top!</p>
        </div>

        <div className="space-y-6">
          {/* TOP TABLE: Standings as of day before yesterday */}
          <Card className="bg-white shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-xl text-rfl-navy">Leaderboard</CardTitle>
                  <div className="flex items-center gap-1.5">
                    <CardDescription>As of {formatDateDisplay(dayBeforeYesterday)}</CardDescription>
                    <div className="relative">
                      <button
                        onClick={() => setShowTopInfo(v => !v)}
                        className="text-gray-400 hover:text-rfl-navy transition-colors"
                        aria-label="More information"
                      >
                        <Info className="w-4 h-4" />
                      </button>
                      {showTopInfo && (
                        <>
                          {/* Backdrop to close on tap outside */}
                          <div className="fixed inset-0 z-10" onClick={() => setShowTopInfo(false)} />
                          {/* Mobile: fixed centered below icon area, Desktop: absolute left-aligned */}
                          <div className="fixed left-4 right-4 top-32 z-20 p-4 bg-white border border-gray-200 rounded-lg shadow-xl text-sm text-gray-700 sm:absolute sm:left-0 sm:right-auto sm:top-6 sm:w-72 sm:p-3">
                            <p>This table shows the official standings as of {formatDateDisplay(dayBeforeYesterday)}. Final points are submitted and cannot be changed.</p>
                            <p className="mt-2 text-gray-500">For real-time scores from today and yesterday, check the table below.</p>
                            <button 
                              onClick={() => setShowTopInfo(false)}
                              className="mt-3 text-xs text-rfl-coral hover:underline"
                            >
                              Close
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    aria-label={isPlaying ? 'Stop music' : 'Play music'}
                    onClick={toggleAudio}
                    className={`p-2 rounded-md border border-gray-300 ${
                      isPlaying ? 'bg-rfl-coral text-white' : 'hover:bg-gray-50'
                    }`}
                  >
                    {isPlaying ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
                  </button>

                  <div className="relative dropdown-container">
                    <button
                      onClick={() => setDropdownOpen(v => !v)}
                      disabled={isLoadingPeriod}
                      className={`flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md ${
                        isLoadingPeriod ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                    >
                      <span>
                        {periodOptions.find(o => o.value === selectedPeriod)?.label || 'Season Total'}
                      </span>
                      <span className="text-gray-500">▾</span>
                    </button>

                    {dropdownOpen && (
                      <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                        <div className="py-1 max-h-80 overflow-auto">
                          {periodOptions.map(option => (
                            <button
                              key={option.value}
                              onClick={() => { setSelectedPeriod(option.value); setDropdownOpen(false); }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                                selectedPeriod === option.value
                                  ? 'bg-rfl-coral/10 text-rfl-coral'
                                  : 'text-gray-700'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-600">
                    <tr>
                      <th className="py-2 pr-2 text-xs font-semibold w-12">Rank</th>
                      <th className="py-2 pr-2 text-xs font-semibold w-32">Team Name</th>
                      <th className="py-2 pr-2 text-xs font-semibold text-right w-16">Points</th>
                      <th className="py-2 pr-2 text-xs font-semibold text-right w-16">Avg RR</th>
                    </tr>
                  </thead>

                  <tbody>
                    {standings.map(t => {
                      const logoName = t.teamName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') + '_Logo.jpeg';
                      const logoPath = `/img/${logoName}`;

                      return (
                        <tr key={t.teamId} className="border-t hover:bg-gray-50">
                          <td className="py-2 pr-2 font-bold text-rfl-navy text-sm w-12">{t.position}</td>
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={logoPath}
                                onError={e => ((e.target as HTMLImageElement).src = '/img/placeholder-team.svg')}
                                className="w-6 h-6 rounded border object-cover"
                              />
                              <span className="font-medium text-rfl-navy text-sm whitespace-nowrap">{t.teamName}</span>
                            </div>
                          </td>
                          <td className="py-2 pr-2 text-right font-bold text-rfl-coral text-sm">{t.points}</td>
                          <td className="py-2 pr-2 text-right font-semibold text-rfl-navy text-sm">
                            {t.avgRR.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}

                    {(isLoading || isLoadingPeriod) ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-600">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rfl-coral"></div>
                            <span>Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : !standings.length ? (
                      <tr><td colSpan={4} className="py-8 text-center text-gray-600">No data yet.</td></tr>
                    ) : null}

                  </tbody>
                </table>
              </div>
            </CardContent>

          </Card>

          {/* BOTTOM TABLE: Real-time Scoreboard (today + yesterday) */}
          <Card className="bg-white shadow-md">
            <CardHeader>
              <div>
                <CardTitle className="text-xl text-rfl-navy">Real-time Scoreboard</CardTitle>
                <div className="flex items-center gap-1.5">
                  <CardDescription>Today's and yesterday's scores</CardDescription>
                  <div className="relative">
                    <button
                      onClick={() => setShowRealTimeInfo(v => !v)}
                      className="text-gray-400 hover:text-rfl-navy transition-colors"
                      aria-label="More information"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    {showRealTimeInfo && (
                      <>
                        {/* Backdrop to close on tap outside */}
                        <div className="fixed inset-0 z-10" onClick={() => setShowRealTimeInfo(false)} />
                        {/* Mobile: fixed centered below icon area, Desktop: absolute left-aligned */}
                        <div className="fixed left-4 right-4 top-auto bottom-40 z-20 p-4 bg-white border border-gray-200 rounded-lg shadow-xl text-sm text-gray-700 sm:absolute sm:left-0 sm:right-auto sm:bottom-auto sm:top-6 sm:w-72 sm:p-3">
                          <p>This table shows real-time scores ranked by today's points. Avg RR is calculated from both today's and yesterday's entries. These standings are subject to change as more entries come in.</p>
                          <p className="mt-2 text-gray-500">For official finalized standings, please refer to the Leaderboard table above.</p>
                          <button 
                            onClick={() => setShowRealTimeInfo(false)}
                            className="mt-3 text-xs text-rfl-coral hover:underline"
                          >
                            Close
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-gray-600">
                    <tr>
                      <th className="py-2 pr-2 text-xs font-semibold w-12">Rank</th>
                      <th className="py-2 pr-2 text-xs font-semibold">Team Name</th>
                      <th className="py-2 pr-2 text-xs font-semibold text-right whitespace-nowrap">{formatDateDisplay(todayDate)}</th>
                      <th className="py-2 pr-2 text-xs font-semibold text-right whitespace-nowrap">{formatDateDisplay(yesterdayDate)}</th>
                      <th className="py-2 pr-2 text-xs font-semibold text-right">Avg RR</th>
                    </tr>
                  </thead>

                  <tbody>
                    {realTimeStandings.map(t => {
                      const logoName = t.teamName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') + '_Logo.jpeg';
                      const logoPath = `/img/${logoName}`;

                      return (
                        <tr key={t.teamId} className="border-t hover:bg-gray-50">
                          <td className="py-2 pr-2 font-bold text-rfl-navy text-sm w-12">{t.position}</td>
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2">
                              <img
                                src={logoPath}
                                onError={e => ((e.target as HTMLImageElement).src = '/img/placeholder-team.svg')}
                                className="w-6 h-6 rounded border object-cover"
                              />
                              <span className="font-medium text-rfl-navy text-sm whitespace-nowrap">{t.teamName}</span>
                            </div>
                          </td>
                          <td className="py-2 pr-2 text-right font-bold text-rfl-coral text-sm">{t.todayPoints}</td>
                          <td className="py-2 pr-2 text-right font-bold text-rfl-coral text-sm">{t.yesterdayPoints}</td>
                          <td className="py-2 pr-2 text-right font-semibold text-rfl-navy text-sm">
                            {t.avgRR.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}

                    {isLoadingRealTime ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-gray-600">
                          <div className="flex items-center justify-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-rfl-coral"></div>
                            <span>Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : !realTimeStandings.length ? (
                      <tr><td colSpan={5} className="py-8 text-center text-gray-600">No data yet.</td></tr>
                    ) : null}

                  </tbody>
                </table>
              </div>
            </CardContent>

          </Card>
        </div>
      </div>
    </div>
  );
}
