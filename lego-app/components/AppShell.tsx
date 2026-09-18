"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/app/auth/actions";

interface AppShellProps {
  children: React.ReactNode;
  user?: {
    id: string;
    displayName: string | null;
    email: string;
    role: "learner" | "tutor" | "admin";
    xp: number;
    streakCount: number;
  };
}

export default function AppShell({ children, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  if (!user) {
    return <>{children}</>;
  }

  const isLearner = user.role === "learner";
  const isTutor = user.role === "tutor";
  const isAdmin = user.role === "admin";

  const learnerNav = [
    { href: "/path", label: "Learning Path", icon: "📚" },
    { href: "/library", label: "Library", icon: "📖" },
    { href: "/friends", label: "Friends", icon: "👥" },
    { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
    { href: "/profile/" + user.id, label: "Profile", icon: "👤" },
  ];

  const tutorNav = [
    { href: "/tutoring", label: "Tutoring", icon: "🎓" },
    { href: "/tutoring/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/tutoring/history", label: "History", icon: "📅" },
    { href: "/friends", label: "Friends", icon: "👥" },
    { href: "/profile/" + user.id, label: "Profile", icon: "👤" },
  ];

  const adminNav = [
    { href: "/admin", label: "Admin Panel", icon: "⚙️" },
    { href: "/admin/users", label: "Users", icon: "👥" },
    { href: "/admin/courses", label: "Courses", icon: "📚" },
    { href: "/admin/badges", label: "Badges", icon: "🏅" },
    { href: "/admin/tutoring", label: "Tutoring", icon: "🎓" },
  ];

  const navItems = isAdmin ? adminNav : isTutor ? tutorNav : learnerNav;

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[var(--background-card)] border-r border-[var(--border)] transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3 p-6 border-b border-[var(--border)]">
            <div className="text-3xl">🧱</div>
            <div>
              <h1 className="text-xl font-bold text-[var(--foreground)]">LEGO</h1>
              <p className="text-xs text-[var(--foreground-secondary)]">Learn And Go</p>
            </div>
          </div>

          {/* User Stats */}
          <div className="p-4 border-b border-[var(--border)] bg-[var(--background-secondary)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--brand-primary)] flex items-center justify-center text-white font-bold">
                {user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--foreground)] truncate">
                  {user.displayName || user.email.split("@")[0]}
                </p>
                <p className="text-xs text-[var(--foreground-secondary)] capitalize">{user.role}</p>
              </div>
            </div>
            <div className="flex gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">⚡</span>
                <span className="text-[var(--foreground)]">{user.xp} XP</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-orange-500">🔥</span>
                <span className="text-[var(--foreground)]">{user.streakCount} day streak</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive
                          ? "bg-[var(--brand-primary)] text-white"
                          : "text-[var(--foreground-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--foreground)]"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-[var(--border)]">
            <form
              action={async () => {
                await signOut();
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[var(--error)] hover:bg-[var(--error-light)] transition-colors"
              >
                <span>🚪</span>
                <span className="font-medium">Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between p-4 bg-[var(--background-card)] border-b border-[var(--border)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-[var(--background-secondary)]"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🧱</span>
            <span className="font-bold text-[var(--foreground)]">LEGO</span>
          </div>
          <div className="w-10" />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
