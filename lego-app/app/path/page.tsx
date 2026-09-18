import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { courses, enrollments, lessons, profiles, units, userProgress } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function PathPage() {
  const startTime = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // 1. Verify user profile and onboarding status AND fetch enrollments in parallel
  const [profileResult, userEnrollments] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1),
    db.select().from(enrollments).where(eq(enrollments.userId, user.id))
  ]);

  const profile = profileResult[0];

  console.log("[PATH] Profile:", profile ? { id: profile.id, onboardingDone: profile.onboardingDone, role: profile.role } : "NOT FOUND");
  console.log("[PATH] Enrollments count:", userEnrollments.length);

  if (!profile) {
    console.error("[PATH] Profile not found for user:", user.id);
    redirect("/onboarding");
  }

  if (!profile.onboardingDone) {
    console.log("[PATH] Onboarding not done, redirecting to onboarding");
    redirect("/onboarding");
  }

  const activeEnrollment = userEnrollments.find((e) => e.isActive) || userEnrollments[0];

  if (!activeEnrollment) {
    console.log("[PATH] No enrollment found, redirecting to onboarding");
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

  // 5. Fetch lessons and progress in parallel (they're independent)
  const [courseLessons, progressRows] = await Promise.all([
    unitIds.length > 0
      ? db
          .select()
          .from(lessons)
          .where(inArray(lessons.unitId, unitIds))
          .orderBy(asc(lessons.orderIndex))
      : Promise.resolve([]),
    unitIds.length > 0
      ? db
          .select()
          .from(userProgress)
          .where(
            and(
              eq(userProgress.userId, user.id),
              inArray(userProgress.lessonId, unitIds) // Will filter by actual lesson IDs after
            )
          )
      : Promise.resolve([])
  ]);

  const lessonIds = courseLessons.map((l) => l.id);
  const filteredProgressRows = progressRows.filter(p => lessonIds.includes(p.lessonId));

  const progressMap = new Map(filteredProgressRows.map((p) => [p.lessonId, p.status]));

  const endTime = Date.now();
  console.log(`[PERF] Path page server render time: ${endTime - startTime}ms`);

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
    <div className="p-6 lg:p-8">
      {/* Course Header */}
      <div className="mb-8 rounded-2xl border border-[var(--border-light)] bg-[var(--background-card)] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="inline-block rounded-full bg-[var(--brand-primary-light)] px-3 py-1 text-xs font-bold text-[var(--brand-primary-dark)] mb-2">
              Active Course
            </span>
            <h1 className="text-2xl font-bold text-[var(--foreground)]">{course.title}</h1>
            <p className="mt-1 text-sm text-[var(--foreground-secondary)]">{course.description}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--brand-primary)]">
                {orderedLessonsWithUnit.filter(i => i.state === "completed").length}
              </div>
              <div className="text-xs text-[var(--foreground-muted)]">Completed</div>
            </div>
            <div className="h-10 w-px bg-[var(--border)]"></div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--foreground)]">
                {orderedLessonsWithUnit.length}
              </div>
              <div className="text-xs text-[var(--foreground-muted)]">Total Lessons</div>
            </div>
          </div>
        </div>
      </div>

      {/* Units and Lessons */}
      <div className="space-y-6">
        {courseUnits.map((unit, unitIdx) => {
          const unitItems = orderedLessonsWithUnit.filter((i) => i.unit.id === unit.id);
          const completedInUnit = unitItems.filter(i => i.state === "completed").length;

          return (
            <div key={unit.id} className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden shadow-sm">
              {/* Unit Header */}
              <div className="border-b border-[var(--border-light)] bg-[var(--background-secondary)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-white font-bold">
                      {unitIdx + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-[var(--foreground)]">{unit.title}</h3>
                      <p className="text-xs text-[var(--foreground-secondary)]">
                        {completedInUnit}/{unitItems.length} lessons completed
                      </p>
                    </div>
                  </div>
                  <div className="h-2 w-24 rounded-full bg-[var(--border-light)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--success)] transition-all"
                      style={{ width: `${(completedInUnit / unitItems.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Lessons List */}
              <div className="divide-y divide-[var(--border-light)]">
                {unitItems.map((item, lessonIdx) => {
                  const { lesson, state } = item;
                  const isCompleted = state === "completed";
                  const isCurrent = state === "current";
                  const isLocked = state === "locked";

                  return (
                    <Link
                      key={lesson.id}
                      href={isLocked ? "#" : `/lesson/${lesson.id}`}
                      className={`block p-4 transition-colors ${
                        isLocked ? "opacity-50 cursor-not-allowed" : "hover:bg-[var(--background-secondary)]"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        {/* Status Icon */}
                        <div
                          className={`flex h-12 w-12 items-center justify-center rounded-full text-lg ${
                            isCompleted
                              ? "bg-[var(--success-light)] text-[var(--success)]"
                              : isCurrent
                              ? "bg-[var(--brand-primary)] text-white"
                              : "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
                          }`}
                        >
                          {isCompleted ? "✓" : isCurrent ? "▶" : "🔒"}
                        </div>

                        {/* Lesson Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-[var(--foreground-muted)] uppercase">
                              Lesson {lessonIdx + 1}
                            </span>
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-bold text-yellow-800">
                              +{lesson.xpReward} XP
                            </span>
                          </div>
                          <h4 className="font-semibold text-[var(--foreground)] truncate">{lesson.title}</h4>
                          <p className="text-sm text-[var(--foreground-secondary)] line-clamp-1">{lesson.description}</p>
                        </div>

                        {/* Arrow */}
                        {!isLocked && (
                          <div className="text-[var(--foreground-muted)]">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
