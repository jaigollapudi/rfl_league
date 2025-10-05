"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { signIn } from "next-auth/react";

interface Team {
  id: string;
  name: string;
}

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"player" | "leader">("player");
  const [teamId, setTeamId] = useState<string>("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch teams from Supabase
    const fetchTeams = async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name")
        .order("name");
      
      if (error) {
        console.error("Error fetching teams:", error);
        // Fallback to hardcoded teams if DB query fails
        setTeams([
          { id: "gymntonic", name: "Gym n Tonic" },
          { id: "musclemania", name: "Muscle Mania" },
          { id: "absolutes", name: "The ABS-OLUTES" },
          { id: "missionfit", name: "Mission Fitpossible" },
          { id: "corecrusher", name: "Core Crusher" },
        ]);
      } else {
        setTeams(data || []);
      }
    };

    fetchTeams();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { data: existing } = await supabase
      .from("accounts")
      .select("id")
      .eq("first_name", firstName)
      .maybeSingle();
    if (existing) {
      setError("That first name is already taken.");
      return;
    }

    const { error: insertError } = await supabase
      .from("accounts")
      .insert({ first_name: firstName, last_name: lastName, role, team_id: teamId || null });

    if (insertError) {
      setError(insertError.message);
      return;
    }

    // Auto sign-in after sign-up
    const res = await signIn("credentials", {
      firstName,
      lastName,
      redirect: false,
    });
    if (res?.ok) router.push("/dashboard");
  };

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-rfl-navy mb-4">Create your account</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First name (username)</label>
            <input value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last name (password)</label>
            <input type="password" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full border rounded-md px-3 py-2" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="role" checked={role==='player'} onChange={() => setRole('player')} />
                <span>Team Member</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input type="radio" name="role" checked={role==='leader'} onChange={() => setRole('leader')} />
                <span>Team Leader</span>
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Team</label>
            <select value={teamId} onChange={e => setTeamId(e.target.value)} className="w-full border rounded-md px-3 py-2">
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">You can change this later if needed.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" className="w-full bg-rfl-coral text-white rounded-md py-2">Create account</button>
        </form>
        <p className="mt-4 text-sm text-center">
          Already have an account? <a href="/signin" className="text-rfl-navy font-medium">Log in</a>
        </p>
      </div>
    </div>
  );
}


