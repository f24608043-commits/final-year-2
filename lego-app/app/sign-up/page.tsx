import Link from "next/link";
import { signUp } from "../auth/actions";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-8 shadow-sm">
        {/* Logo */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--brand-primary)] text-3xl shadow">
            🧱
          </div>
        </div>

        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">Create an Account</h1>
          <p className="mt-1 text-sm text-[var(--foreground-secondary)]">Join LEGO to start your learning adventure</p>
        </div>

        {/* Error Message */}
        {params.error && (
          <div className="mb-4 rounded-xl border border-[var(--error)] bg-[var(--error-light)] p-4 text-sm text-[var(--error)]">
            {params.error}
          </div>
        )}

        {/* Form */}
        <form action={signUp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Display Name</label>
            <input
              type="text"
              name="displayName"
              placeholder="Your name"
              className="mt-1 block w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Password</label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              placeholder="••••••••"
              className="mt-1 block w-full rounded-lg border border-[var(--border)] px-4 py-2.5 text-sm focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-[var(--brand-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-[var(--brand-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
          >
            Sign Up
          </button>
        </form>

        {/* Sign In Link */}
        <div className="mt-6 text-center text-sm text-[var(--foreground-secondary)]">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-[var(--brand-primary)] hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
