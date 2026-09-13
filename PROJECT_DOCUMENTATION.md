# LEGO (Learn And Go) — Project Architecture & Progress Documentation

> **Status:** 
> - **Phase 0 (Foundation & Connection):** 100% COMPLETE & VERIFIED LIVE
> - **Phase 1 (Database Schema & RLS Matrix):** 100% COMPLETE & VERIFIED LIVE
> - **Phase 2 (Onboarding & Course/Path Structure):** 100% COMPLETE & VERIFIED LIVE
> - **Phase 3 (Lesson Flow, Server-Side Grading, & Tamper-Proofing):** 100% COMPLETE & VERIFIED LIVE

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

### 4.1 Seeded Course Data (`scripts/seed.ts` & `scripts/seed_all_quizzes.ts`)
The seed scripts populate a real course with genuine educational YouTube videos and hand-written gating quizzes:
- **Course:** "Python Programming" (`is_published: true`)
  - **Unit 1: Python Fundamentals**
    - Lesson 1: "Introduction to Python" (YouTube ID: `kqtD5dpn9C8`, 10 XP)
    - Lesson 2: "Variables & Data Types" (YouTube ID: `cKxRvEZd3Mw`, 15 XP)
    - Lesson 3: "Conditionals & Logic" (YouTube ID: `AWek49wXGzI`, 20 XP)
  - **Unit 2: Data Structures & Functions**
    - Lesson 4: "Working with Lists" (YouTube ID: `W8KRzm-HUcc`, 20 XP)
    - Lesson 5: "Defining Functions" (YouTube ID: `u-OmVr_fTKA`, 25 XP)
    - Lesson 6: "Building Your First Script" (YouTube ID: `_uQrJ0TkZlc`, 30 XP)

### 4.2 Onboarding Wizard (`/onboarding`)
- **Gating:** Users with `profiles.onboarding_done = true` are immediately redirected to `/path`.
- **Step 1 (Course Picker):** Multi-select from published courses; creates real `enrollments` records.
- **Step 2 (Placement Question):** Captures coding background level and persists to `enrollments.placement_answer`.
- **Step 3 (Daily Goal):** Sets `profiles.daily_goal_minutes` (10, 15, 30, or 60 mins).
- **Completion:** Sets `profiles.onboarding_done = true` and navigates to `/path`.

### 4.3 Path Progression Screen (`/path`)
- **Gating:** Unauthenticated users redirect to `/sign-in`. Incomplete onboarding redirects to `/onboarding`.
- **Deterministic State Engine:** Driven entirely by real DB queries against `user_progress`:
  - Lessons with `user_progress.status = 'completed'` render as `completed` (✓).
  - The first uncompleted lesson renders as `current` (▶, active level).
  - All subsequent lessons render as `locked` (🔒).
  - Fresh signups with zero progress rows see Lesson 1 as `current` and Lessons 2–6 as `locked`.

---

## 5. Phase 3: Lesson Flow, Server-Side Grading & Tamper-Proofing

### 5.1 Gated Lesson Experience (`/lesson/[lessonId]`)
- **Server Gating:** Verifies user authentication, onboarding completion, and lesson accessibility. Jumping ahead to locked lessons redirects to `/path` with a security alert.
- **Client Security:** `is_correct` boolean indicators are stripped on the server and **never sent to the client**, preventing DOM/state inspection cheats.
- **Stage Progression:**
  1. **Watch Stage:** Embedded responsive YouTube player with lesson brief and an "I've Finished Watching — Take Quiz" gate button.
  2. **Quiz Stage:** Interactive multi-choice challenge interface.
  3. **Result Stage:** Displays dynamically graded score, XP awarded, and newly unlocked badges.

### 5.2 Server Action (`app/lesson/actions.ts: submitQuiz`)
- Complies strictly with **FR3.3 & FR3.4**:
  - Completely ignores any client-supplied scores.
  - Queries `challenges` and `challenge_options` from database to grade answers server-side.
  - Passing threshold (>= 50%):
    - Sets `user_progress.status = 'completed'`.
    - Updates `profiles.xp` with `lesson.xp_reward`.
    - Logs daily activity and updates `streak_count`.
    - Automatically evaluates and awards eligible badges (`first_lesson`, `lessons_completed`).
  - Failing attempt:
    - Sets `user_progress.status = 'in_progress'` and logs attempts.

### 5.3 Live Tamper-Proof Verification (`scripts/test_phase3_manipulation.ts`)
```text
==================================================================
PHASE 3 TEST 1: Registering learner & completing onboarding
✅ Registered User: tamper_test_1789324296274@lego.app
✅ Learner enrolled in 'Python Programming' and onboarding completed.
Initial state: Lesson 1 is current/unlocked; Lesson 2 is locked.

==================================================================
PHASE 3 TEST 2: MANIPULATED SCORE ATTACK (FR3.3 Test)
Attacker submits WRONG answers, but injects fake clientScore = 100 in payload.
Attack result returned by server: {
  passed: false,
  realCalculatedScore: 0,
  fakeClientScoreIgnored: 100,
  correctCount: 0,
  totalCount: 2
}
DB state after manipulated submission:
   user_progress: status = 'in_progress', score = 0% (Expected: 0%)
   profile: xp = 0 (Expected: 0 XP)
✅ PROOF: Manipulated score was COMPLETELY REJECTED. Graded strictly by server!

==================================================================
PHASE 3 TEST 3: LEGITIMATE PASSING SUBMISSION
Passing submission result: {
  passed: true,
  realCalculatedScore: 100,
  fakeClientScoreIgnored: undefined,
  correctCount: 2,
  totalCount: 2
}
DB state after passing submission:
   user_progress: status = 'completed', score = 100%
   profile: xp = 10 (+10 XP awarded)
   badges awarded: [ 'First Step' ]
✅ PROOF: Lesson 1 passed and marked 'completed', XP awarded, First Step badge awarded!

==================================================================
PHASE 3 TEST 4: VERIFYING DYNAMIC UNLOCK OF NEXT LEVEL (Lesson 2)
Current /path progression chain:
   Node 1 [✓ COMPLETED]: "Introduction to Python"
   Node 2 [▶ CURRENT]: "Variables & Data Types"
   Node 3 [🔒 LOCKED]: "Conditionals & Logic"
   Node 4 [🔒 LOCKED]: "Working with Lists"
   Node 5 [🔒 LOCKED]: "Defining Functions"
   Node 6 [🔒 LOCKED]: "Building Your First Script"
✅ PROOF: Lesson 1 completed -> Lesson 2 automatically unlocked as current!

🎉 ALL PHASE 3 EXIT CRITERIA MET AND VERIFIED LIVE!
```

---

## 6. Next Steps (Upcoming Phases)

- **Phase 4:** AI Quiz Generation (Groq primary, OpenRouter fallback, Zod schema validation, audit logging to `ai_interactions`)
- **Phase 5:** Gamification Engine (Personal streaks & badge criteria engine)
- **Phase 6:** Social Layer (Friend requests, mutual friend streaks, XP leaderboard)
- **Phase 7:** Library & Tutor Booking (Ungated viewer + Tutor schedule & Jitsi Meet)
- **Phase 8:** Admin Content Management
- **Phase 9:** Gamified Frontend Design Pass
- **Phase 10:** Hardening & Deployment
