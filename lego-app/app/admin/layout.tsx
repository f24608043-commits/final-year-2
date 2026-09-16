import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "admin") {
    redirect("/?error=admin_only");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="text-lg font-extrabold text-blue-700">🎓 LEGO Admin</span>
            <nav className="hidden items-center gap-4 sm:flex">
              <Link href="/admin/users" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                Users
              </Link>
              <Link href="/admin/badges" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                Badges
              </Link>
              <Link href="/admin/courses" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                Courses
              </Link>
              <Link href="/admin/tutoring" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                Tutoring
              </Link>
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-blue-600">
                ← Back to App
              </Link>
            </nav>
          </div>
          <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
            Admin Mode
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
