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

  // Check if user has already completed onboarding
  const [userProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (userProfile?.onboardingDone) {
    redirect("/path");
  }

  // Fetch published courses for selection
  const publishedCourses = await db
    .select()
    .from(courses)
    .where(eq(courses.isPublished, true));

  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            Welcome, {userProfile?.displayName || user.email?.split("@")[0]}!
          </div>
          <h1 className="mt-2 text-3xl font-extrabold text-gray-900">Personalize Your Path</h1>
          <p className="mt-1 text-sm text-gray-500">
            Set up your learning goals and select the subjects you want to master.
          </p>
        </div>

        {params.error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {params.error}
          </div>
        )}

        <form action={completeOnboarding} className="space-y-8">
          {/* 1. Course Selection */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">1. Select Your Courses</h2>
            <p className="text-xs text-gray-500">Pick one or more courses to add to your library.</p>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {publishedCourses.map((c, index) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 hover:border-blue-500 hover:bg-blue-50/50 has-checked:border-blue-600 has-checked:bg-blue-50"
                >
                  <input
                    type="checkbox"
                    name="courseIds"
                    value={c.id}
                    defaultChecked={index === 0}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{c.title}</div>
                    <div className="mt-1 text-xs text-gray-500 line-clamp-2">{c.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* 2. Placement Assessment */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">2. What is your coding background?</h2>
            <p className="text-xs text-gray-500">Helps us recommend pacing and practice challenges.</p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {[
                { id: "beginner", title: "Complete Beginner", desc: "Never written code before" },
                { id: "intermediate", title: "Some Experience", desc: "Know basic syntax and loops" },
                { id: "advanced", title: "Experienced", desc: "Comfortable with software concepts" },
              ].map((level) => (
                <label
                  key={level.id}
                  className="flex cursor-pointer flex-col rounded-xl border border-gray-200 p-4 hover:border-blue-500 has-checked:border-blue-600 has-checked:bg-blue-50"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">{level.title}</span>
                    <input
                      type="radio"
                      name="placementAnswer"
                      value={level.id}
                      defaultChecked={level.id === "beginner"}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <span className="mt-1 text-xs text-gray-500">{level.desc}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 3. Daily Goal Picker */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900">3. Set Your Daily Time Goal</h2>
            <p className="text-xs text-gray-500">Consistent daily practice builds your learning streak.</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { mins: 10, label: "Casual", time: "10 mins/day" },
                { mins: 15, label: "Regular", time: "15 mins/day" },
                { mins: 30, label: "Serious", time: "30 mins/day" },
                { mins: 60, label: "Intense", time: "60 mins/day" },
              ].map((goal) => (
                <label
                  key={goal.mins}
                  className="flex cursor-pointer flex-col items-center rounded-xl border border-gray-200 p-3 text-center hover:border-blue-500 has-checked:border-blue-600 has-checked:bg-blue-50"
                >
                  <input
                    type="radio"
                    name="dailyGoalMinutes"
                    value={goal.mins}
                    defaultChecked={goal.mins === 15}
                    className="mb-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {goal.label}
                  </span>
                  <span className="mt-0.5 text-sm font-semibold text-gray-900">{goal.time}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-blue-600 py-3 text-base font-semibold text-white shadow-md hover:bg-blue-700 focus:outline-none"
          >
            Start My Learning Journey →
          </button>
        </form>
      </div>
    </div>
  );
}
