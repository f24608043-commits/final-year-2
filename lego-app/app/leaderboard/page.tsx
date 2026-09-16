import { getGlobalLeaderboard, getStreakLeaderboard, getUserRank } from "./actions";
import { createClient } from "@/utils/supabase/server";

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const globalLeaderboard = await getGlobalLeaderboard(50);
  const streakLeaderboard = await getStreakLeaderboard(50);
  
  const userRank = user ? await getUserRank(user.id) : null;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Leaderboards</h1>
      
      {/* User's Rank */}
      {userRank && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-4 rounded-lg mb-6">
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
      <div className="flex gap-4 mb-6 border-b">
        <button className="px-4 py-2 border-b-2 border-purple-500 text-purple-600 font-medium">
          Global XP
        </button>
        <button className="px-4 py-2 text-gray-600 hover:text-purple-600">
          Streaks
        </button>
        <button className="px-4 py-2 text-gray-600 hover:text-purple-600">
          Units
        </button>
      </div>

      {/* Global XP Leaderboard */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Global XP Leaderboard</h2>
          <p className="text-sm text-gray-500">Top learners by total XP</p>
        </div>
        
        <div className="divide-y">
          {globalLeaderboard.map((learner: any, index: number) => (
            <div 
              key={learner.id} 
              className={`p-4 flex items-center gap-4 ${
                user?.id === learner.id ? 'bg-purple-50' : ''
              }`}
            >
              <div className="w-8 text-center font-bold text-gray-500">
                {index + 1}
              </div>
              
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {learner.displayName?.[0] || "?"}
              </div>
              
              <div className="flex-1">
                <p className="font-medium">{learner.displayName || "Anonymous"}</p>
                <p className="text-sm text-gray-500">🔥 {learner.streakCount} day streak</p>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-purple-600">{learner.xp} XP</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Streak Leaderboard */}
      <div className="bg-white rounded-lg shadow border mt-6">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Streak Leaderboard</h2>
          <p className="text-sm text-gray-500">Top learners by consecutive days</p>
        </div>
        
        <div className="divide-y">
          {streakLeaderboard.map((learner: any, index: number) => (
            <div 
              key={learner.id} 
              className={`p-4 flex items-center gap-4 ${
                user?.id === learner.id ? 'bg-purple-50' : ''
              }`}
            >
              <div className="w-8 text-center font-bold text-gray-500">
                {index + 1}
              </div>
              
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                {learner.displayName?.[0] || "?"}
              </div>
              
              <div className="flex-1">
                <p className="font-medium">{learner.displayName || "Anonymous"}</p>
                <p className="text-sm text-gray-500">{learner.xp} total XP</p>
              </div>
              
              <div className="text-right">
                <p className="font-bold text-orange-500">🔥 {learner.streakCount} days</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
