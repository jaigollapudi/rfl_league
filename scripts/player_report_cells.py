"""
PFL Player Report Data Generator - Jupyter Notebook Cells
=========================================================
Copy each cell section into separate Jupyter notebook cells.

Updated for simplified single-page report:
- No Points Breakdown
- No Team Standings  
- No Rest Day Dates
"""

# =============================================================================
# CELL 1: Imports
# =============================================================================
import pandas as pd

# =============================================================================
# CELL 2: FILE PATHS - UPDATE THESE!
# =============================================================================
FILE_PATHS = {
    "rest_days": "/Users/jaigollapudi/Downloads/Supabase Snippet Team Members' Approved Rest Days.csv",
    "workout_activity": "/Users/jaigollapudi/Downloads/Supabase Snippet Team Member Workout Activity Summary.csv",
    "percentile": "/Users/jaigollapudi/Downloads/Supabase Snippet Team Leaderboard with Percentile Tiers.csv",
    "streaks": "/Users/jaigollapudi/Downloads/Supabase Snippet Team members' longest approved workout streaks.csv",
    "missed_days": "/Users/jaigollapudi/Downloads/Supabase Snippet Team Member Missed-Days Report.csv",
    "activity_summary": "/Users/jaigollapudi/Downloads/Supabase Snippet Team Member Activity Summary.csv",
}

# =============================================================================
# CELL 3: Load all data
# =============================================================================
data = {}
for key, path in FILE_PATHS.items():
    try:
        data[key] = pd.read_csv(path)
        print(f"✓ Loaded {key}: {len(data[key])} rows")
    except FileNotFoundError:
        print(f"✗ File not found: {path}")
        data[key] = pd.DataFrame()

# =============================================================================
# CELL 4: Show all users in the team
# =============================================================================
users_df = data["activity_summary"][["user_id", "first_name", "last_name", "username"]].copy()
users_df["full_name"] = users_df["first_name"].str.strip() + " " + users_df["last_name"].str.strip()
users_df[["user_id", "username", "full_name"]]

# =============================================================================
# CELL 5: Helper functions
# =============================================================================
def format_standing(s):
    return {"top_10": "Top 10th Percentile", "top_50": "Top 50th Percentile"}.get(s, "League Completed. Congrats!")

def format_activity(a):
    return {"steps": "Steps", "run": "Running", "gym": "Gym", "yoga": "Yoga", "cycling": "Cycling",
            "badminton_pickleball": "Badminton/Pickleball", "basketball_cricket": "Basketball/Cricket",
            "swimming": "Swimming", "hiking": "Hiking", "tennis": "Tennis", "dance": "Dance"}.get(a, a.replace("_", " ").title())

# =============================================================================
# CELL 6: Main report function
# =============================================================================
def get_player_report(user_id):
    # User summary
    us = data["activity_summary"][data["activity_summary"]["user_id"] == user_id]
    if us.empty:
        print(f"⚠️ User not found: {user_id}")
        return None
    u = us.iloc[0]
    
    # Missed days
    md = data["missed_days"][data["missed_days"]["user_id"] == user_id]
    missed = int(md.iloc[0]["missed_days"]) if not md.empty else 0
    
    # Best streak  
    st = data["streaks"][data["streaks"]["user_id"] == user_id]
    streak = int(st.iloc[0]["best_streak"]) if not st.empty else 0
    
    # Workouts
    wo = data["workout_activity"][data["workout_activity"]["user_id"] == user_id]
    total_activities = int(wo["session_count"].sum()) if not wo.empty else 0
    
    # Percentile
    pc = data["percentile"][data["percentile"]["user_id"] == user_id]
    standing = pc.iloc[0]["individual_standing"] if not pc.empty else "completed"
    
    # Rest days count
    rd = data["rest_days"][data["rest_days"]["user_id"] == user_id]
    rest_days_count = len(rd) if not rd.empty else 0
    
    # Activities list with avg per session calculation
    activities = []
    if not wo.empty:
        for _, r in wo.iterrows():
            sessions = int(r["session_count"])
            distance = round(float(r["total_distance"] or 0), 2)
            steps = int(r["total_steps"] or 0)
            duration = int(r["total_duration"] or 0)
            
            # Calculate avg per session
            avg_distance = round(distance / sessions, 1) if distance and sessions > 0 else 0
            avg_steps = round(steps / sessions) if steps and sessions > 0 else 0
            avg_duration = round(duration / sessions) if duration and sessions > 0 else 0
            
            activities.append({
                "name": format_activity(r["activity_name"]),
                "sessions": sessions,
                "distance": distance,
                "steps": steps,
                "duration": duration,
                "avg_distance": avg_distance,
                "avg_steps": avg_steps,
                "avg_duration": avg_duration,
            })
    
    return {
        "username": u["username"],
        "name": f"{str(u['first_name']).strip()} {str(u['last_name']).strip()}",
        "total_points": int(u["total_points"]),
        "avg_rr": round(float(u["avg_rr"]), 2),
        "total_activities": total_activities,
        "active_days": int(u["active_days"]),
        "missed_days": missed,
        "rest_days_count": rest_days_count,
        "best_streak": streak,
        "standing": standing,
        "standing_display": format_standing(standing),
        "activities": activities,
    }

# =============================================================================
# CELL 7: Pretty print function (matches new simplified report)
# =============================================================================
def print_report(r):
    if not r: return
    print("=" * 70)
    print(f"REPORT FOR: {r['name']} (@{r['username']})")
    print("=" * 70)
    
    print(f"\n📋 USER INFO (header row)")
    print(f"   Username:      {r['username']}")
    print(f"   Total Points:  {r['total_points']}")
    print(f"   Avg RR:        {r['avg_rr']}")
    
    print(f"\n📊 PERFORMANCE OVERVIEW (left column)")
    print(f"   Workouts Completed: {r['total_activities']}")
    print(f"   Rest Days Taken:    {r['rest_days_count']}")
    print(f"   Active Days:        {r['active_days']}")
    print(f"   Missed Days:        {r['missed_days']}")
    print(f"   Best Streak:        {r['best_streak']} days")
    
    print(f"\n🏆 INDIVIDUAL STANDING (right column)")
    print(f"   Dropdown:  {r['standing']}")
    print(f"   Display:   \"{r['standing_display']}\"")
    
    print(f"\n🏃 ACTIVITY DETAILS TABLE ({len(r['activities'])} activities)")
    print(f"   {'Activity':<22} {'Sessions':>8} {'Distance':>10} {'Steps':>10} {'Duration':>10} {'Avg/Sess':>12}")
    print(f"   {'-'*74}")
    for a in r['activities']:
        d = f"{a['distance']}km" if a['distance'] else "-"
        s = f"{a['steps']:,}" if a['steps'] else "-"
        t = f"{a['duration']}min" if a['duration'] else "-"
        
        # Determine avg per session based on what data exists
        if a['name'].lower() == 'steps' and a['avg_steps']:
            avg = f"{a['avg_steps']:,}"
        elif a['avg_distance']:
            avg = f"{a['avg_distance']}km"
        elif a['avg_duration']:
            avg = f"{a['avg_duration']}min"
        else:
            avg = "-"
        
        print(f"   {a['name']:<22} {a['sessions']:>8} {d:>10} {s:>10} {t:>10} {avg:>12}")
    
    print("\n" + "=" * 70)

# =============================================================================
# CELL 8: GET A PLAYER'S REPORT - CHANGE user_id HERE!
# =============================================================================
# Copy a user_id from Cell 4's output

user_id = "38a588dc-67da-4528-9a63-153e6b22e2dd"  # Uma - CHANGE THIS!

report = get_player_report(user_id)
print_report(report)

# =============================================================================
# CELL 9 (BONUS): Lookup by username instead of user_id
# =============================================================================
def by_username(username):
    m = data["activity_summary"][data["activity_summary"]["username"] == username]
    return get_player_report(m.iloc[0]["user_id"]) if not m.empty else None

# Usage: print_report(by_username("swapna"))
