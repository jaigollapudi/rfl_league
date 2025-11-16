# Complete Supabase Setup Guide for RFL League

This guide walks you through every file and configuration needed to connect Supabase to your project.

---

## 📋 **STEP 1: Create Environment Variables File**

Create a file named `.env.local` in the **root directory** of your project (`D:\Projects\rfl_league\.env.local`)

### Required Environment Variables:

```env
# ============================================
# REQUIRED - Core Supabase Configuration
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# ============================================
# REQUIRED - NextAuth Configuration
# ============================================
NEXTAUTH_SECRET=your-random-secret-string-here

# ============================================
# OPTIONAL - Advanced Features
# ============================================
# Only needed if you use analytics drain endpoint
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Only needed if you use Vercel Analytics drain
VERCEL_ANALYTICS_DRAIN_SECRET=your-vercel-secret-here

# Optional - Custom proof bucket name (defaults to 'rofl_proof_pics')
NEXT_PUBLIC_PROOF_BUCKET=rofl_proof_pics
```

---

## 🔑 **STEP 2: Get Your Supabase Credentials**

### 2.1 Get Supabase URL and Anon Key:

1. Go to https://app.supabase.com
2. Sign in or create an account
3. Create a new project (or select existing)
4. Wait for project to finish setting up
5. Go to **Settings** → **API** (in left sidebar)
6. You'll see:
   - **Project URL** → Copy this to `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → Copy this to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2.2 Get Service Role Key (Optional):

1. In the same **Settings** → **API** page
2. Find **service_role** key (⚠️ Keep this secret!)
3. Copy to `SUPABASE_SERVICE_ROLE_KEY` (only if using analytics drain)

### 2.3 Generate NextAuth Secret:

Run this command in your terminal:
```bash
openssl rand -base64 32
```
Copy the output to `NEXTAUTH_SECRET`

---

## 📁 **STEP 3: File-by-File Configuration Details**

### **File 1: `.env.local` (Root Directory)**
**Location:** `D:\Projects\rfl_league\.env.local`  
**Action:** Create this file and add all environment variables listed in Step 1

**What goes here:**
- All your Supabase credentials
- NextAuth secret
- Optional keys for advanced features

---

### **File 2: `src/lib/supabase.ts`**
**Location:** `D:\Projects\rfl_league\src\lib\supabase.ts`  
**Action:** ✅ **NO CHANGES NEEDED** - This file reads from environment variables

**What it uses:**
- `NEXT_PUBLIC_SUPABASE_URL` (line 7)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (line 8)

**What it does:**
- Creates the Supabase client used throughout the app
- Throws error if env vars are missing

---

### **File 3: `src/auth.ts`**
**Location:** `D:\Projects\rfl_league\src\auth.ts`  
**Action:** ✅ **NO CHANGES NEEDED** - Uses environment variables

**What it uses:**
- `NEXTAUTH_SECRET` (line 27)
- Uses `getSupabase()` which needs the Supabase env vars

**What it does:**
- Handles user authentication
- Queries `accounts` table in Supabase for login

---

### **File 4: `src/app/api/auth/[...nextauth]/route.ts`**
**Location:** `D:\Projects\rfl_league\src\app\api\auth\[...nextauth]\route.ts`  
**Action:** ✅ **NO CHANGES NEEDED** - Uses environment variables

**What it uses:**
- `NEXTAUTH_SECRET` (line 10)
- Uses `getSupabase()` for authentication

**What it does:**
- NextAuth API route handler
- Handles login requests

---

### **File 5: `src/app/(app)/dashboard/page.tsx`**
**Location:** `D:\Projects\rfl_league\src\app\(app)\dashboard\page.tsx`  
**Action:** ✅ **NO CHANGES NEEDED** - Uses environment variables

**What it uses:**
- `NEXT_PUBLIC_PROOF_BUCKET` (line 200) - Optional, defaults to 'rofl_proof_pics'
- Uses `getSupabase()` extensively for:
  - Fetching user entries
  - Fetching team data
  - Fetching leaderboard
  - Uploading proof images

**What it does:**
- Main dashboard page
- Fetches all user/team data from Supabase

---

### **File 6: `src/app/api/analytics/drain/route.ts`**
**Location:** `D:\Projects\rfl_league\src\app\api\analytics\drain\route.ts`  
**Action:** ✅ **NO CHANGES NEEDED** - Uses environment variables

**What it uses:**
- `NEXT_PUBLIC_SUPABASE_URL` (line 8)
- `SUPABASE_SERVICE_ROLE_KEY` (line 9) - **Required for this endpoint**
- `VERCEL_ANALYTICS_DRAIN_SECRET` (line 19) - Optional

**What it does:**
- Analytics event drain endpoint
- Only needed if using Vercel Analytics

---

### **File 7: `src/app/api/entries/upsert/route.ts`**
**Location:** `D:\Projects\rfl_league\src\app\api\entries\upsert\route.ts`  
**Action:** ✅ **NO CHANGES NEEDED** - Uses `getSupabase()`

**What it uses:**
- Uses `getSupabase()` which needs Supabase env vars
- Queries `accounts` and `entries` tables

**What it does:**
- API endpoint for creating/updating workout entries

---

### **File 8: `src/app/api/auth/update-password/route.ts`**
**Location:** `D:\Projects\rfl_league\src\app\api\auth\update-password\route.ts`  
**Action:** ✅ **NO CHANGES NEEDED** - Uses `getSupabase()`

**What it uses:**
- Uses `getSupabase()` to update passwords in `accounts` table

**What it does:**
- Handles password updates

---

### **File 9: All Other Pages**
**Files:**
- `src/app/leaderboards/page.tsx`
- `src/app/team/page.tsx`
- `src/app/governor/page.tsx`
- `src/app/signup/page.tsx`
- `src/components/navbar.tsx`

**Action:** ✅ **NO CHANGES NEEDED** - All use `getSupabase()` which reads from env vars

---

## 🗄️ **STEP 4: Database Setup**

Your Supabase database needs these tables. You can create them via SQL Editor in Supabase:

### Required Tables:

1. **`accounts`** - User accounts
   - Columns: `id`, `username`, `password`, `first_name`, `role`, `age`, `team_id`, etc.

2. **`entries`** - Workout/rest day entries
   - Columns: `id`, `user_id`, `team_id`, `date`, `type`, `workout_type`, `duration`, `distance`, `steps`, `holes`, `rr_value`, `proof_url`, `status`, etc.

3. **`teams`** - Team information
   - Columns: `id`, `name`, `color`, `leader_id`, etc.

4. **`web_analytics_events`** (Optional) - Only if using analytics drain
   - Column: `event` (JSONB)

### Required Functions (RPC):

1. **`rfl_has_entry_on_date`** - Checks if user has entry on date
2. **`rfl_upsert_workout`** - Creates/updates workout entry
3. **`rfl_upsert_rest_day`** - Creates/updates rest day entry
4. **`rfl_team_leaderboard`** - Returns team leaderboard data

---

## 🪣 **STEP 5: Storage Bucket Setup**

1. Go to Supabase Dashboard → **Storage**
2. Create a bucket named `rofl_proof_pics` (or match your `NEXT_PUBLIC_PROOF_BUCKET` value)
3. Set bucket to **Public** (or configure RLS policies)
4. This stores workout proof images

---

## ✅ **STEP 6: Verification Checklist**

After setup, verify:

- [ ] `.env.local` file exists in root directory
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set (starts with `https://`)
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] `NEXTAUTH_SECRET` is set (random string)
- [ ] Database tables exist (`accounts`, `entries`, `teams`)
- [ ] Storage bucket `rofl_proof_pics` exists
- [ ] RPC functions are created
- [ ] Restart dev server after adding `.env.local`

---

## 🚀 **STEP 7: Start the Application**

1. Make sure `.env.local` is in place
2. Restart your dev server:
   ```bash
   npm run dev
   ```
3. Open http://localhost:3000
4. You should be able to sign in (if you have accounts in database)

---

## 🔍 **Troubleshooting**

### Error: "Supabase env vars are not set"
- Check `.env.local` exists in root directory
- Verify variable names are exact (case-sensitive)
- Restart dev server after creating/editing `.env.local`

### Error: "Unauthorized" or login fails
- Check `accounts` table has users
- Verify username/password in database
- Check Supabase project is active

### Error: "relation does not exist"
- Database tables not created
- Run SQL scripts to create tables

### Images not uploading
- Check storage bucket exists
- Verify bucket is public or RLS policies allow access

---

## 📝 **Summary**

**Only ONE file needs manual editing:**
- ✅ `.env.local` - Add your Supabase credentials here

**All other files:**
- ✅ Already configured to read from environment variables
- ✅ No code changes needed

**What you need from Supabase:**
1. Project URL → `NEXT_PUBLIC_SUPABASE_URL`
2. Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Service Role Key (optional) → `SUPABASE_SERVICE_ROLE_KEY`
4. Database tables created
5. Storage bucket created

---

**That's it! Once you add the environment variables to `.env.local`, everything should work!** 🎉


