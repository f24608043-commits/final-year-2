# LEGO (Learn And Go) â€” Project Architecture & Database Documentation

> **Status:** Phase 0 (Foundation & Connection) & Phase 1 (Database Schema & RLS Matrix) are **100% Complete & Verified Live in Supabase**.

---

## 1. Executive Summary & Problem Resolution

### The "DATABASE_URL" Trap Solved Permanently
In earlier setups, direct connection attempts to `db.<ref>.supabase.co:5432` failed with `ENOTFOUND` or IPv6 timeouts due to standard local network DNS configurations unable to resolve Supabase IPv6 endpoints. 

**Root Cause & Permanent Fix:**
- **Supabase Project Ref:** `vufotbwruytqvjrpyjqv` (Name: `FYP-project-2`, Region: `ap-northeast-1` / Tokyo)
- Direct host `db.vufotbwruytqvjrpyjqv.supabase.co` is IPv6 only.
- Supabase provides IPv4-routable connection poolers with dedicated hostnames per AWS region.
- **The exact working Session Pooler URL:**
  ```env
  DATABASE_URL="postgresql://postgres.vufotbwruytqvjrpyjqv:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
  ```
- **Connection Proof:** Live queries connect over standard IPv4 port 5432 in milliseconds.

---

## 2. Database Architecture (Supabase PostgreSQL)

All 17 tables from Section 5 of the SRS are fully created, indexed, secured with RLS, and populated with seed badges.

### 2.1 Enums Defined in `public`
1. `public.user_role`: `'learner'`, `'tutor'`, `'admin'`
2. `public.lesson_status`: `'locked'`, `'in_progress'`, `'completed'`
3. `public.badge_criteria_type`: `'first_lesson'`, `'lessons_completed'`, `'course_complete'`, `'streak_days'`, `'xp_earned'`
4. `public.friendship_status`: `'pending'`, `'accepted'`, `'rejected'`, `'blocked'`
5. `public.session_status`: `'requested'`, `'confirmed'`, `'declined'`, `'cancelled'`, `'completed'`

---

### 2.2 Table Inventory (17 Tables)

| # | Table Name | Columns | Primary Key | Description |
|---|------------|---------|-------------|-------------|
| 1 | `profiles` | 11 | `id` (UUID -> auth.users) | Extends `auth.users` with `role`, `xp`, `streak_count`, `last_active_date`, `daily_goal_minutes`, and `onboarding_done`. |
| 2 | `courses` | 8 | `id` (UUID) | Course catalog with title, description, Cloudinary cover image, and `is_published` flag. |
| 3 | `units` | 7 | `id` (UUID) | Themed chapters within a course, ordered by `order_index`. |
| 4 | `lessons` | 10 | `id` (UUID) | Individual levels with embedded `youtube_video_id`, `xp_reward`, and sequential order. |
| 5 | `challenges` | 8 | `id` (UUID) | Quiz gating questions for a lesson, with `points` and `order_index`. |
| 6 | `challenge_options` | 6 | `id` (UUID) | Multiple choice options with `is_correct` boolean indicator. |
| 7 | `enrollments` | 5 | `id` (UUID) | Learner-to-course relationship with `is_active` toggle. |
| 8 | `user_progress` | 9 | `id` (UUID) | Per-user, per-lesson status (`locked`, `in_progress`, `completed`), score, and attempts. |
| 9 | `badges` | 8 | `id` (UUID) | Badge definitions with criteria type and milestone values. |
| 10 | `user_badges` | 4 | `id` (UUID) | Earned achievements with timestamp awarded. |
| 11 | `daily_activity_log` | 4 | `id` (UUID) | Unique record per user per day driving streak logic. |
| 12 | `friendships` | 6 | `id` (UUID) | Social graph between learners (`pending`, `accepted`, `rejected`, `blocked`). |
| 13 | `friend_streaks` | 6 | `id` (UUID) | Joint streak maintained only when both friends learn on the same day. |
| 14 | `tutor_availability` | 7 | `id` (UUID) | Tutor weekly recurring schedule (`day_of_week`, `start_time`, `end_time`). |
| 15 | `tutor_sessions` | 11 | `id` (UUID) | 1-on-1 booked appointments with Jitsi Meet room IDs and status transitions. |
| 16 | `library_views` | 4 | `id` (UUID) | Ungated lecture watch log that never contaminates progression state. |
| 17 | `ai_interactions` | 10 | `id` (UUID) | Audit log for all Groq/OpenRouter LLM calls (prompts, responses, latency). |

---

### 2.3 Automated Triggers & Functions
- **`public.handle_new_user()`**: Automatically triggered on `AFTER INSERT ON auth.users` to initialize a corresponding `public.profiles` row with `'learner'` role.
- **`public.touch_updated_at()`**: Updates `updated_at = now()` before any update on `profiles`, `courses`, `units`, `lessons`, `challenges`, `user_progress`, `badges`, `friendships`, `friend_streaks`, and `tutor_sessions`.
- **`public.current_user_role()`**: Secure, cached `SECURITY DEFINER` helper returning the role of `auth.uid()` for high-speed RLS policy evaluation.

---

### 2.4 Performance Indexes Created (19 Indexes)
- `idx_units_course_order` on `units (course_id, order_index)`
- `idx_lessons_unit_order` on `lessons (unit_id, order_index)`
- `idx_lessons_published` on `lessons (is_published)`
- `idx_challenges_lesson` on `challenges (lesson_id, order_index)`
- `idx_ch_options_challenge` on `challenge_options (challenge_id, order_index)`
- `idx_enrollments_user` on `enrollments (user_id)`
- `idx_enrollments_course` on `enrollments (course_id)`
- `idx_progress_user_status` on `user_progress (user_id, status)`
- `idx_progress_lesson` on `user_progress (lesson_id)`
- `idx_user_badges_user` on `user_badges (user_id)`
- `idx_activity_user_date` on `daily_activity_log (user_id, activity_date desc)`
- `idx_friendships_requester` on `friendships (requester_id, status)`
- `idx_friendships_addressee` on `friendships (addressee_id, status)`
- `idx_tutor_sessions_learner` on `tutor_sessions (learner_id, status)`
- `idx_tutor_sessions_tutor` on `tutor_sessions (tutor_id, status)`
- `idx_tutor_sessions_sched` on `tutor_sessions (scheduled_at)`
- `idx_library_views_user` on `library_views (user_id, lesson_id)`
- `idx_ai_interactions_lesson` on `ai_interactions (lesson_id)`
- `idx_profiles_xp` on `profiles (xp desc)` *(Supports fast Leaderboard ranking)*

---

### 2.5 Seed Data
The following gamification badges are pre-seeded in `public.badges`:
1. **"First Step"**: Complete your very first lesson (`criteria_type = 'first_lesson'`, `criteria_value = 1`)
2. **"Level Up"**: Complete 10 lessons (`criteria_type = 'lessons_completed'`, `criteria_value = 10`)
3. **"Week Warrior"**: Maintain a 7-day personal streak (`criteria_type = 'streak_days'`, `criteria_value = 7`)

---

## 3. Row-Level Security (RLS) Policy Verification & Proof

Every single table has RLS **ENABLED (`relrowsecurity = true`)**. A suite of 30 policies enforces the SRS Section 7 Roles & Permissions matrix:

### 3.1 Live Database Test Results
To prove compliance without guessing, 3 mock profiles (`learner`, `tutor`, `admin`) were evaluated under authenticated Postgres sessions (`SET LOCAL ROLE authenticated; SET LOCAL "request.jwt.claims" = '...';`).

Here are the reproduced results:

```text
=====================================================
TEST 1: Learner attempts to INSERT a course
Expected: MUST FAIL (RLS policy violation)
âœ… PROOF - Learner INSERT blocked: new row violates row-level security policy for table "courses"

=====================================================
TEST 2: Tutor attempts to INSERT a course
Expected: MUST FAIL (RLS policy violation)
âœ… PROOF - Tutor INSERT blocked: new row violates row-level security policy for table "courses"

=====================================================
TEST 3: Admin attempts to INSERT a course
Expected: MUST SUCCEED
âœ… PROOF - Admin INSERT succeeded: { id: '7c785392-...', title: 'TEST COURSE - ADMIN' }

=====================================================
TEST 4: Learner views published courses
Expected: MUST SUCCEED (can view published courses)
âœ… PROOF - Learner can read published courses: [ { id: '7c785392-...', title: 'TEST COURSE - ADMIN', is_published: true } ]

=====================================================
TEST 5: Learner books a tutor session
Expected: MUST SUCCEED
âœ… PROOF - Learner booked session: { id: 'b409eb51-...', status: 'requested', learner_id: '11111111-...', tutor_id: '22222222-...' }

=====================================================
TEST 6: Tutor attempts to book session for themselves as learner
Expected: MUST FAIL (only learner role can book)
âœ… PROOF - Tutor blocked from booking as learner: new row violates row-level security policy for table "tutor_sessions"
```

---

## 4. Full SQL Migration Script Location
The complete SQL schema migration is persisted at:
`C:\Users\Abu Bakar\.gemini\antigravity\brain\33a746e3-1cd4-4535-9e19-4648b7beb709\scratch\lego_schema.sql`

The execution and test runner scripts are persisted at:
- `scratch/complete_schema_and_test.mjs`
- `scratch/enable_all_rls_and_indexes.mjs`
- `scratch/test_rls_roles.mjs`

---

## 5. Next Steps for Upcoming Phases

1. **Phase 2 (Onboarding & Path Navigation):**
   - Implement `/onboarding` wizard (course select, placement question, daily goal)
   - Implement `/path` with unit/lesson state machine (`locked`, `current`, `completed`)
   - Seed initial course with 2 units & 3 levels each
2. **Phase 3 (Lesson Flow & Server-side Grading):**
   - Implement `/lesson/[lessonId]` YouTube embed + Quiz interface
   - Server Action to compute scores server-side and unlock next level
3. **Phase 4 (AI Quiz Generation):**
   - Groq API integration with OpenRouter fallback and Zod output validation
4. **Phase 5 (Gamification):**
   - Personal streak increment engine and automatic badge award evaluation
5. **Phase 6 (Social & Leaderboards):**
   - Friend requests, joint streak verification, and XP leaderboard
6. **Phase 7 (Library & Tutor Booking):**
   - Ungated video viewer + Tutor availability and Jitsi Meet room generation
7. **Phase 8 (Admin Dashboard):**
   - Full course/unit/lesson editor + AI quiz generator + user role management
8. **Phase 9 (Gamified Frontend Polish):**
   - Duolingo-style UI tokens, animations, and celebratory modals
9. **Phase 10 (Deployment):**
   - Vercel deployment with environment variables and end-to-end user journey test

