# Quick Supabase Setup - TL;DR

## ⚡ Fast Setup (5 minutes)

### 1. Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
```

### 2. Get values from Supabase:
- Go to: https://app.supabase.com → Your Project → Settings → API
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Generate secret: `openssl rand -base64 32` → `NEXTAUTH_SECRET`

### 3. Restart dev server:
```bash
npm run dev
```

---

## 📋 Files That Use Supabase (No Changes Needed)

All these files automatically read from `.env.local`:

| File | What It Uses |
|------|-------------|
| `src/lib/supabase.ts` | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `src/auth.ts` | `NEXTAUTH_SECRET` + Supabase env vars |
| `src/app/api/auth/[...nextauth]/route.ts` | `NEXTAUTH_SECRET` + Supabase |
| `src/app/(app)/dashboard/page.tsx` | `NEXT_PUBLIC_PROOF_BUCKET` (optional) + Supabase |
| `src/app/api/analytics/drain/route.ts` | `SUPABASE_SERVICE_ROLE_KEY` (optional) |
| All other pages | Use `getSupabase()` which reads env vars |

**✅ You only need to edit `.env.local` - no code changes!**

---

## 🗄️ Database Requirements

Your Supabase database needs:
- `accounts` table (users)
- `entries` table (workouts/rest days)
- `teams` table
- RPC functions: `rfl_has_entry_on_date`, `rfl_upsert_workout`, `rfl_upsert_rest_day`, `rfl_team_leaderboard`
- Storage bucket: `rofl_proof_pics` (for proof images)

---

## ✅ Done!

Once `.env.local` is set up, restart the server and you're good to go!

For detailed instructions, see `SUPABASE_SETUP_GUIDE.md`


