import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { signOut } from "./auth/actions";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-6 text-center">
      <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-4 inline-block rounded-full bg-blue-100 p-3 text-2xl">
          🧱
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900">LEGO</h1>
        <p className="mt-2 text-sm text-gray-600">
          Learn And Go — AI-powered, gamified learning with video lessons, quizzes, and live tutoring.
        </p>

        <div className="mt-8">
          {user ? (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-3 text-sm text-green-700 border border-green-200">
                Signed in as <span className="font-semibold">{user.email}</span>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/path"
                  className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow"
                >
                  Go to Learning Path
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Sign Out
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                href="/sign-up"
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 shadow"
              >
                Get Started
              </Link>
              <Link
                href="/sign-in"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                I already have an account
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
