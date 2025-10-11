import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (cachedClient) return cachedClient
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase env vars are not set')
  }
  cachedClient = createClient(supabaseUrl, supabaseAnonKey)
  return cachedClient
}

// Database types (will be generated from Supabase later)
export interface User {
  id: string
  name: string
  email: string
  role: 'player' | 'leader'
  team_id: string
  rest_days_used: number
  created_at: string
}

export interface Team {
  id: string
  name: string
  color: string
  leader_id: string
  total_points: number
  created_at: string
}

export interface WorkoutEntry {
  id: string
  user_id: string
  team_id: string
  date: string
  type: 'workout' | 'rest'
  workout_type?: 'walk' | 'gym' | 'yoga' | 'cycling' | 'swimming' | 'racket' | 'steps' | 'golf'
  duration?: number // in minutes
  distance?: number // in km
  steps?: number
  holes?: number // for golf
  rr_value: number
  proof_url?: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

// Helper functions
export const calculateRR = (entry: Partial<WorkoutEntry>): number => {
  if (entry.type === 'rest') return 1.0
  
  // Base RR is 1.0 for minimum requirements
  if (entry.workout_type === 'steps' && entry.steps) {
    return entry.steps >= 10000 ? Math.min(entry.steps / 10000, 2.0) : 0
  }
  
  if (entry.workout_type === 'golf' && entry.holes) {
    return entry.holes >= 9 ? Math.min(entry.holes / 9, 2.0) : 0
  }
  
  if (entry.duration) {
    return entry.duration >= 45 ? Math.min(entry.duration / 45, 2.0) : 0
  }
  
  return 1.0
}
