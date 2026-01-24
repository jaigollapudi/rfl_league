"""
Player Report Data Generator
Run this in Jupyter notebooks to extract all fields needed for a player's PFL Summary Report.

Usage:
1. Update the file paths to point to your downloaded CSV files
2. Run all cells
3. Call get_player_report(user_id) with any user_id from the team
"""

import pandas as pd
from typing import Optional

# =============================================================================
# STEP 1: UPDATE THESE FILE PATHS TO YOUR DOWNLOADED CSVs
# =============================================================================

# File paths - update these to match your downloads location
FILE_PATHS = {
    "rest_days": "/Users/jaigollapudi/Downloads/Supabase Snippet Team Members' Approved Rest Days.csv",
    "workout_activity": "/Users/jaigollapudi/Downloads/Supabase Snippet Team Member Workout Activity Summary.csv",
    "leaderboard": "/Users/jaigollapudi/Downloads/Supabase Snippet Team leaderboard by points and average RR.csv",
    "percentile": "/Users/jaigollapudi/Downloads/Supabase Snippet Team Leaderboard with Percentile Tiers.csv",
    "streaks": "/Users/jaigollapudi/Downloads/Supabase Snippet Team members' longest approved workout streaks.csv",
    "missed_days": "/Users/jaigollapudi/Downloads/Supabase Snippet Team Member Missed-Days Report.csv",
    "activity_summary": "/Users/jaigollapudi/Downloads/Supabase Snippet Team Member Activity Summary.csv",
}

# =============================================================================
# STEP 2: LOAD ALL DATA
# =============================================================================

def load_data():
    """Load all CSV files into dataframes"""
    data = {}
    for key, path in FILE_PATHS.items():
        try:
            data[key] = pd.read_csv(path)
            print(f"✓ Loaded {key}: {len(data[key])} rows")
        except FileNotFoundError:
            print(f"✗ File not found: {path}")
            data[key] = pd.DataFrame()
    return data

# =============================================================================
# STEP 3: HELPER FUNCTIONS
# =============================================================================

def get_user_list(data: dict) -> pd.DataFrame:
    """Get list of all users with their IDs and usernames"""
    df = data["activity_summary"][["user_id", "first_name", "last_name", "username"]].copy()
    df["full_name"] = df["first_name"].str.strip() + " " + df["last_name"].str.strip()
    return df[["user_id", "username", "full_name"]]

def format_individual_standing(standing: str) -> str:
    """Convert DB standing value to display text"""
    mapping = {
        "top_10": "Top 10th Percentile",
        "top_50": "Top 50th Percentile", 
        "completed": "League Completed. Congrats!"
    }
    return mapping.get(standing, "League Completed. Congrats!")

def format_activity_name(activity: str) -> str:
    """Convert DB activity name to display name"""
    mapping = {
        "steps": "Steps",
        "run": "Running",
        "gym": "Gym",
        "yoga": "Yoga",
        "cycling": "Cycling",
        "badminton_pickleball": "Badminton/Pickleball",
        "basketball_cricket": "Basketball/Cricket",
        "swimming": "Swimming",
        "hiking": "Hiking",
        "tennis": "Tennis",
        "dance": "Dance",
        "other": "Other",
        "golf": "Golf",  # keeping for backwards compatibility
        "zumba": "Zumba",  # keeping for backwards compatibility
    }
    return mapping.get(activity, activity.replace("_", " ").title())

# =============================================================================
# STEP 4: MAIN FUNCTION TO GET PLAYER REPORT DATA
# =============================================================================

def get_player_report(user_id: str, data: dict) -> dict:
    """
    Get all report fields for a given user ID.
    
    Args:
        user_id: The UUID of the user
        data: Dictionary of loaded dataframes
        
    Returns:
        Dictionary containing all fields needed for the report
    """
    
    report = {
        "user_info": {},
        "performance_overview": {},
        "points_breakdown": {},
        "individual_standing": {},
        "team_standings": {},
        "activities": [],
        "rest_day_dates": [],
    }
    
    # --- User Info & Basic Stats (from Activity Summary) ---
    activity_summary = data["activity_summary"]
    user_summary = activity_summary[activity_summary["user_id"] == user_id]
    
    if user_summary.empty:
        print(f"⚠️ User ID not found: {user_id}")
        return report
    
    user_row = user_summary.iloc[0]
    report["user_info"] = {
        "username": user_row["username"],
        "first_name": str(user_row["first_name"]).strip(),
        "last_name": str(user_row["last_name"]).strip(),
        "total_points": int(user_row["total_points"]),
        "avg_rr": round(float(user_row["avg_rr"]), 2),
    }
    
    # --- Performance Overview ---
    # Active days and rest days from activity summary
    active_days = int(user_row["active_days"])
    rest_days_count = int(user_row["rest_days"])
    
    # Missed days from missed days report
    missed_days_df = data["missed_days"]
    missed_row = missed_days_df[missed_days_df["user_id"] == user_id]
    missed_days = int(missed_row.iloc[0]["missed_days"]) if not missed_row.empty else 0
    
    # Best streak from streaks file
    streaks_df = data["streaks"]
    streak_row = streaks_df[streaks_df["user_id"] == user_id]
    best_streak = int(streak_row.iloc[0]["best_streak"]) if not streak_row.empty else 0
    
    # Total activities (sum of all session counts)
    workout_df = data["workout_activity"]
    user_workouts = workout_df[workout_df["user_id"] == user_id]
    total_activities = int(user_workouts["session_count"].sum()) if not user_workouts.empty else 0
    
    report["performance_overview"] = {
        "total_activities": total_activities,
        "total_active_days": active_days,
        "total_missed_days": missed_days,
        "best_streak": best_streak,
    }
    
    # --- Points Breakdown ---
    report["points_breakdown"] = {
        "workouts": active_days,  # Each active day = 1 point from workouts
        "rest_days": rest_days_count,  # Rest days count
    }
    
    # --- Individual Standing (Percentile) ---
    percentile_df = data["percentile"]
    percentile_row = percentile_df[percentile_df["user_id"] == user_id]
    if not percentile_row.empty:
        standing = percentile_row.iloc[0]["individual_standing"]
        report["individual_standing"] = {
            "raw_value": standing,
            "display_text": format_individual_standing(standing),
        }
    else:
        report["individual_standing"] = {
            "raw_value": "completed",
            "display_text": "League Completed. Congrats!",
        }
    
    # --- Team Standings (Rank in Team) ---
    leaderboard_df = data["leaderboard"]
    leaderboard_row = leaderboard_df[leaderboard_df["user_id"] == user_id]
    if not leaderboard_row.empty:
        rank = int(leaderboard_row.iloc[0]["user_rank_in_team"])
        # Add ordinal suffix
        if rank % 10 == 1 and rank != 11:
            ordinal = f"{rank}st"
        elif rank % 10 == 2 and rank != 12:
            ordinal = f"{rank}nd"
        elif rank % 10 == 3 and rank != 13:
            ordinal = f"{rank}rd"
        else:
            ordinal = f"{rank}th"
        report["team_standings"] = {
            "user_rank_in_team": rank,
            "user_rank_display": f"{ordinal} Place",
        }
    else:
        report["team_standings"] = {
            "user_rank_in_team": 0,
            "user_rank_display": "N/A",
        }
    
    # --- Activity Details ---
    if not user_workouts.empty:
        for _, row in user_workouts.iterrows():
            activity = {
                "activity_name": format_activity_name(row["activity_name"]),
                "activity_name_raw": row["activity_name"],
                "session_count": int(row["session_count"]),
                "total_distance": round(float(row["total_distance"]), 2) if row["total_distance"] else 0,
                "total_steps": int(row["total_steps"]) if row["total_steps"] else 0,
                "total_duration": int(row["total_duration"]) if row["total_duration"] else 0,
            }
            report["activities"].append(activity)
    
    # --- Rest Day Dates ---
    rest_days_df = data["rest_days"]
    user_rest_days = rest_days_df[rest_days_df["user_id"] == user_id]
    if not user_rest_days.empty:
        dates = user_rest_days["rest_date"].tolist()
        # Sort dates
        dates.sort()
        report["rest_day_dates"] = dates
    
    return report

# =============================================================================
# STEP 5: PRETTY PRINT FUNCTION
# =============================================================================

def print_report(report: dict):
    """Pretty print the report data for easy copy/paste into the UI"""
    
    print("=" * 60)
    print("PLAYER REPORT DATA")
    print("=" * 60)
    
    # User Info
    ui = report["user_info"]
    print(f"\n📋 USER INFO")
    print(f"   Username: {ui.get('username', 'N/A')}")
    print(f"   Name: {ui.get('first_name', '')} {ui.get('last_name', '')}")
    print(f"   Total Points: {ui.get('total_points', 0)}")
    print(f"   Avg RR: {ui.get('avg_rr', 0)}")
    
    # Performance Overview
    po = report["performance_overview"]
    print(f"\n📊 PERFORMANCE OVERVIEW")
    print(f"   Total Activities: {po.get('total_activities', 0)}")
    print(f"   Total Active Days: {po.get('total_active_days', 0)}")
    print(f"   Total Missed Days: {po.get('total_missed_days', 0)}")
    print(f"   Best Streak: {po.get('best_streak', 0)} days")
    
    # Points Breakdown
    pb = report["points_breakdown"]
    print(f"\n💰 POINTS BREAKDOWN")
    print(f"   Workouts: {pb.get('workouts', 0)}")
    print(f"   Rest Days: {pb.get('rest_days', 0)}")
    
    # Individual Standing
    ist = report["individual_standing"]
    print(f"\n🏆 INDIVIDUAL STANDING")
    print(f"   Standing: {ist.get('display_text', 'N/A')}")
    
    # Team Standings
    ts = report["team_standings"]
    print(f"\n👥 TEAM STANDINGS")
    print(f"   Your Rank in Team: {ts.get('user_rank_display', 'N/A')}")
    
    # Activities
    print(f"\n🏃 ACTIVITY DETAILS")
    activities = report["activities"]
    if activities:
        print(f"   {'Activity':<25} {'Sessions':>10} {'Distance':>12} {'Steps':>12} {'Duration':>12}")
        print(f"   {'-'*71}")
        for act in activities:
            dist_str = f"{act['total_distance']} km" if act['total_distance'] > 0 else "-"
            steps_str = f"{act['total_steps']:,}" if act['total_steps'] > 0 else "-"
            dur_str = f"{act['total_duration']} min" if act['total_duration'] > 0 else "-"
            print(f"   {act['activity_name']:<25} {act['session_count']:>10} {dist_str:>12} {steps_str:>12} {dur_str:>12}")
    else:
        print("   No activities recorded")
    
    # Rest Day Dates
    print(f"\n😴 REST DAY DATES ({len(report['rest_day_dates'])} days)")
    dates = report["rest_day_dates"]
    if dates:
        # Print in rows of 5
        for i in range(0, len(dates), 5):
            chunk = dates[i:i+5]
            print(f"   {', '.join(chunk)}")
    else:
        print("   No rest days taken")
    
    print("\n" + "=" * 60)

# =============================================================================
# JUPYTER NOTEBOOK USAGE
# =============================================================================

if __name__ == "__main__":
    # Load data
    data = load_data()
    
    # Show available users
    print("\n📋 AVAILABLE USERS:")
    print(get_user_list(data).to_string(index=False))
    
    # Example: Get report for a specific user
    # user_id = "38a588dc-67da-4528-9a63-153e6b22e2dd"  # Uma
    # report = get_player_report(user_id, data)
    # print_report(report)

