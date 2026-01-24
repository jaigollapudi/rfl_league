/**
 * Static Team Data for Emergency Mode
 * 
 * This file contains hardcoded team and member data for the grand finale.
 * Data was generated from SQL queries on Jan 22, 2026.
 * 
 * Used by: /team page (My Team)
 */

export interface StaticTeamSummary {
  team_id: string;
  team_name: string;
  member_count: number;
  scale_factor: number;
  raw_team_points: number;
  scaled_team_points: number;
  team_avg_rr: number;
  total_rest_days: number;
  total_missed_days: number;
}

export interface StaticMemberData {
  team_id: string;
  team_name: string;
  user_id: string;
  username: string;
  full_name: string;
  total_points: number;
  total_rest_days: number;
  total_missed_days: number;
  avg_rr: number;
}

// Team Summary Data
export const STATIC_TEAM_SUMMARIES: StaticTeamSummary[] = [
  {
    team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81",
    team_name: "Frolic Fetizens",
    member_count: 12,
    scale_factor: 1.0,
    raw_team_points: 1080,
    scaled_team_points: 1080,
    team_avg_rr: 1.52,
    total_rest_days: 153,
    total_missed_days: 0,
  },
  {
    team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269",
    team_name: "Pristine Garudas",
    member_count: 12,
    scale_factor: 1.0,
    raw_team_points: 1080,
    scaled_team_points: 1080,
    team_avg_rr: 1.57,
    total_rest_days: 122,
    total_missed_days: 0,
  },
  {
    team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b",
    team_name: "Pristine Chargers",
    member_count: 12,
    scale_factor: 1.0,
    raw_team_points: 1080,
    scaled_team_points: 1080,
    team_avg_rr: 1.57,
    total_rest_days: 128,
    total_missed_days: 0,
  },
  {
    team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41",
    team_name: "Gladiators",
    member_count: 12,
    scale_factor: 1.0,
    raw_team_points: 1080,
    scaled_team_points: 1080,
    team_avg_rr: 1.74,
    total_rest_days: 65,
    total_missed_days: 0,
  },
  {
    team_id: "d843f822-a285-4481-9367-267ce5f52cbc",
    team_name: "Pristine Panthers",
    member_count: 12,
    scale_factor: 1.0,
    raw_team_points: 1080,
    scaled_team_points: 1080,
    team_avg_rr: 1.51,
    total_rest_days: 153,
    total_missed_days: 0,
  },
  {
    team_id: "7059747a-d1b8-479c-aff2-6a6a79c88998",
    team_name: "Interstellar",
    member_count: 11,
    scale_factor: 1.0909,
    raw_team_points: 990,
    scaled_team_points: 1080,
    team_avg_rr: 1.51,
    total_rest_days: 141,
    total_missed_days: 0,
  },
  {
    team_id: "23dd4d39-f1cc-42f8-b15f-11a60ba042eb",
    team_name: "Pristine Titans",
    member_count: 11,
    scale_factor: 1.0909,
    raw_team_points: 990,
    scaled_team_points: 1080,
    team_avg_rr: 1.77,
    total_rest_days: 75,
    total_missed_days: 0,
  },
  {
    team_id: "b170818a-b51e-4fa9-89b1-f9c08a0f6d44",
    team_name: "Amigos",
    member_count: 10,
    scale_factor: 1.2,
    raw_team_points: 898,
    scaled_team_points: 1077.6,
    team_avg_rr: 1.42,
    total_rest_days: 104,
    total_missed_days: 2,
  },
];

// Member Data (all teams)
export const STATIC_MEMBERS: StaticMemberData[] = [
  // Amigos
  { team_id: "b170818a-b51e-4fa9-89b1-f9c08a0f6d44", team_name: "Amigos", user_id: "ec52b680-0565-4a00-ae56-01c15c2d271f", username: "arija", full_name: "Arija Buddineni", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.48 },
  { team_id: "b170818a-b51e-4fa9-89b1-f9c08a0f6d44", team_name: "Amigos", user_id: "4995fbe8-064e-4ec7-b60b-2378a355566a", username: "divya", full_name: "Divya Nair", total_points: 90, total_rest_days: 1, total_missed_days: 0, avg_rr: 1.34 },
  { team_id: "b170818a-b51e-4fa9-89b1-f9c08a0f6d44", team_name: "Amigos", user_id: "4c64ab7f-0413-4ec0-84d3-d3949b8615d5", username: "neelimav", full_name: "Neelima Vodela", total_points: 90, total_rest_days: 9, total_missed_days: 0, avg_rr: 1.28 },
  { team_id: "b170818a-b51e-4fa9-89b1-f9c08a0f6d44", team_name: "Amigos", user_id: "d176f20d-4a27-484c-afb2-b7e99534c4e5", username: "praveena", full_name: "Praveena Katta", total_points: 90, total_rest_days: 0, total_missed_days: 0, avg_rr: 1.92 },
  { team_id: "b170818a-b51e-4fa9-89b1-f9c08a0f6d44", team_name: "Amigos", user_id: "46ec4c6c-6bf9-434a-925d-f13e5f7ec7bb", username: "priya", full_name: "Priya Darshini", total_points: 90, total_rest_days: 2, total_missed_days: 0, avg_rr: 1.92 },
  { team_id: "b170818a-b51e-4fa9-89b1-f9c08a0f6d44", team_name: "Amigos", user_id: "996686eb-20b0-4005-a75c-6c495a0b6a0e", username: "ramesh", full_name: "Ramesh Veeramalla", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.38 },
  { team_id: "b170818a-b51e-4fa9-89b1-f9c08a0f6d44", team_name: "Amigos", user_id: "c6575098-a088-4b4d-863c-94253ecbac03", username: "srinivasa", full_name: "Srinivasa Rao Marni", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.11 },
  { team_id: "b170818a-b51e-4fa9-89b1-f9c08a0f6d44", team_name: "Amigos", user_id: "be73b903-2a72-46a6-9345-069bc59ea9d7", username: "srinivasg", full_name: "Srinivas Gunturu", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.35 },
  { team_id: "b170818a-b51e-4fa9-89b1-f9c08a0f6d44", team_name: "Amigos", user_id: "4db8590f-58e1-492e-9821-820bc46c5a0b", username: "syama", full_name: "Syama Sunkara", total_points: 90, total_rest_days: 2, total_missed_days: 0, avg_rr: 1.26 },
  { team_id: "b170818a-b51e-4fa9-89b1-f9c08a0f6d44", team_name: "Amigos", user_id: "c58a1d07-3424-447e-bb99-0fce52e81efe", username: "vishal", full_name: "Vishal Yettapu", total_points: 88, total_rest_days: 18, total_missed_days: 2, avg_rr: 1.13 },
  
  // Frolic Fetizens
  { team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81", team_name: "Frolic Fetizens", user_id: "fd9a8815-143f-4df5-b689-dc67969ee1bf", username: "aashwij", full_name: "Aashwij Ravula", total_points: 90, total_rest_days: 16, total_missed_days: 0, avg_rr: 1.35 },
  { team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81", team_name: "Frolic Fetizens", user_id: "58ebc175-1cfd-4d64-8ed1-57c1392a25d7", username: "ajay", full_name: "Ajay Polkampally", total_points: 90, total_rest_days: 1, total_missed_days: 0, avg_rr: 1.91 },
  { team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81", team_name: "Frolic Fetizens", user_id: "90deadfb-f27e-456b-9fa3-05d738e3ab05", username: "harsha", full_name: "Harsha Vardhan reddy Billa", total_points: 90, total_rest_days: 15, total_missed_days: 0, avg_rr: 1.68 },
  { team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81", team_name: "Frolic Fetizens", user_id: "6e3c42cf-069e-4a0f-8f19-5a72d4954c27", username: "laxmi", full_name: "Laxmi Katta", total_points: 90, total_rest_days: 13, total_missed_days: 0, avg_rr: 1.29 },
  { team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81", team_name: "Frolic Fetizens", user_id: "1573b681-18ad-4db6-85a7-f5ca92e0ea15", username: "neelimad", full_name: "Neelima Dasiga", total_points: 90, total_rest_days: 3, total_missed_days: 0, avg_rr: 1.95 },
  { team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81", team_name: "Frolic Fetizens", user_id: "80ca5ed5-39ee-4e87-8a6b-45d72fd4734a", username: "nihanthri", full_name: "Nihanthri Chinamaneni", total_points: 90, total_rest_days: 10, total_missed_days: 0, avg_rr: 1.77 },
  { team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81", team_name: "Frolic Fetizens", user_id: "1f7dba96-5ca0-4a70-9a58-2c5275a524fb", username: "rajashekar", full_name: "Rajashekar Vodela", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.22 },
  { team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81", team_name: "Frolic Fetizens", user_id: "647cdfeb-ea58-4778-8a08-ad45bf88a540", username: "rajesh", full_name: "Rajesh Raju", total_points: 90, total_rest_days: 16, total_missed_days: 0, avg_rr: 1.47 },
  { team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81", team_name: "Frolic Fetizens", user_id: "42009f6d-730f-4b30-b3a3-bba95a18028e", username: "saisrijith", full_name: "Saisrijith Maramreddy", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.58 },
  { team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81", team_name: "Frolic Fetizens", user_id: "035a891b-152e-4116-b0da-7b0e1b0f3cd5", username: "vasudha", full_name: "Vasudha Bommireddy", total_points: 90, total_rest_days: 15, total_missed_days: 0, avg_rr: 1.18 },
  { team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81", team_name: "Frolic Fetizens", user_id: "087b2993-0497-4633-9d74-4381a98041e0", username: "venkata", full_name: "Venkata Ramana Sripada", total_points: 90, total_rest_days: 17, total_missed_days: 0, avg_rr: 1.32 },
  { team_id: "dbecc2c2-6184-4692-a0f7-693adeae0b81", team_name: "Frolic Fetizens", user_id: "2dcfcc38-83eb-47c0-ab3a-71fb12493bf4", username: "vihaan", full_name: "Vihaan Chennamaneni", total_points: 90, total_rest_days: 11, total_missed_days: 0, avg_rr: 1.55 },
  
  // Gladiators
  { team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41", team_name: "Gladiators", user_id: "1f606965-5f8a-40e0-9374-1a1d8281fe81", username: "kirthi", full_name: "Kirthi Ponnala", total_points: 90, total_rest_days: 4, total_missed_days: 0, avg_rr: 1.58 },
  { team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41", team_name: "Gladiators", user_id: "41809a64-06a1-417b-9404-25fa5a7af07c", username: "neelimab", full_name: "Neelima Billa", total_points: 90, total_rest_days: 4, total_missed_days: 0, avg_rr: 1.87 },
  { team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41", team_name: "Gladiators", user_id: "63f7f5bc-3d6d-4272-965b-d8b7f54efbe4", username: "radhika", full_name: "Radhika Mamidi", total_points: 90, total_rest_days: 6, total_missed_days: 0, avg_rr: 1.78 },
  { team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41", team_name: "Gladiators", user_id: "147e474b-eb51-4845-8c82-4f79840d955b", username: "rameshk", full_name: "Ramesh Kari", total_points: 90, total_rest_days: 12, total_missed_days: 0, avg_rr: 1.28 },
  { team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41", team_name: "Gladiators", user_id: "b268769e-76cf-484f-b4b0-57b608db1ed6", username: "ridhimaa", full_name: "Ridhima Adusumilli", total_points: 90, total_rest_days: 3, total_missed_days: 0, avg_rr: 1.74 },
  { team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41", team_name: "Gladiators", user_id: "46d991c2-60ca-439e-b505-be3604e4b389", username: "samarth", full_name: "Samarth Gandra", total_points: 90, total_rest_days: 1, total_missed_days: 0, avg_rr: 1.99 },
  { team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41", team_name: "Gladiators", user_id: "69071033-fa28-40f3-b325-9080e2ad6c87", username: "samhitha", full_name: "Samhitha Regulapati", total_points: 90, total_rest_days: 11, total_missed_days: 0, avg_rr: 1.30 },
  { team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41", team_name: "Gladiators", user_id: "c73f787f-dee0-4a45-bac4-219eca75797e", username: "savithrir", full_name: "Savithri Raju", total_points: 90, total_rest_days: 6, total_missed_days: 0, avg_rr: 1.86 },
  { team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41", team_name: "Gladiators", user_id: "6172df71-e206-4c37-bfb1-645bf1588252", username: "sirish", full_name: "Sirish Ravula", total_points: 90, total_rest_days: 6, total_missed_days: 0, avg_rr: 1.90 },
  { team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41", team_name: "Gladiators", user_id: "a9353a36-56a0-43af-81ce-fd34cdc0abc9", username: "sitaram", full_name: "Sitaram Katta", total_points: 90, total_rest_days: 12, total_missed_days: 0, avg_rr: 1.55 },
  { team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41", team_name: "Gladiators", user_id: "5f0a73a3-4657-42a8-88a1-5cc1a4f63c57", username: "suman", full_name: "Suman Rao Gujja", total_points: 90, total_rest_days: 0, total_missed_days: 0, avg_rr: 2.00 },
  { team_id: "ab6f723b-ecbb-436e-ba12-77458e89bc41", team_name: "Gladiators", user_id: "ce31e10d-218d-411c-9af8-281811678b95", username: "vijay", full_name: "Vijay Rangineni", total_points: 90, total_rest_days: 0, total_missed_days: 0, avg_rr: 2.00 },
  
  // Interstellar
  { team_id: "7059747a-d1b8-479c-aff2-6a6a79c88998", team_name: "Interstellar", user_id: "2a95637e-bf76-41e1-be48-09a789cb2f7c", username: "akshay", full_name: "Akshay Yettapu", total_points: 90, total_rest_days: 14, total_missed_days: 0, avg_rr: 1.72 },
  { team_id: "7059747a-d1b8-479c-aff2-6a6a79c88998", team_name: "Interstellar", user_id: "fc56101b-a386-4e15-bb0a-1f7cc4d80b51", username: "chakradhar", full_name: "Chakradhar Reddy", total_points: 90, total_rest_days: 13, total_missed_days: 0, avg_rr: 1.09 },
  { team_id: "7059747a-d1b8-479c-aff2-6a6a79c88998", team_name: "Interstellar", user_id: "56a33ea4-6347-432b-a66f-999dea75b18d", username: "haritha", full_name: "Haritha Ravula", total_points: 90, total_rest_days: 0, total_missed_days: 0, avg_rr: 1.67 },
  { team_id: "7059747a-d1b8-479c-aff2-6a6a79c88998", team_name: "Interstellar", user_id: "cf01744b-405c-4928-be93-e61c80772bb1", username: "nagamani", full_name: "Nagamani Reddy", total_points: 90, total_rest_days: 17, total_missed_days: 0, avg_rr: 1.20 },
  { team_id: "7059747a-d1b8-479c-aff2-6a6a79c88998", team_name: "Interstellar", user_id: "17ac5121-573b-477c-9101-f467efa591ec", username: "prathik", full_name: "Prathik Gunturu", total_points: 90, total_rest_days: 19, total_missed_days: 0, avg_rr: 1.15 },
  { team_id: "7059747a-d1b8-479c-aff2-6a6a79c88998", team_name: "Interstellar", user_id: "b3254cc1-618b-490c-ae5b-378d210e7bac", username: "praveen", full_name: "Praveen Ilinani", total_points: 90, total_rest_days: 14, total_missed_days: 0, avg_rr: 1.63 },
  { team_id: "7059747a-d1b8-479c-aff2-6a6a79c88998", team_name: "Interstellar", user_id: "8d911865-97ff-4f56-af3b-20811cf7b4e8", username: "ridhima", full_name: "Ridhima Veeramalla", total_points: 90, total_rest_days: 16, total_missed_days: 0, avg_rr: 1.52 },
  { team_id: "7059747a-d1b8-479c-aff2-6a6a79c88998", team_name: "Interstellar", user_id: "32af9481-58cb-4158-9341-7b92c099acdf", username: "sahith", full_name: "Sahith Marni", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.28 },
  { team_id: "7059747a-d1b8-479c-aff2-6a6a79c88998", team_name: "Interstellar", user_id: "82c8c76e-be2a-4491-baca-2179651b02f5", username: "sridharm", full_name: "Sridhar Maramreddy", total_points: 90, total_rest_days: 12, total_missed_days: 0, avg_rr: 1.84 },
  { team_id: "7059747a-d1b8-479c-aff2-6a6a79c88998", team_name: "Interstellar", user_id: "8cfa25a0-111f-4138-b750-91c49e078da4", username: "sridharv", full_name: "Sridhar Vennamaneni", total_points: 90, total_rest_days: 0, total_missed_days: 0, avg_rr: 1.98 },
  { team_id: "7059747a-d1b8-479c-aff2-6a6a79c88998", team_name: "Interstellar", user_id: "d436534f-64df-4c22-976e-b97d8cd921eb", username: "vinod", full_name: "Vinod Rao", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.51 },
  
  // Pristine Chargers
  { team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b", team_name: "Pristine Chargers", user_id: "c4d879aa-7d3a-47df-8702-188eb5943a66", username: "aakriti", full_name: "Aakriti Penukonda", total_points: 90, total_rest_days: 8, total_missed_days: 0, avg_rr: 1.53 },
  { team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b", team_name: "Pristine Chargers", user_id: "ceebb726-de95-4f7f-b8c8-84586d6450a0", username: "amartya", full_name: "Amartya Ilinani", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.47 },
  { team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b", team_name: "Pristine Chargers", user_id: "106ba1e2-8703-42a8-91f9-91ab1d8f9f95", username: "deepika", full_name: "Deepika Ilinani", total_points: 90, total_rest_days: 6, total_missed_days: 0, avg_rr: 1.90 },
  { team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b", team_name: "Pristine Chargers", user_id: "c660acc8-7308-4d3a-ba6e-c223e8530e63", username: "deepthi", full_name: "Deepthi Gujja", total_points: 90, total_rest_days: 1, total_missed_days: 0, avg_rr: 1.96 },
  { team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b", team_name: "Pristine Chargers", user_id: "0a7e2702-e12d-4106-8ce0-9ca057959e4d", username: "kavitha", full_name: "Kavitha Gunturu", total_points: 90, total_rest_days: 16, total_missed_days: 0, avg_rr: 1.38 },
  { team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b", team_name: "Pristine Chargers", user_id: "538b0626-3a94-4239-9a46-bd2969c178eb", username: "murali", full_name: "Murali Krish", total_points: 90, total_rest_days: 0, total_missed_days: 0, avg_rr: 1.45 },
  { team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b", team_name: "Pristine Chargers", user_id: "28c8ccaf-4a4d-449c-8b33-0ab564c1883f", username: "sanjana", full_name: "Sanjana Marni", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.27 },
  { team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b", team_name: "Pristine Chargers", user_id: "1b1fe1c1-cc26-4902-8a88-1c2e351ba9b6", username: "sarita", full_name: "Sarita Kadaveru", total_points: 90, total_rest_days: 16, total_missed_days: 0, avg_rr: 1.34 },
  { team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b", team_name: "Pristine Chargers", user_id: "770bf98e-fb94-405a-b747-db72915d806e", username: "savithri", full_name: "Savithri Venepalli", total_points: 90, total_rest_days: 4, total_missed_days: 0, avg_rr: 1.84 },
  { team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b", team_name: "Pristine Chargers", user_id: "d6b95000-14fe-4f86-9605-7baabfe5f722", username: "srinikhith", full_name: "Sri Nikhith Maram reddy", total_points: 90, total_rest_days: 16, total_missed_days: 0, avg_rr: 1.66 },
  { team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b", team_name: "Pristine Chargers", user_id: "90c5365a-1163-4a7d-b1c4-c6ae71d9a9b7", username: "srinivasm", full_name: "Srinivas Mamidi", total_points: 90, total_rest_days: 14, total_missed_days: 0, avg_rr: 1.35 },
  { team_id: "534a95a0-1359-4cd4-93b0-95ae9e86974b", team_name: "Pristine Chargers", user_id: "23657655-0ea1-4bdb-8f76-6d859f9699b8", username: "vivek", full_name: "Vivek Chennamaneni", total_points: 90, total_rest_days: 11, total_missed_days: 0, avg_rr: 1.72 },
  
  // Pristine Garudas
  { team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269", team_name: "Pristine Garudas", user_id: "ae684dc1-09fd-416c-a240-1d6a3641e447", username: "ambika", full_name: "Ambika Ravula", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.32 },
  { team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269", team_name: "Pristine Garudas", user_id: "1ad2106e-2461-45a3-80b4-8a19cffd841c", username: "amogh", full_name: "Amogh Katta", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.59 },
  { team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269", team_name: "Pristine Garudas", user_id: "bf5107a4-061f-4358-8615-aad31746d0e2", username: "ayan", full_name: "Ayan Buddineni", total_points: 90, total_rest_days: 1, total_missed_days: 0, avg_rr: 1.80 },
  { team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269", team_name: "Pristine Garudas", user_id: "1a492cda-a6fe-4fbb-9da6-e73492f88e5f", username: "bhargavi", full_name: "Bhargavi Sunkara", total_points: 90, total_rest_days: 2, total_missed_days: 0, avg_rr: 1.95 },
  { team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269", team_name: "Pristine Garudas", user_id: "ba7eb7a9-d25c-4966-9761-36470485c3dd", username: "charitha", full_name: "Charitha Venepalli", total_points: 90, total_rest_days: 13, total_missed_days: 0, avg_rr: 1.56 },
  { team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269", team_name: "Pristine Garudas", user_id: "e51571b5-01f0-418f-8cd3-6b9a8f3a3853", username: "dasiga", full_name: "Dasiga Savithri", total_points: 90, total_rest_days: 0, total_missed_days: 0, avg_rr: 1.97 },
  { team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269", team_name: "Pristine Garudas", user_id: "58488726-2e47-44d7-a775-f97270d491e4", username: "jp", full_name: "JP Buddineni", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.39 },
  { team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269", team_name: "Pristine Garudas", user_id: "bfb249cd-c8ec-4168-8f06-e27529177315", username: "madhavi", full_name: "Madhavi Boinapalli", total_points: 90, total_rest_days: 12, total_missed_days: 0, avg_rr: 1.19 },
  { team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269", team_name: "Pristine Garudas", user_id: "b25dfcd9-f36b-4757-ac31-1c828842c287", username: "ramu", full_name: "Ramu Chennadi", total_points: 90, total_rest_days: 16, total_missed_days: 0, avg_rr: 1.69 },
  { team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269", team_name: "Pristine Garudas", user_id: "3a5ddc99-fe1f-4d0e-a1bb-e89054125e1f", username: "siddharth", full_name: "Siddharth Sharma", total_points: 90, total_rest_days: 5, total_missed_days: 0, avg_rr: 1.47 },
  { team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269", team_name: "Pristine Garudas", user_id: "e8e16a2d-98b4-4b1e-837c-2fba3ff8c7f9", username: "sumathi", full_name: "Sumathi Rangineni", total_points: 90, total_rest_days: 7, total_missed_days: 0, avg_rr: 1.55 },
  { team_id: "4d2a1f79-9af6-4d4f-b733-85d69a6a7269", team_name: "Pristine Garudas", user_id: "9265ed43-f5af-48db-bdd1-b9f0efa91585", username: "suresh", full_name: "Suresh Raju", total_points: 90, total_rest_days: 12, total_missed_days: 0, avg_rr: 1.35 },
  
  // Pristine Panthers
  { team_id: "d843f822-a285-4481-9367-267ce5f52cbc", team_name: "Pristine Panthers", user_id: "d108131e-1fa2-4e3a-a60b-e1a533f18731", username: "aditya", full_name: "Aditya Ilinani", total_points: 90, total_rest_days: 17, total_missed_days: 0, avg_rr: 1.48 },
  { team_id: "d843f822-a285-4481-9367-267ce5f52cbc", team_name: "Pristine Panthers", user_id: "94ae7e51-7c1a-40cf-a328-246770e1e5ca", username: "ananth", full_name: "Ananth Rao", total_points: 90, total_rest_days: 15, total_missed_days: 0, avg_rr: 1.44 },
  { team_id: "d843f822-a285-4481-9367-267ce5f52cbc", team_name: "Pristine Panthers", user_id: "e0c323ba-e173-4e55-b8d5-a29c9ba5dc48", username: "deepa", full_name: "Deepa Bhupathiraju", total_points: 90, total_rest_days: 12, total_missed_days: 0, avg_rr: 1.62 },
  { team_id: "d843f822-a285-4481-9367-267ce5f52cbc", team_name: "Pristine Panthers", user_id: "6b3451b8-78ba-4221-8746-445ccb8d6fc0", username: "dinesh", full_name: "Dinesh Chirla", total_points: 90, total_rest_days: 14, total_missed_days: 0, avg_rr: 1.46 },
  { team_id: "d843f822-a285-4481-9367-267ce5f52cbc", team_name: "Pristine Panthers", user_id: "fa042349-6e1a-446b-9f08-6752eeda9f45", username: "harshini", full_name: "Harshini Errabelli", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.28 },
  { team_id: "d843f822-a285-4481-9367-267ce5f52cbc", team_name: "Pristine Panthers", user_id: "e49249af-b468-446f-bb5d-94fed8cd8263", username: "madhavim", full_name: "Madhavi Marni", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.10 },
  { team_id: "d843f822-a285-4481-9367-267ce5f52cbc", team_name: "Pristine Panthers", user_id: "5286a6a7-dffd-444c-a82c-8d440be99163", username: "pramod", full_name: "Pramod Gandra", total_points: 90, total_rest_days: 10, total_missed_days: 0, avg_rr: 1.27 },
  { team_id: "d843f822-a285-4481-9367-267ce5f52cbc", team_name: "Pristine Panthers", user_id: "84084c97-f8f7-4935-96f4-77a1cbcf38d5", username: "richa", full_name: "Richa Buddineni", total_points: 90, total_rest_days: 11, total_missed_days: 0, avg_rr: 1.64 },
  { team_id: "d843f822-a285-4481-9367-267ce5f52cbc", team_name: "Pristine Panthers", user_id: "837d2cde-0d15-4dff-b0a9-1295e9d0286f", username: "srinidhi", full_name: "Sri Nidhi Gandra", total_points: 90, total_rest_days: 18, total_missed_days: 0, avg_rr: 1.39 },
  { team_id: "d843f822-a285-4481-9367-267ce5f52cbc", team_name: "Pristine Panthers", user_id: "8d63be1b-9804-44a5-a4ef-c485685938e4", username: "swapna", full_name: "Swapna Kanameni", total_points: 90, total_rest_days: 1, total_missed_days: 0, avg_rr: 1.86 },
  { team_id: "d843f822-a285-4481-9367-267ce5f52cbc", team_name: "Pristine Panthers", user_id: "38a588dc-67da-4528-9a63-153e6b22e2dd", username: "uma", full_name: "Uma Ailinani", total_points: 90, total_rest_days: 4, total_missed_days: 0, avg_rr: 1.85 },
  { team_id: "d843f822-a285-4481-9367-267ce5f52cbc", team_name: "Pristine Panthers", user_id: "49f42242-28e4-494a-aba6-65236f4129f8", username: "vinaya", full_name: "Vinaya Chennamaneni", total_points: 90, total_rest_days: 15, total_missed_days: 0, avg_rr: 1.75 },
  
  // Pristine Titans
  { team_id: "23dd4d39-f1cc-42f8-b15f-11a60ba042eb", team_name: "Pristine Titans", user_id: "9abb2ac2-6cec-472b-a7b4-4723b4535dc1", username: "adviteeya", full_name: "Adviteeya Ilinani", total_points: 90, total_rest_days: 14, total_missed_days: 0, avg_rr: 1.80 },
  { team_id: "23dd4d39-f1cc-42f8-b15f-11a60ba042eb", team_name: "Pristine Titans", user_id: "c7a2f49a-c5a7-484d-a358-e19ce118126d", username: "akhileshwar", full_name: "Akhileshwar Kanameni", total_points: 90, total_rest_days: 3, total_missed_days: 0, avg_rr: 1.94 },
  { team_id: "23dd4d39-f1cc-42f8-b15f-11a60ba042eb", team_name: "Pristine Titans", user_id: "a180f9bb-8f20-420d-99ba-a4b626c8dc1e", username: "harsh", full_name: "Harsh Gandra", total_points: 90, total_rest_days: 3, total_missed_days: 0, avg_rr: 1.96 },
  { team_id: "23dd4d39-f1cc-42f8-b15f-11a60ba042eb", team_name: "Pristine Titans", user_id: "208930ab-b6c2-49f2-b424-19dcc44560ac", username: "mounija", full_name: "Mounija Maramreddy", total_points: 90, total_rest_days: 3, total_missed_days: 0, avg_rr: 1.94 },
  { team_id: "23dd4d39-f1cc-42f8-b15f-11a60ba042eb", team_name: "Pristine Titans", user_id: "413ec648-7af9-4207-8f2e-7f615fd572e4", username: "pavan", full_name: "Pavan Gandra", total_points: 90, total_rest_days: 8, total_missed_days: 0, avg_rr: 1.62 },
  { team_id: "23dd4d39-f1cc-42f8-b15f-11a60ba042eb", team_name: "Pristine Titans", user_id: "67049ade-d6de-447a-b7a3-114b58b5cd64", username: "prateek", full_name: "Prateek Boianapalli", total_points: 90, total_rest_days: 2, total_missed_days: 0, avg_rr: 1.82 },
  { team_id: "23dd4d39-f1cc-42f8-b15f-11a60ba042eb", team_name: "Pristine Titans", user_id: "9c91c804-9aac-4b34-9bb4-42227ed5c38c", username: "sanvisree", full_name: "Sanvi Gujja", total_points: 90, total_rest_days: 16, total_missed_days: 0, avg_rr: 1.66 },
  { team_id: "23dd4d39-f1cc-42f8-b15f-11a60ba042eb", team_name: "Pristine Titans", user_id: "3c1f230e-c2f6-454a-9d49-e0bb5dee4777", username: "sarala", full_name: "Sarala Kadaveru", total_points: 90, total_rest_days: 9, total_missed_days: 0, avg_rr: 1.84 },
  { team_id: "23dd4d39-f1cc-42f8-b15f-11a60ba042eb", team_name: "Pristine Titans", user_id: "a4aec546-ca16-48e0-bc46-d7390ecd55d5", username: "satya", full_name: "Satya Bommireddy", total_points: 90, total_rest_days: 8, total_missed_days: 0, avg_rr: 1.19 },
  { team_id: "23dd4d39-f1cc-42f8-b15f-11a60ba042eb", team_name: "Pristine Titans", user_id: "b6b9547a-9546-444b-9ea1-636ab41006ff", username: "sridevi", full_name: "Sridevi Boyapally", total_points: 90, total_rest_days: 3, total_missed_days: 0, avg_rr: 1.96 },
  { team_id: "23dd4d39-f1cc-42f8-b15f-11a60ba042eb", team_name: "Pristine Titans", user_id: "7f7cba69-812e-4e06-9b62-d74d91d3acaa", username: "sridhary", full_name: "Sridhar Yettapu", total_points: 90, total_rest_days: 6, total_missed_days: 0, avg_rr: 1.73 },
];

// Helper functions
export function getTeamSummary(teamId: string): StaticTeamSummary | undefined {
  return STATIC_TEAM_SUMMARIES.find(t => t.team_id === teamId);
}

export function getTeamMembers(teamId: string): StaticMemberData[] {
  return STATIC_MEMBERS
    .filter(m => m.team_id === teamId)
    .sort((a, b) => b.total_points - a.total_points || b.avg_rr - a.avg_rr);
}

export function getMemberByUserId(userId: string): StaticMemberData | undefined {
  return STATIC_MEMBERS.find(m => m.user_id === userId);
}

