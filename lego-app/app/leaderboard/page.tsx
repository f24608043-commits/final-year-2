import { getGlobalLeaderboard, getStreakLeaderboard, getUserRank } from "./actions";
import { createClient } from "@/utils/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const [globalLeaderboard, streakLeaderboard, userRank] = await Promise.all([
    getGlobalLeaderboard(50),
    getStreakLeaderboard(50),
    user ? getUserRank(user.id) : Promise.resolve(null)
  ]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <h1 className="text-2xl font-bold text-[var(--foreground)] mb-6">Leaderboards</h1>
      
      {/* User's Rank */}
      {userRank && (
        <div className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white p-6 rounded-2xl mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-90">Your Global Rank</p>
              <p className="text-3xl font-bold">#{userRank.rank}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-90">Total XP</p>
              <p className="text-2xl font-bold">{userRank.xp}</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-6 border-b border-[var(--border-light)]">
        <button className="px-4 py-2 border-b-2 border-[var(--brand-primary)] text-[var(--brand-primary)] font-medium">
          Global XP
        </button>
        <button className="px-4 py-2 text-[var(--foreground-muted)] hover:text-[var(--brand-primary)] transition-colors">
          Streaks
        </button>
        <button className="px-4 py-2 text-[var(--foreground-muted)] hover:text-[var(--brand-primary)] transition-colors">
          Units
        </button>
      </div>

      {/* Global XP Leaderboard */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] shadow-sm">
        <div className="p-4 border-b border-[var(--border-light)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Global XP Leaderboard</h2>
          <p className="text-sm text-[var(--foreground-secondary)]">Top learners by total XP</p>
        </div>
        
        <div className="divide-y divide-[var(--border-light)]">
          {globalLeaderboard.map((learner: any, index: number) => (
            <div 
              key={learner.id} 
              className={`p-4 flex items-center gap-4 ${
                user?.id === learner.id ? 'bg-[var(--brand-primary-light)]' : ''
              }`}
            >
              <div className="w-8 text-center font-bold text-[var(--foreground-muted)]">
                {index + 1}
              </div>
              
              <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-full flex items-center justify-center text-white font-bold">
                {learner.displayName?.[0] || "?"}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--foreground)] truncate">{learner.displayName || "Anonymous"}</p>
                <p className="text-sm text-[var(--foreground-muted)]">🔥 {learner.streakCount} day streak</p>
              </div>
              
              <div className="text-right shrink-0">
                <p className="font-bold text-[var(--brand-primary)]">{learner.xp} XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Streak Leaderboard */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] shadow-sm mt-6">
        <div className="p-4 border-b border-[var(--border-light)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Streak Leaderboard</h2>
          <p className="text-sm text-[var(--foreground-secondary)]">Top learners by consecutive days</p>
        </div>
        
        <div className="divide-y divide-[var(--border-light)]">
          {streakLeaderboard.map((learner: any, index: number) => (
            <div 
              key={learner.id} 
              className={`p-4 flex items-center gap-4 ${
                user?.id === learner.id ? 'bg-[var(--brand-primary-light)]' : ''
              }`}
            >
              <div className="w-8 text-center font-bold text-[var(--foreground-muted)]">
                {index + 1}
              </div>
              
              <div className="w-10 h-10 bg-[var(--brand-primary)] rounded-full flex items-center justify-center text-white font-bold">
                {learner.displayName?.[0] || "?"}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--foreground)] truncate">{learner.displayName || "Anonymous"}</p>
                <p className="text-sm text-[var(--foreground-muted)]">{learner.xp} total XP</p>
              </div>
              
              <div className="text-right shrink-0">
                <p className="font-bold text-[var(--warning)]">🔥 {learner.streakCount} days</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
