/**
 * League Report Data Types
 * 
 * These types define the structure of data needed to generate the league report PDF.
 * Initially populated manually via the Generate Report UI; can later be computed from backend.
 */

export interface LeagueReportUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export interface LeagueReportTeam {
  id: string;
  name: string;
  logoUrl: string | null;
}

export interface LeagueReportLeague {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  logoUrl: string | null;
}

export interface LeagueReportPerformance {
  totalActivities: number;
  totalActiveDays: number;
  totalMissedDays: number;
  bestStreak: number;
}

// Final standing options
export type FinalStandingType = 'top_10' | 'top_50' | 'completed';

export interface LeagueReportActivity {
  activityName: string;
  sessionCount: number;
  totalDuration: number | null;  // in minutes
  totalDistance: number | null;  // in km
  totalSteps: number | null;
  totalHoles: number | null;     // for golf
}

export interface LeagueReportRestDays {
  total: number;
  dates: string[]; // Array of YYYY-MM-DD strings (kept for backward compatibility)
}

// Legacy interfaces kept for backward compatibility
export interface LeagueReportPointsBreakdown {
  workouts: number;
  restDays: number;
}

export interface LeagueReportTeamStandings {
  userRankInTeam: number;
}

export interface LeagueReportData {
  // Meta
  generatedAt: string; // ISO date string

  // Core entities
  user: LeagueReportUser;
  team: LeagueReportTeam | null;
  league: LeagueReportLeague;

  // Stats
  performance: LeagueReportPerformance;
  averageRR: number;
  finalIndividualScore: number; // Total points

  // Legacy fields (kept for backward compatibility)
  pointsBreakdown: LeagueReportPointsBreakdown;
  teamStandings: LeagueReportTeamStandings;

  // Final standing
  finalStanding: FinalStandingType;

  // Details
  activities: LeagueReportActivity[];
  restDays: LeagueReportRestDays;
}

/**
 * Creates a default/empty LeagueReportData object for the manual form
 */
export function createDefaultReportData(): LeagueReportData {
  return {
    generatedAt: new Date().toISOString(),
    user: {
      id: '',
      username: '',
      firstName: '',
      lastName: '',
    },
    team: {
      id: '',
      name: '',
      logoUrl: null,
    },
    league: {
      id: 'pfl-2025',
      name: 'PFL',
      startDate: '2025-10-25',
      endDate: '2026-01-22',
      logoUrl: '/img/PFL_Logo.jpeg',
    },
    performance: {
      totalActivities: 0,
      totalActiveDays: 0,
      totalMissedDays: 0,
      bestStreak: 0,
    },
    averageRR: 1.0,
    finalIndividualScore: 0,
    // Legacy fields with defaults
    pointsBreakdown: {
      workouts: 0,
      restDays: 0,
    },
    teamStandings: {
      userRankInTeam: 1,
    },
    finalStanding: 'completed',
    activities: [],
    restDays: {
      total: 0,
      dates: [],
    },
  };
}

/**
 * List of available team logos in public/img folder
 */
export const TEAM_LOGOS: { name: string; logoPath: string }[] = [
  { name: 'Amigos', logoPath: '/img/Amigos_Logo.jpeg' },
  { name: 'Frolic Fetizens', logoPath: '/img/Frolic_Fetizens_Logo.jpeg' },
  { name: 'Gladiators', logoPath: '/img/Gladiators_Logo.jpeg' },
  { name: 'Interstellar', logoPath: '/img/Interstellar_Logo.jpeg' },
  { name: 'PFL', logoPath: '/img/PFL_Logo.jpeg' },
  { name: 'Pristine Chargers', logoPath: '/img/Pristine_Chargers_Logo.jpeg' },
  { name: 'Pristine Garudas', logoPath: '/img/Pristine_Garudas_Logo.jpeg' },
  { name: 'Pristine Panthers', logoPath: '/img/Pristine_Panthers_Logo.jpeg' },
  { name: 'Pristine Titans', logoPath: '/img/Pristine_Titans_Logo.jpeg' },
];

/**
 * Activity type options for the form
 */
export const ACTIVITY_TYPES = [
  'Badminton/Pickleball',
  'Basketball/Cricket',
  'Cycling',
  'Gym',
  'Meditation',
  'Run',
  'Steps',
  'Swimming',
  'Yoga',
];
