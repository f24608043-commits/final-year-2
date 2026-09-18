import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { courses, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { completeOnboarding } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Check if user has already completed onboarding AND fetch published courses in parallel
  const [userProfileResult, publishedCourses] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1),
    db.select().from(courses).where(eq(courses.isPublished, true))
  ]);

  const userProfile = userProfileResult[0];

  if (userProfile?.onboardingDone) {
    redirect("/path");
  }

  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-8 shadow-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-primary-light)] px-4 py-1.5 text-xs font-semibold text-[var(--brand-primary)]">
            <span>👋</span>
            <span>Welcome, {userProfile?.displayName || user.email?.split("@")[0]}!</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold text-[var(--foreground)]">Personalize Your Path</h1>
          <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
            Set up your learning goals and select the subjects you want to master.
          </p>
        </div>

        {/* Error Message */}
        {params.error && (
          <div className="mb-6 rounded-xl border border-[var(--error)] bg-[var(--error-light)] p-4 text-sm text-[var(--error)]">
            {params.error}
          </div>
        )}

        <form action={completeOnboarding} className="space-y-8">
          {/* 1. Course Selection */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">1. Select Your Courses</h2>
            <p className="text-xs text-[var(--foreground-secondary)]">Pick one or more courses to add to your library.</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {publishedCourses.map((c, index) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border)] p-4 hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)] has-checked:border-[var(--brand-primary)] has-checked:bg-[var(--brand-primary-light)] transition-all"
                >
                  <input
                    type="checkbox"
                    name="courseIds"
                    value={c.id}
                    defaultChecked={index === 0}
                    className="mt-1 h-4 w-4 rounded border-[var(--border)] text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                  />
                  <div>
                    <div className="font-medium text-[var(--foreground)]">{c.title}</div>
                    <div className="mt-1 text-xs text-[var(--foreground-secondary)] line-clamp-2">{c.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Placement Assessment */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">2. What is your coding background?</h2>
            <p className="text-xs text-[var(--foreground-secondary)]">Helps us recommend pacing and practice challenges.</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { id: "beginner", title: "Complete Beginner", desc: "Never written code before" },
                { id: "intermediate", title: "Some Experience", desc: "Know basic syntax and loops" },
                { id: "advanced", title: "Experienced", desc: "Comfortable with software concepts" },
              ].map((level) => (
                <label
                  key={level.id}
                  className="flex cursor-pointer flex-col rounded-xl border border-[var(--border)] p-4 hover:border-[var(--brand-primary)] has-checked:border-[var(--brand-primary)] has-checked:bg-[var(--brand-primary-light)] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[var(--foreground)]">{level.title}</span>
                    <input
                      type="radio"
                      name="placementAnswer"
                      value={level.id}
                      defaultChecked={level.id === "beginner"}
                      className="h-4 w-4 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                    />
                  </div>
                  <span className="mt-1 text-xs text-[var(--foreground-secondary)]">{level.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Daily Goal Picker */}
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">3. Set Your Daily Time Goal</h2>
            <p className="text-xs text-[var(--foreground-secondary)]">Consistent daily practice builds your learning streak.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { mins: 10, label: "Casual", time: "10 mins/day" },
                { mins: 15, label: "Regular", time: "15 mins/day" },
                { mins: 30, label: "Serious", time: "30 mins/day" },
                { mins: 60, label: "Intense", time: "60 mins/day" },
              ].map((goal) => (
                <label
                  key={goal.mins}
                  className="flex cursor-pointer flex-col items-center rounded-xl border border-[var(--border)] p-3 text-center hover:border-[var(--brand-primary)] has-checked:border-[var(--brand-primary)] has-checked:bg-[var(--brand-primary-light)] transition-all"
                >
                  <input
                    type="radio"
                    name="dailyGoalMinutes"
                    value={goal.mins}
                    defaultChecked={goal.mins === 15}
                    className="mb-2 h-4 w-4 text-[var(--brand-primary)] focus:ring-[var(--brand-primary)]"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                    {goal.label}
                  </span>
                  <span className="mt-0.5 text-sm font-semibold text-[var(--foreground)]">{goal.time}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--brand-primary)] py-3 text-base font-semibold text-white shadow-md hover:bg-[var(--brand-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
          >
            Start My Learning Journey →
          </button>
        </form>
      </div>
    </div>
  );
}
