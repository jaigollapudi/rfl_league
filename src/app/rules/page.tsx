import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, X, Clock, Trophy, Users, Calendar } from "lucide-react"

export default function RulesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-rfl-navy mb-2">RFL Rules & Guidelines</h1>
        <p className="text-gray-600">Everything you need to know about the Rotary Fitness League challenge.</p>
      </div>

      {/* Challenge Overview */}
      <Card className="bg-white shadow-md mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-rfl-navy flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Challenge Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Users className="w-5 h-5 text-rfl-light-blue mt-0.5" />
            <div>
              <strong>50 Pristine players organized into 5 teams of 10 each</strong>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-rfl-coral mt-0.5" />
            <div>
              <strong>90 day challenge. From Oct 1st, 2025 - Dec 30th 2025</strong>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Trophy className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <strong>Sports tournaments</strong> (e.g TT, Badminton & Pickle ball) in Oct-Dec 2025 for bonus points. Details later. Start practising.
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Trophy className="w-5 h-5 text-rfl-coral mt-0.5" />
            <div>
              <strong>Grand Finale day on Dec 31st 2025</strong> — Fun team games for points & RFL Awards ceremony
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approved Workouts */}
      <Card className="bg-white shadow-md mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-rfl-navy">Approved Workouts</CardTitle>
          <CardDescription>Types of workouts accepted for the league</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>Brisk Walk/Jog/Run</strong> — 4 kms OR 45 mins</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>Weightlifting / Gym Workout</strong> — 45 mins</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>Yoga/Pilates/Zumba</strong> — 45 mins</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>Cycling</strong> — 10 kms or 45 mins</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>Swimming</strong> — 45 mins</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>Racket Sports</strong> (Badminton, Tennis, Pickle Ball etc.) — 45 mins</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>Steps</strong> — 10,000 steps in a day</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span><strong>Golf</strong> — 9 hole game (8000+ steps)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Workout Rules */}
      <Card className="bg-white shadow-md mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-rfl-navy">Workout Session Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
            <div>
              <strong>Accepted:</strong> A single continuous session of at least 45 minutes, completed within 60 minutes. 
              Different activities can be combined (e.g., 20 min run + 25 min weights) as long as they are tracked as one workout.
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <X className="w-5 h-5 text-red-500 mt-0.5" />
            <div>
              <strong>Not Accepted:</strong> Splitting time into separate sessions (e.g., 25 min in the morning + 20 min in the evening) 
              — the full 45 minutes must be done in one session.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Scoring System */}
      <Card className="bg-white shadow-md mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-rfl-navy">Scoring System</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rfl-light-blue" />
              <span><strong>Workout Submission:</strong> Post your approved workout with screenshot in your Team's group by 11:49pm. Your captain/VC will send them all to Governors in provided format.</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span><strong>Point Earning:</strong> 1 point per member per day for completing an approved workout.</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-rfl-coral" />
              <span><strong>Point Cap:</strong> Each participant can earn a maximum of 1 point per day.</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-green-500" />
              <span><strong>Daily Workout Weightage:</strong> 90% team points from daily workouts.</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-rfl-coral" />
              <span><strong>Bonus Points:</strong> Earn up to 10% extra points from the Sports tournaments, and staycation fun games.</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span><strong>Winning Condition:</strong> The team with the most points will win.</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-green-500" />
              <span><strong>Fair Play Award:</strong> "RFL FAIR PLAY" award to celebrate sportsmanship and trust in reporting and respect for RFL spirit!</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rfl-light-blue" />
              <span><strong>Leaderboards:</strong> Team and individual leaderboards will be published regularly in the group.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rest Days */}
      <Card className="bg-white shadow-md mb-8">
        <CardHeader>
          <CardTitle className="text-xl text-rfl-navy">Rest Days</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-rfl-coral" />
              <span>Each participant is allowed <strong>18 rest days</strong> during the challenge.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>To claim a rest day, the participant must post <strong>"Rest Day"</strong> on the group for that day.</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span>If posted: <strong>1 point awarded</strong>; If not posted: <strong>0 points</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <X className="w-4 h-4 text-red-500" />
              <span>Once all 18 rest days are used, no points will be awarded for additional rest days.</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-rfl-light-blue" />
              <span>Rest days and workouts are individual and non-transferable to teammates.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Run Rate */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-rfl-navy">Run Rate (RR) System</CardTitle>
          <CardDescription>Encourages longer workouts and acts as a tiebreaker</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span><strong>Purpose:</strong> RR encourages longer workouts. RR measures workout effort above the minimum (RR = 1.0 at the baseline) and is proportional to higher workout efforts.</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-rfl-coral" />
              <span><strong>Points System:</strong> It doesn't add extra points — still 1 point max per player per day.</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-green-500" />
              <span><strong>Tiebreaker:</strong> RR acts as a tiebreaker if teams or individuals finish with equal points (may happen after 90 days).</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-rfl-light-blue" />
              <span><strong>Tracking Start:</strong> RR is tracked only from Week 3 onwards.</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-rfl-coral" />
              <span><strong>Effort vs. Points:</strong> More effort = higher RR ... but remember, get your point first!</span>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-rfl-navy mb-3">RR Examples:</h4>
            <div className="space-y-2 text-sm">
              <div><strong>Workout Duration:</strong> 45 mins workout = RR 1.0 | 60 mins workout = RR 1.33</div>
              <div><strong>Steps:</strong> 10,000 steps = RR 1.0 | 18,000 steps = RR 1.8</div>
              <div><strong>Golf:</strong> Golf 9 holes = RR 1.0 | 18 holes = RR 2.0</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
