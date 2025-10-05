import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { date, type, workout_type, duration, distance, steps, holes, team_id } = body;

  // check existing entry
  const { data: existing } = await supabase
    .from("entries")
    .select("id")
    .eq("user_id", session.user.id)
    .eq("date", date)
    .maybeSingle();

  type EntryPayload = {
    user_id: string;
    team_id?: string;
    date: string;
    type: 'workout' | 'rest';
    workout_type?: string;
    duration?: number;
    distance?: number;
    steps?: number;
    holes?: number;
    rr_value?: number;
  };

  const payload: EntryPayload = {
    user_id: session.user.id,
    team_id,
    date,
    type,
    workout_type,
    duration,
    distance,
    steps,
    holes,
  };

  // naive RR calculation client/server parity
  if (type === 'rest') payload.rr_value = 1.0;
  else if (workout_type === 'steps' && steps) payload.rr_value = Math.min(steps / 10000, 2.0);
  else if (workout_type === 'golf' && holes) payload.rr_value = Math.min(holes / 9, 2.0);
  else if (duration) payload.rr_value = Math.min(duration / 45, 2.0);
  else payload.rr_value = 1.0;

  if (existing) {
    const { error } = await supabase.from("entries").update(payload).eq("id", existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabase.from("entries").insert(payload);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, created: true });
}


