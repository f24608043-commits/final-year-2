import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { courses, enrollments, lessons, profiles, units, userProgress } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { signOut } from "../auth/actions";

export default async function PathPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // 1. Verify user profile and onboarding status
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || !profile.onboardingDone) {
    redirect("/onboarding");
  }

  // 2. Fetch active course enrollment
  const userEnrollments = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.userId, user.id));

  const activeEnrollment = userEnrollments.find((e) => e.isActive) || userEnrollments[0];

  if (!activeEnrollment) {
    redirect("/onboarding");
  }

  // 3. Fetch course information
  const [course] = await db
    .select()
    .from(courses)
    .where(eq(courses.id, activeEnrollment.courseId))
    .limit(1);

  if (!course) {
    redirect("/onboarding");
  }

  // 4. Fetch all units for this course ordered by orderIndex
  const courseUnits = await db
    .select()
    .from(units)
    .where(eq(units.courseId, course.id))
    .orderBy(asc(units.orderIndex));

  const unitIds = courseUnits.map((u) => u.id);

  // 5. Fetch all lessons across these units ordered by orderIndex
  const courseLessons = unitIds.length > 0
    ? await db
        .select()
        .from(lessons)
        .where(inArray(lessons.unitId, unitIds))
        .orderBy(asc(lessons.orderIndex))
    : [];

  // 6. Fetch user progress for these lessons
  const lessonIds = courseLessons.map((l) => l.id);
  const progressRows = lessonIds.length > 0
    ? await db
        .select()
        .from(userProgress)
        .where(
          and(
            eq(userProgress.userId, user.id),
            inArray(userProgress.lessonId, lessonIds)
          )
        )
    : [];

  const progressMap = new Map(progressRows.map((p) => [p.lessonId, p.status]));

  // 7. Compute deterministic state machine chain based on real DB progress
  // Order units and lessons globally:
  const orderedLessonsWithUnit: Array<{
    lesson: typeof lessons.$inferSelect;
    unit: typeof units.$inferSelect;
    state: "completed" | "current" | "locked";
  }> = [];

  for (const unit of courseUnits) {
    const unitLessons = courseLessons.filter((l) => l.unitId === unit.id);
    for (const lesson of unitLessons) {
      orderedLessonsWithUnit.push({
        lesson,
        unit,
        state: "locked",
      });
    }
  }

  let foundCurrent = false;
  for (const item of orderedLessonsWithUnit) {
    const statusInDb = progressMap.get(item.lesson.id);
    if (statusInDb === "completed") {
      item.state = "completed";
    } else if (!foundCurrent) {
      item.state = "current";
      foundCurrent = true;
    } else {
      item.state = "locked";
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🧱</span>
            <div>
              <h1 className="text-base font-bold text-gray-900">{course.title}</h1>
              <p className="text-xs text-gray-500">Learning Path</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Gamification Stats */}
            <div className="flex items-center gap-3 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
              <span title="Current XP">⚡ {profile.xp} XP</span>
              <span className="text-gray-300">|</span>
              <span title="Day Streak">🔥 {profile.streakCount} d</span>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Path Progression */}
      <main className="mx-auto max-w-2xl px-4 pt-8">
        <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Active Course</span>
              <h2 className="text-xl font-bold text-gray-900">{course.title}</h2>
            </div>
            <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white">
              Level {orderedLessonsWithUnit.findIndex((i) => i.state === "current") + 1} of {orderedLessonsWithUnit.length}
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-600">{course.description}</p>
        </div>

        {/* Units and Lessons Chain */}
        <div className="space-y-8">
          {courseUnits.map((unit, unitIdx) => {
            const unitItems = orderedLessonsWithUnit.filter((i) => i.unit.id === unit.id);

            return (
              <div key={unit.id} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                {/* Unit Header */}
                <div className="mb-6 border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-600 px-2 py-0.5 text-xs font-bold text-white">
                      UNIT {unitIdx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-gray-900">{unit.title}</h3>
                  </div>
                  {unit.description && (
                    <p className="mt-1 text-xs text-gray-500">{unit.description}</p>
                  )}
                </div>

                {/* Lesson Nodes Chain */}
                <div className="relative flex flex-col items-center gap-6">
                  {unitItems.map((item, lessonIdx) => {
                    const { lesson, state } = item;
                    const isCompleted = state === "completed";
                    const isCurrent = state === "current";
                    const isLocked = state === "locked";

                    return (
                      <div key={lesson.id} className="flex w-full max-w-md items-center gap-4">
                        {/* Node Circle Indicator */}
                        <div className="relative flex flex-col items-center">
                          <div
                            className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold transition-all shadow-md ${
                              isCompleted
                                ? "bg-green-500 text-white ring-4 ring-green-100"
                                : isCurrent
                                ? "bg-blue-600 text-white ring-4 ring-blue-100 scale-105 animate-pulse"
                                : "bg-gray-200 text-gray-400"
                            }`}
                          >
                            {isCompleted ? "✓" : isCurrent ? "▶" : "🔒"}
                          </div>
                        </div>

                        {/* Lesson Card */}
                        <div
                          className={`flex-1 rounded-xl border p-4 transition-all ${
                            isCurrent
                              ? "border-blue-400 bg-blue-50/30 shadow-sm ring-1 ring-blue-400"
                              : isCompleted
                              ? "border-gray-200 bg-white hover:border-gray-300"
                              : "border-gray-200 bg-gray-50/50 opacity-60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                              Lesson {lessonIdx + 1}
                            </span>
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">
                              +{lesson.xpReward} XP
                            </span>
                          </div>

                          <h4 className="mt-1 font-bold text-gray-900">{lesson.title}</h4>
                          <p className="mt-1 text-xs text-gray-500 line-clamp-2">{lesson.description}</p>

                          <div className="mt-3">
                            {isLocked ? (
                              <span className="text-xs font-medium text-gray-400">
                                Complete previous level to unlock
                              </span>
                            ) : (
                              <Link
                                href={`/lesson/${lesson.id}`}
                                className={`inline-block rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                                  isCurrent
                                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                              >
                                {isCompleted ? "Review Lesson" : "Start Lesson"}
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
