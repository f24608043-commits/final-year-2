"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";

interface UnifiedShellProps {
  children: React.ReactNode;
  role: "learner" | "tutor" | "admin";
  initialXp?: number;
  initialStreak?: number;
  initialDisplayName?: string;
}

export default function UnifiedShell({ 
  children, 
  role, 
  initialXp = 0, 
  initialStreak = 0, 
  initialDisplayName = "" 
}: UnifiedShellProps) {
  const pathname = usePathname();
  const [xp, setXp] = useState(initialXp);
  const [streak, setStreak] = useState(initialStreak);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [level, setLevel] = useState(Math.floor(Math.sqrt((initialXp || 0) / 100)) + 1);
  const [userId, setUserId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Only fetch if we don't have initial data (fallback for pages not using server-side data)
  useEffect(() => {
    if (initialXp > 0 || initialDisplayName) {
      return;
    }

    let mounted = true;
    async function loadUserData() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user && mounted) {
        setUserId(user.id);
        try {
          const response = await fetch(`/api/profile/${user.id}`, { 
            cache: 'no-store' // Ensure fresh data but don't block
          });
          if (response.ok && mounted) {
            const profile = await response.json();
            setXp(profile.xp || 0);
            setStreak(profile.streak_count || 0);
            setDisplayName(profile.display_name || "");
            setLevel(Math.floor(Math.sqrt((profile.xp || 0) / 100)) + 1);
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      }
    }
    loadUserData();
    return () => { mounted = false; };
  }, [initialXp, initialDisplayName]);

  // Role-specific configuration
  const isLearner = role === "learner";
  const isTutor = role === "tutor";
  const isAdmin = role === "admin";
  
  const logoIcon = isLearner ? "terminal" : isAdmin ? "admin_panel_settings" : "school";
  const roleLabel = isLearner ? "Learner Desk" : isAdmin ? "Admin Panel" : "Tutor Portal";
  const headerLabel = isLearner ? "Python Fundamentals" : isAdmin ? "Admin Dashboard" : "Tutoring Hub";
  const userRoleLabel = role.toUpperCase();

  // Nav config per role - used for both sidebar and bottom bar
  const navConfig = {
    learner: {
      sidebar: [
        { path: "/path", label: "Path", icon: "home" },
        { path: "/library", label: "Library", icon: "menu_book" },
        { path: "/tutoring", label: "Tutoring", icon: "groups" },
        { path: "/friends", label: "Friends", icon: "diversity_3" },
        { path: "/messages", label: "Messages", icon: "chat" },
      ],
      bottom: [
        { path: "/path", label: "Path", icon: "home" },
        { path: "/library", label: "Library", icon: "menu_book" },
        { path: "/tutoring", label: "Tutoring", icon: "groups" },
        { path: "/friends", label: "Friends", icon: "diversity_3" },
        { path: "/notifications", label: "Notifications", icon: "notifications" },
      ],
      more: [
        { path: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
        { path: "/settings", label: "Settings", icon: "settings" },
      ],
    },
    tutor: {
      sidebar: [
        { path: "/tutoring/dashboard", label: "Dashboard", icon: "dashboard" },
        { path: "/tutoring/history", label: "History", icon: "history" },
        { path: "/tutoring", label: "My Classes", icon: "groups" },
        { path: "/messages", label: "Messages", icon: "chat" },
      ],
      bottom: [
        { path: "/tutoring/dashboard", label: "Dashboard", icon: "dashboard" },
        { path: "/tutoring", label: "Sessions", icon: "groups" },
        { path: "/tutoring/learners", label: "Learners", icon: "people" },
        { path: "/tutoring/history", label: "History", icon: "history" },
        { path: "/profile", label: "Profile", icon: "person" },
      ],
      more: [
        { path: "/notifications", label: "Notifications", icon: "notifications" },
        { path: "/settings", label: "Settings", icon: "settings" },
      ],
    },
    admin: {
      sidebar: [
        { path: "/admin", label: "Dashboard", icon: "dashboard" },
        { path: "/admin/users", label: "Users", icon: "people" },
        { path: "/admin/courses", label: "Courses", icon: "school" },
        { path: "/admin/badges", label: "Badges", icon: "military_tech" },
        { path: "/admin/tutoring", label: "Tutoring", icon: "groups" },
        { path: "/messages", label: "Messages", icon: "chat" },
      ],
      bottom: [
        { path: "/admin", label: "Dashboard", icon: "dashboard" },
        { path: "/admin/users", label: "Users", icon: "people" },
        { path: "/admin/courses", label: "Courses", icon: "school" },
        { path: "/admin/badges", label: "Badges", icon: "military_tech" },
        { path: "/more", label: "More", icon: "more_horiz" },
      ],
      more: [
        { path: "/admin/tutoring", label: "Tutoring", icon: "groups" },
        { path: "/settings", label: "Settings", icon: "settings" },
      ],
    },
  };

  const currentConfig = navConfig[role];
  const navItems = currentConfig.sidebar;
  const bottomNavItems = currentConfig.bottom;
  const moreItems = currentConfig.more;

  const crossRoleLink = isLearner
    ? null // Learners don't see tutor/admin portal link
    : { path: "/path", label: "Learner View", icon: "home" };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar - Desktop: full, Tablet: icon-only, Mobile: hidden */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-64 bg-surface z-50 flex-col justify-between shadow-clay-surface border-r border-surface-border">
        <div className="flex flex-col">
          {/* Logo */}
          <div className="h-16 px-6 flex items-center gap-2">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-clay-primary ${isLearner ? 'bg-primary text-white' : isAdmin ? 'bg-error text-white' : 'bg-secondary text-white'}`}>
              <span className="material-symbols-outlined text-[22px]">{logoIcon}</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className={`font-label-lg tracking-tight font-extrabold uppercase ${isLearner ? 'text-primary' : isAdmin ? 'text-error' : 'text-secondary'}`}>LEGO</span>
              <span className="font-label-sm text-text-muted font-bold tracking-wide">Learn And Go</span>
            </div>
          </div>

          {/* Role Badge */}
          <div className="px-4 py-2">
            <div className={`px-4 py-1 rounded-full flex items-center gap-2 shadow-clay-surface ${isLearner ? 'bg-primary/10' : isAdmin ? 'bg-error/10' : 'bg-secondary/10'}`}>
              <span className={`w-2 h-2 rounded-full ${isLearner ? 'bg-primary' : isAdmin ? 'bg-error' : 'bg-secondary'}`}></span>
              <span className="font-label-sm uppercase tracking-wider text-text-primary font-bold">{roleLabel}</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-1 px-4 py-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-4 px-4 py-2 rounded-2xl transition-all ${
                  pathname === item.path
                    ? `bg-green-500 text-white font-bold shadow-clay-primary`
                    : "text-text-muted hover:bg-surface-border hover:text-text-primary font-label-md"
                }`}
                aria-current={pathname === item.path ? "page" : undefined}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            {crossRoleLink && (
              <>
                <div className="my-2 border-t border-surface-border"></div>
                <Link
                  href={crossRoleLink.path}
                  className={`flex items-center gap-4 px-4 py-2 rounded-2xl font-label-md hover:bg-surface-border hover:text-text-primary transition-all text-text-muted`}
                >
                  <span className="material-symbols-outlined text-[20px]">{crossRoleLink.icon}</span>
                  <span>{crossRoleLink.label}</span>
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* Settings */}
        <div className="flex flex-col gap-1 px-4 pb-6">
          <Link
            href="/settings"
            className="flex items-center gap-4 px-4 py-2 rounded-2xl text-text-muted hover:bg-surface-border hover:text-text-primary transition-all font-label-md"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Tablet Icon-Only Sidebar Rail */}
      <aside className="hidden md:flex lg:hidden fixed left-0 top-0 h-full w-16 bg-surface z-50 flex flex-col items-center py-4 shadow-clay-surface border-r border-surface-border">
        {/* Logo Icon */}
        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-clay-primary mb-4 ${isLearner ? 'bg-primary text-white' : isAdmin ? 'bg-error text-white' : 'bg-secondary text-white'}`}>
          <span className="material-symbols-outlined text-[20px]">{logoIcon}</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 flex-1 w-full px-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all ${
                pathname === item.path
                  ? `bg-green-500 text-white shadow-clay-primary`
                  : "text-text-muted hover:bg-surface-border hover:text-text-primary"
              }`}
              aria-label={item.label}
              aria-current={pathname === item.path ? "page" : undefined}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            </Link>
          ))}
        </nav>

        {/* Settings */}
        <div className="px-2">
          <Link
            href="/settings"
            className="flex items-center justify-center w-12 h-12 rounded-2xl text-text-muted hover:bg-surface-border hover:text-text-primary transition-all"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[20px]">settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content - Responsive padding */}
      <div className="flex-1 lg:pl-64 md:pl-16 pl-0">
        {/* Top Header - Mobile: slim, Desktop: full */}
        <header className="fixed top-0 left-0 right-0 lg:left-64 md:left-16 h-16 bg-surface/95 backdrop-blur-xl shadow-clay-surface z-40 flex items-center justify-between px-4 lg:px-6">
          {/* Mobile Menu Toggle & Logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-2xl bg-surface-border hover:bg-surface transition-colors"
              aria-label="Open menu"
            >
              <span className="material-symbols-outlined text-[24px] text-text-primary">menu</span>
            </button>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-clay-primary ${isLearner ? 'bg-primary text-white' : isAdmin ? 'bg-error text-white' : 'bg-secondary text-white'}`}>
              <span className="material-symbols-outlined text-[18px]">{logoIcon}</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className={`font-label-sm tracking-tight font-extrabold uppercase ${isLearner ? 'text-primary' : isAdmin ? 'text-error' : 'text-secondary'}`}>LEGO</span>
            </div>
          </div>


          <div className="flex items-center gap-3 lg:gap-6">
            {/* Notification Bell - Desktop */}
            <Link href="/notifications" className="hidden lg:flex relative group cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95">
              <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isLearner ? 'bg-gradient-to-br from-primary to-primary-dark text-white' : isAdmin ? 'bg-gradient-to-br from-error to-red-700 text-white' : 'bg-gradient-to-br from-secondary to-secondary-dark text-white'} shadow-xl border-2 border-white/40 group-hover:border-white/60`}>
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                {/* Unread count badge - will be populated client-side */}
                <span id="notification-badge" className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold border-2 border-white hidden items-center justify-center">0</span>
              </div>
            </Link>
            
            {/* Stats - Mobile: compact interactive badges, Desktop: magical full-size badges */}
            <div className="flex items-center gap-3">
              {/* Streak Badge - Desktop Magical Version */}
              <div className={`hidden lg:flex relative group cursor-pointer transition-all duration-500 hover:scale-110 active:scale-95`}>
                {/* Animated gradient glow */}
                <div className={`absolute inset-0 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500 animate-gradient-shift ${isLearner ? 'bg-gradient-to-r from-orange-400 via-red-500 to-orange-400' : isAdmin ? 'bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400' : 'bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400'}`}></div>
                
                {/* Main badge */}
                <div className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full font-label-md font-bold text-white shadow-2xl border-2 border-white/40 group-hover:border-white/60 transition-all duration-300 overflow-hidden ${isLearner ? 'bg-gradient-to-r from-orange-400 to-red-500' : isAdmin ? 'bg-gradient-to-r from-purple-400 to-pink-500' : 'bg-gradient-to-r from-blue-400 to-cyan-500'}`}>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                  
                  {/* Icon with pulse */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full animate-ping bg-white/30"></div>
                    <span className="material-symbols-outlined text-[22px] relative" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                  </div>
                  
                  {/* Value */}
                  <span className="relative">{streak}</span>
                  
                  {/* Label */}
                  <span className="relative font-label-sm font-normal opacity-90">streak</span>
                </div>
              </div>
              
              {/* XP Badge - Desktop Magical Version */}
              <div className={`hidden lg:flex relative group cursor-pointer transition-all duration-500 hover:scale-110 active:scale-95`}>
                {/* Animated gradient glow */}
                <div className={`absolute inset-0 rounded-full blur-xl opacity-60 group-hover:opacity-80 transition-opacity duration-500 animate-gradient-shift ${isLearner ? 'bg-gradient-to-r from-green-400 via-emerald-500 to-green-400' : isAdmin ? 'bg-gradient-to-r from-indigo-400 via-violet-500 to-indigo-400' : 'bg-gradient-to-r from-teal-400 via-green-500 to-teal-400'}`}></div>
                
                {/* Main badge */}
                <div className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full font-label-md font-bold text-white shadow-2xl border-2 border-white/40 group-hover:border-white/60 transition-all duration-300 overflow-hidden ${isLearner ? 'bg-gradient-to-r from-green-400 to-emerald-500' : isAdmin ? 'bg-gradient-to-r from-indigo-400 to-violet-500' : 'bg-gradient-to-r from-teal-400 to-green-500'}`}>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-shimmer"></div>
                  
                  {/* Icon */}
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full animate-ping bg-white/30"></div>
                    <span className="material-symbols-outlined text-[22px] relative" style={{ fontVariationSettings: 'FILL 1' }}>bolt</span>
                  </div>
                  
                  {/* Value */}
                  <span className="relative">{xp.toLocaleString()}</span>
                  
                  {/* Label */}
                  <span className="relative font-label-sm font-normal opacity-90">XP</span>
                </div>
              </div>
              
              {/* Mobile Compact Stats */}
              <div className="flex lg:hidden items-center gap-2">
                {/* Streak Badge */}
                <div className={`relative group cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95`}>
                  <div className={`absolute inset-0 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity ${isLearner ? 'bg-gradient-to-r from-orange-400 to-red-500' : isAdmin ? 'bg-gradient-to-r from-purple-400 to-pink-500' : 'bg-gradient-to-r from-blue-400 to-cyan-500'}`}></div>
                  <div className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-full font-label-sm font-bold ${isLearner ? 'bg-gradient-to-r from-orange-400 to-red-500 text-white' : isAdmin ? 'bg-gradient-to-r from-purple-400 to-pink-500 text-white' : 'bg-gradient-to-r from-blue-400 to-cyan-500 text-white'} shadow-lg border-2 border-white/30`}>
                    <span className="material-symbols-outlined text-[16px] animate-pulse" style={{ fontVariationSettings: 'FILL 1' }}>local_fire_department</span>
                    <span className="hidden sm:inline">{streak}</span>
                  </div>
                </div>
                
                {/* XP Badge */}
                <div className={`relative group cursor-pointer transition-all duration-300 hover:scale-110 active:scale-95`}>
                  <div className={`absolute inset-0 rounded-full blur-md opacity-50 group-hover:opacity-75 transition-opacity ${isLearner ? 'bg-gradient-to-r from-green-400 to-emerald-500' : isAdmin ? 'bg-gradient-to-r from-indigo-400 to-violet-500' : 'bg-gradient-to-r from-teal-400 to-green-500'}`}></div>
                  <div className={`relative flex items-center gap-1 px-2.5 py-1.5 rounded-full font-label-sm font-bold ${isLearner ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' : isAdmin ? 'bg-gradient-to-r from-indigo-400 to-violet-500 text-white' : 'bg-gradient-to-r from-teal-400 to-green-500 text-white'} shadow-lg border-2 border-white/30`}>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: 'FILL 1' }}>bolt</span>
                    <span className="hidden sm:inline">{xp.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* User Info - Mobile: interactive avatar, Desktop: magical full profile */}
            <Link href={userId ? `/profile/${userId}` : "#"} className="flex items-center gap-3 group">
              {/* Avatar */}
              <div className={`relative w-9 h-9 lg:w-12 lg:h-12 rounded-full flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 active:scale-95 ${isLearner ? 'bg-gradient-to-br from-primary via-green-400 to-primary-dark text-white' : isAdmin ? 'bg-gradient-to-br from-error via-pink-500 to-red-700 text-white' : 'bg-gradient-to-br from-secondary via-blue-400 to-secondary-dark text-white'} shadow-2xl border-3 border-white/40 group-hover:border-white/60 overflow-hidden`}>
                {/* Animated gradient background */}
                <div className={`absolute inset-0 animate-gradient-shift ${isLearner ? 'bg-gradient-to-br from-primary via-green-400 to-primary-dark' : isAdmin ? 'bg-gradient-to-br from-error via-pink-500 to-red-700' : 'bg-gradient-to-br from-secondary via-blue-400 to-secondary-dark'}`}></div>
                
                {/* Icon */}
                <span className="relative material-symbols-outlined text-[20px] lg:text-[26px]">{isLearner ? "person" : isAdmin ? "shield" : "supervised_user_circle"}</span>
                
                {/* Level indicator - Desktop */}
                <div className={`hidden lg:flex absolute -bottom-1 -right-1 w-7 h-7 rounded-full items-center justify-center text-[12px] font-bold border-2 border-white shadow-lg ${isLearner ? 'bg-primary' : isAdmin ? 'bg-error' : 'bg-secondary'}`}>
                  {level}
                </div>
              </div>
              
              {/* Desktop Profile Info */}
              <div className="hidden lg:flex flex-col">
                <span className="font-label-md text-text-primary leading-tight group-hover:text-primary transition-colors font-semibold">{displayName || (isLearner ? "Learner" : isAdmin ? "Admin" : "Tutor")}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-label-sm font-extrabold ${isLearner ? 'text-primary' : isAdmin ? 'text-error' : 'text-secondary'}`}>LVL {level}</span>
                  <span className="font-label-sm text-text-muted">•</span>
                  <span className="font-label-sm text-text-muted uppercase tracking-wider font-bold">{userRoleLabel}</span>
                </div>
              </div>
            </Link>
          </div>
        </header>

        {/* Page Content - Add bottom padding for mobile bottom bar */}
        <main className="relative pt-16 min-h-screen w-full px-4 py-6 lg:px-6 lg:py-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-surface z-50 lg:hidden shadow-2xl flex flex-col">
            {/* Header */}
            <div className="h-16 px-4 flex items-center justify-between border-b border-surface-border">
              <div className="flex items-center gap-2">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-clay-primary ${isLearner ? 'bg-primary text-white' : isAdmin ? 'bg-error text-white' : 'bg-secondary text-white'}`}>
                  <span className="material-symbols-outlined text-[22px]">{logoIcon}</span>
                </div>
                <div className="flex flex-col leading-none">
                  <span className={`font-label-lg tracking-tight font-extrabold uppercase ${isLearner ? 'text-primary' : isAdmin ? 'text-error' : 'text-secondary'}`}>LEGO</span>
                  <span className="font-label-sm text-text-muted font-bold tracking-wide">Learn And Go</span>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-surface-border transition-colors"
                aria-label="Close menu"
              >
                <span className="material-symbols-outlined text-[24px] text-text-primary">close</span>
              </button>
            </div>

            {/* Role Badge */}
            <div className="px-4 py-3 border-b border-surface-border">
              <div className={`px-4 py-2 rounded-full flex items-center gap-2 shadow-clay-surface ${isLearner ? 'bg-primary/10' : isAdmin ? 'bg-error/10' : 'bg-secondary/10'}`}>
                <span className={`w-2 h-2 rounded-full ${isLearner ? 'bg-primary' : isAdmin ? 'bg-error' : 'bg-secondary'}`}></span>
                <span className="font-label-sm uppercase tracking-wider text-text-primary font-bold">{roleLabel}</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex flex-col gap-1 px-4 py-4 flex-1 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${
                    pathname === item.path
                      ? `bg-primary text-white font-bold shadow-clay-primary`
                      : "text-text-muted hover:bg-surface-border hover:text-text-primary font-label-md"
                  }`}
                  aria-current={pathname === item.path ? "page" : undefined}
                >
                  <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                  <span className="font-label-md">{item.label}</span>
                </Link>
              ))}
              
              {/* More Items */}
              <div className="my-2 border-t border-surface-border"></div>
              {moreItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-4 px-4 py-3 rounded-2xl text-text-muted hover:bg-surface-border hover:text-text-primary font-label-md transition-all"
                >
                  <span className="material-symbols-outlined text-[24px]">{item.icon}</span>
                  <span className="font-label-md">{item.label}</span>
                </Link>
              ))}
            </nav>

            {/* User Info */}
            <div className="px-4 py-4 border-t border-surface-border">
              <Link
                href={userId ? `/profile/${userId}` : "#"}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-surface-border transition-colors"
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-clay-primary ${isLearner ? 'bg-primary text-white' : isAdmin ? 'bg-error text-white' : 'bg-secondary text-white'}`}>
                  <span className="material-symbols-outlined text-[22px]">{isLearner ? "person" : isAdmin ? "shield" : "supervised_user_circle"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-text-primary leading-tight">{displayName || (isLearner ? "Learner" : isAdmin ? "Admin" : "Tutor")}</span>
                  <div className="flex items-center gap-1">
                    <span className={`font-label-sm font-extrabold ${isLearner ? 'text-primary' : isAdmin ? 'text-error' : 'text-secondary'}`}>LVL {level}</span>
                    <span className="font-label-sm text-text-muted">•</span>
                    <span className="font-label-sm text-text-muted uppercase tracking-wider font-bold">{userRoleLabel}</span>
                  </div>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Bar */}
      <nav className="lg:hidden md:hidden fixed bottom-0 left-0 right-0 h-16 bg-surface/95 backdrop-blur-xl shadow-clay-surface z-50 flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom)] border-t border-surface-border">
        {bottomNavItems.map((item) => (
          <Link
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center justify-center min-w-[44px] min-h-[44px] rounded-2xl transition-all ${
              pathname === item.path
                ? `text-primary`
                : "text-text-muted"
            }`}
            aria-label={item.label}
            aria-current={pathname === item.path ? "page" : undefined}
          >
            <span className={`material-symbols-outlined text-[24px] ${pathname === item.path ? 'fill' : ''}`}>{item.icon}</span>
            <span className="font-label-xs mt-0.5">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
