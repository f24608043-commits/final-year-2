import { db } from "@/db";
import { profiles, userProgress, userBadges, badges, friendships } from "@/db/schema";
import { eq, and, desc, or, inArray } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { sendFriendRequest } from "@/app/friends/actions";

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const supabase = await createClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  
  const targetUserId = params.userId;

  // Get target user profile
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, targetUserId))
    .limit(1);

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">User Not Found</h1>
        <p>This user profile does not exist.</p>
      </div>
    );
  }

  // Get user's completed lessons count
  const completedLessons = await db
    .select({ count: userProgress.lessonId })
    .from(userProgress)
    .where(
      and(
        eq(userProgress.userId, targetUserId),
        eq(userProgress.status, "completed")
      )
    );

  // Get user's earned badges
  const userBadgesData = await db
    .select({
      id: badges.id,
      name: badges.name,
      description: badges.description,
    })
    .from(userBadges)
    .innerJoin(badges, eq(userBadges.badgeId, badges.id))
    .where(eq(userBadges.userId, targetUserId));

  // Get all badges for earned vs locked display
  const allBadges = await db
    .select({
      id: badges.id,
      name: badges.name,
      description: badges.description,
      criteriaType: badges.criteriaType,
      criteriaValue: badges.criteriaValue,
    })
    .from(badges);

  const earnedBadgeIds = userBadgesData.map((b: any) => b.id);
  const lockedBadges = allBadges.filter((b: any) => !earnedBadgeIds.includes(b.id));

  // Check friendship status
  let friendshipStatus = null;
  if (currentUser) {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(
            eq(friendships.requesterId, currentUser.id),
            eq(friendships.addresseeId, targetUserId)
          ),
          and(
            eq(friendships.requesterId, targetUserId),
            eq(friendships.addresseeId, currentUser.id)
          )
        )
      )
      .limit(1);

    if (friendship) {
      friendshipStatus = friendship.status;
    }
  }

  const isOwnProfile = currentUser?.id === targetUserId;

  return (
    <div className="container mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-8 rounded-lg mb-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl text-purple-600">
            {profile.displayName?.[0] || "?"}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{profile.displayName || "Anonymous"}</h1>
            <p className="text-lg opacity-90">{profile.xp} XP • 🔥 {profile.streakCount} day streak</p>
            <p className="text-sm opacity-75">Role: {profile.role}</p>
          </div>
          
          {!isOwnProfile && currentUser && (
            <div>
              {friendshipStatus === "accepted" ? (
                <span className="px-4 py-2 bg-white text-purple-600 rounded-full font-medium">
                  ✅ Friends
                </span>
              ) : friendshipStatus === "pending" ? (
                <span className="px-4 py-2 bg-white text-purple-600 rounded-full font-medium">
                  ⏳ Pending
                </span>
              ) : friendshipStatus === "blocked" ? (
                <span className="px-4 py-2 bg-red-500 text-white rounded-full font-medium">
                  🚫 Blocked
                </span>
              ) : (
                <form action={async () => {
                  "use server";
                  await sendFriendRequest(targetUserId);
                }}>
                  <button className="px-4 py-2 bg-white text-purple-600 rounded-full font-medium hover:bg-purple-100">
                    Add Friend
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-gray-500 text-sm font-medium">Total XP</h3>
          <p className="text-3xl font-bold text-purple-600">{profile.xp}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-gray-500 text-sm font-medium">Lessons Completed</h3>
          <p className="text-3xl font-bold text-green-600">{completedLessons.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-gray-500 text-sm font-medium">Current Streak</h3>
          <p className="text-3xl font-bold text-orange-500">{profile.streakCount} days</p>
        </div>
      </div>

      {/* Badges Section */}
      <div className="bg-white rounded-lg shadow border mb-6">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Badges ({userBadgesData.length}/{allBadges.length})</h2>
        </div>
        
        {allBadges.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No badges available
          </div>
        ) : (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-600 mb-3">Earned Badges</h3>
            {userBadgesData.length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded mb-4">
                No badges earned yet
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {userBadgesData.map((badge: any) => (
                  <div key={badge.id} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl shadow-md">
                      🏆
                    </div>
                    <p className="font-medium text-sm">{badge.name}</p>
                    <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-sm font-semibold text-gray-600 mb-3">Locked Badges</h3>
            {lockedBadges.length === 0 ? (
              <div className="p-4 text-center text-gray-500 bg-gray-50 rounded">
                All badges earned! 🎉
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {lockedBadges.map((badge: any) => (
                  <div key={badge.id} className="text-center p-4 bg-gray-100 rounded-lg border border-gray-200 opacity-60">
                    <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl">
                      🔒
                    </div>
                    <p className="font-medium text-sm text-gray-600">{badge.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Recent Activity</h2>
        </div>
        
        <div className="p-6 text-center text-gray-500">
          Activity tracking coming soon
        </div>
      </div>
    </div>
  );
}
