import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Home() {
  const startTime = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const endTime = Date.now();
  console.log(`[PERF] Home page server render time: ${endTime - startTime}ms`);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] p-6 text-center">
      <div className="max-w-md w-full rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-8 shadow-sm">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-4xl shadow-lg">
            🧱
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-extrabold text-[var(--foreground)] mb-2">LEGO</h1>
        <p className="text-sm text-[var(--foreground-secondary)] mb-8">
          Learn And Go — AI-powered, gamified learning with video lessons, quizzes, and live tutoring.
        </p>

        {/* CTA Buttons */}
        <div className="space-y-3">
          {user ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-[var(--success)] bg-[var(--success-light)] p-4 text-sm text-[var(--success)]">
                <p className="font-semibold">Welcome back!</p>
                <p className="text-xs mt-1">Signed in as {user.email}</p>
              </div>
              <Link
                href="/path"
                className="block w-full rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-primary-dark)] shadow transition-colors"
              >
                Continue Learning →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href="/sign-up"
                className="block w-full rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--brand-primary-dark)] shadow transition-colors"
              >
                Get Started Free
              </Link>
              <Link
                href="/sign-in"
                className="block w-full rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-8 pt-8 border-t border-[var(--border-light)]">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl mb-1">📚</div>
              <p className="text-xs font-semibold text-[var(--foreground)]">Video Lessons</p>
            </div>
            <div>
              <div className="text-2xl mb-1">🎯</div>
              <p className="text-xs font-semibold text-[var(--foreground)]">Interactive Quizzes</p>
            </div>
            <div>
              <div className="text-2xl mb-1">👨‍🏫</div>
              <p className="text-xs font-semibold text-[var(--foreground)]">Live Tutoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
