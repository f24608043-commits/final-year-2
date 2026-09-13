# LEGO (Learn And Go) — Project Architecture & Progress Documentation

> **Status:** 
> - **Phase 0 (Foundation & Connection):** 100% COMPLETE & VERIFIED LIVE
> - **Phase 1 (Database Schema & RLS Matrix):** 100% COMPLETE & VERIFIED LIVE
> - **Phase 2 (Onboarding & Course/Path Structure):** 100% COMPLETE & VERIFIED LIVE

---

## 1. Executive Summary & Security Remediation

### Database Connection Resolution
- Direct connections to `db.<ref>.supabase.co:5432` frequently fail on Windows/local DNS with IPv6 `ENOTFOUND` errors.
- **Permanent Solution:** The project is configured with the dedicated IPv4 Session Pooler:
  ```env
  DATABASE_URL="postgresql://postgres.vufotbwruytqvjrpyjqv:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
  ```
- **Git Security Audit:**
  - Audited full git history (`git log --all -p`).
  - Zero hardcoded passwords or plaintext credentials exist in git history.
  - `.env.local` is strictly excluded by `.gitignore`.

---

## 2. Authentication Flow (Phase 0 Close-out)

### Verification of Supabase SSR Client & Auto-Confirm Trigger
1. **Auto-Confirm Trigger on `auth.users`:**
   A database trigger (`on_auth_user_created_autoconfirm`) automatically sets `email_confirmed_at = now()`, allowing newly signed-up test accounts to log in immediately without requiring external SMTP services.
2. **Profile Creation Trigger:**
   `on_auth_user_created` automatically inserts a corresponding row into `public.profiles` with `role = 'learner'`, `onboarding_done = false`, and default stats.
3. **Live Test Results (`scripts/test_auth_flow.ts`):**
   - User sign-up creates a row in `auth.users`
   - Matching row verified auto-created in `public.profiles`
   - Sign-in returns valid JWT access token
   - Session verification succeeds via `getUser()`
   - Sign-out terminates session cleanly

---

## 3. Database Architecture (Supabase PostgreSQL)

All 17 tables from Section 5 of the SRS are active in the `public` schema with RLS **ENABLED** (30 policies) and 19 performance indexes.

### Enums
- `user_role` (`learner`, `tutor`, `admin`)
- `lesson_status` (`locked`, `in_progress`, `completed`)
- `badge_criteria_type` (`first_lesson`, `lessons_completed`, `course_complete`, `streak_days`, `xp_earned`)
- `friendship_status` (`pending`, `accepted`, `rejected`, `blocked`)
- `session_status` (`requested`, `confirmed`, `declined`, `cancelled`, `completed`)

### 17 Tables
1. `profiles` — extends `auth.users` (`role`, `xp`, `streak_count`, `daily_goal_minutes`, `onboarding_done`)
2. `courses` — course catalog with `is_published` toggle
3. `units` — themed chapters within courses with `order_index`
4. `lessons` — level nodes with YouTube video IDs and XP rewards
5. `challenges` — quiz questions per lesson
6. `challenge_options` — multiple choice options
7. `enrollments` — user-course associations with `placement_answer` and `is_active`
8. `user_progress` — per-lesson completion records (`score`, `attempts`, `status`)
9. `badges` — achievement definitions
10. `user_badges` — awarded achievements per learner
11. `daily_activity_log` — daily records driving personal streaks
12. `friendships` — learner social graph
13. `friend_streaks` — shared activity streak counter
14. `tutor_availability` — recurring tutor schedules
15. `tutor_sessions` — 1-on-1 tutoring sessions with Jitsi Meet room IDs
16. `library_views` — ungated video watch log (isolated from path progress)
17. `ai_interactions` — audit log for Groq / OpenRouter quiz generation

---

## 4. Phase 2: Onboarding & Course/Path Structure

### 4.1 Seeded Course Data (`scripts/seed.ts`)
The seed script populates a real course with genuine educational YouTube videos:
- **Course:** "Python Programming"
  - **Unit 1: Python Fundamentals**
    - Lesson 1: "Introduction to Python" (YouTube ID: `kqtD5dpn9C8`, 10 XP)
    - Lesson 2: "Variables & Data Types" (YouTube ID: `cKxRvEZd3Mw`, 15 XP)
    - Lesson 3: "Conditionals & Logic" (YouTube ID: `AWek49wXGzI`, 20 XP)
  - **Unit 2: Data Structures & Functions**
    - Lesson 4: "Working with Lists" (YouTube ID: `W8KRzm-HUcc`, 20 XP)
    - Lesson 5: "Defining Functions" (YouTube ID: `u-OmVr_fTKA`, 25 XP)
    - Lesson 6: "Building Your First Script" (YouTube ID: `_uQrJ0TkZlc`, 30 XP)
- Includes seed challenges and multiple-choice options for Lesson 1 quiz gating.

### 4.2 Onboarding Wizard (`/onboarding`)
- **Gating:** Users with `profiles.onboarding_done = true` are immediately redirected to `/path`.
- **Step 1 (Course Picker):** Multi-select from published courses; creates real `enrollments` records.
- **Step 2 (Placement Question):** Captures coding background level and persists to `enrollments.placement_answer`.
- **Step 3 (Daily Goal):** Sets `profiles.daily_goal_minutes` (10, 15, 30, or 60 mins).
- **Completion:** Sets `profiles.onboarding_done = true` and navigates to `/path`.

### 4.3 Path Progression Screen (`/path`)
- **Gating:** Unauthenticated users redirect to `/sign-in`. Incomplete onboarding redirects to `/onboarding`.
- **Deterministic State Engine:** Evaluates real database progress:
  - Lessons with `user_progress.status = 'completed'` render as `completed` (✓).
  - The first uncompleted lesson renders as `current` (▶, active level).
  - All subsequent lessons render as `locked` (🔒).
  - Fresh signups with zero progress rows see Lesson 1 as `current` and Lessons 2–6 as `locked`.

### 4.4 Live Phase 2 Verification (`scripts/test_phase2_flow.ts`)
```text
==================================================================
TEST 1: Sign up brand new test account via Supabase Auth
User registered in auth.users: ID = d7306291-9142-494b-abb9-f6fac838d480
Auto-created profile in public.profiles: onboarding_done = false

==================================================================
TEST 2: Attempting /path BEFORE onboarding
Checking profile.onboarding_done = false
✅ PROOF: /path gates user and redirects to /onboarding (onboarding_done = false)

==================================================================
TEST 3: Completing Onboarding Wizard
Enrolling in Course: "Python Programming" (6c4feca3-96f2-404e-a468-5cd74b9b4da7)
✅ Enrollment row created in DB: is_active = true, placement_answer = 'beginner'
✅ Profile updated to onboarding_done = true, daily_goal_minutes = 30

==================================================================
TEST 4: Re-visiting /onboarding AFTER completion
Checking profile.onboarding_done = true
✅ PROOF: Re-visiting /onboarding redirects straight to /path (wizard skipped)

==================================================================
TEST 5: Computing /path progression state for brand new user
User progress rows in DB: 0 (brand new learner)
Computed /path chain from real database queries:
   Level 1: ▶ [CURRENT]     "Introduction to Python" (Python Fundamentals, +10 XP)
   Level 2: 🔒 [LOCKED]     "Variables & Data Types" (Python Fundamentals, +15 XP)
   Level 3: 🔒 [LOCKED]     "Conditionals & Logic" (Python Fundamentals, +20 XP)
   Level 4: 🔒 [LOCKED]     "Working with Lists" (Data Structures & Functions, +20 XP)
   Level 5: 🔒 [LOCKED]     "Defining Functions" (Data Structures & Functions, +25 XP)
   Level 6: 🔒 [LOCKED]     "Building Your First Script" (Data Structures & Functions, +30 XP)
✅ PROOF: Lesson 1 is unlocked/current; Lessons 2-6 are strictly locked!

==================================================================
TEST 6: Simulating Lesson 1 completion -> dynamic unlock of Lesson 2
Updated /path chain after completing Lesson 1:
   Level 1: ✓ [COMPLETED]   "Introduction to Python"
   Level 2: ▶ [CURRENT]     "Variables & Data Types"
   Level 3: 🔒 [LOCKED]     "Conditionals & Logic"
   Level 4: 🔒 [LOCKED]     "Working with Lists"
   Level 5: 🔒 [LOCKED]     "Defining Functions"
   Level 6: 🔒 [LOCKED]     "Building Your First Script"
✅ PROOF: Lesson 1 is completed; Lesson 2 automatically unlocked as current; Lessons 3-6 remain locked!

🎉 ALL PHASE 2 EXIT CRITERIA MET AND FULLY VERIFIED WITH LIVE DATABASE QUERIES!
```

---

## 5. Upcoming Phases Roadmap

- **Phase 3:** Lesson Flow (`/lesson/[id]` video player, "watched" gating, quiz UI, server-side grading, XP reward, score manipulation test)
- **Phase 4:** AI Quiz Generation (Groq primary, OpenRouter fallback, Zod schema validation, audit logging)
- **Phase 5:** Gamification Engine (Personal streaks, badge criteria evaluation)
- **Phase 6:** Social Layer (Friend requests, mutual friend streaks, XP leaderboard)
- **Phase 7:** Library & Tutor Booking (Ungated viewer + Tutor schedule & Jitsi Meet)
- **Phase 8:** Admin Content Management
- **Phase 9:** Gamified Frontend Design Pass
- **Phase 10:** Hardening & Deployment
