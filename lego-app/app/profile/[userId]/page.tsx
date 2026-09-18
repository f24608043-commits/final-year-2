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

  // Get user's completed lessons count, earned badges, and all badges in parallel
  const [completedLessons, userBadgesData, allBadges] = await Promise.all([
    db
      .select({ count: userProgress.lessonId })
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, targetUserId),
          eq(userProgress.status, "completed")
        )
      ),
    db
      .select({
        id: badges.id,
        name: badges.name,
        description: badges.description,
      })
      .from(userBadges)
      .innerJoin(badges, eq(userBadges.badgeId, badges.id))
      .where(eq(userBadges.userId, targetUserId)),
    db
      .select({
        id: badges.id,
        name: badges.name,
        description: badges.description,
        criteriaType: badges.criteriaType,
        criteriaValue: badges.criteriaValue,
      })
      .from(badges)
  ]);

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
    <div className="p-6 lg:p-8">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-[var(--brand-primary)] to-[var(--brand-primary-dark)] text-white p-8 rounded-2xl mb-6 shadow-lg">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl text-[var(--brand-primary)] shadow-lg">
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
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[var(--brand-primary)] rounded-full font-medium">
                  <span>✅</span>
                  <span>Friends</span>
                </span>
              ) : friendshipStatus === "pending" ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-white text-[var(--brand-primary)] rounded-full font-medium">
                  <span>⏳</span>
                  <span>Pending</span>
                </span>
              ) : friendshipStatus === "blocked" ? (
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--error)] text-white rounded-full font-medium">
                  <span>🚫</span>
                  <span>Blocked</span>
                </span>
              ) : (
                <form action={async () => {
                  "use server";
                  await sendFriendRequest(targetUserId);
                }}>
                  <button className="px-4 py-2 bg-white text-[var(--brand-primary)] rounded-full font-medium hover:bg-gray-100 transition-colors">
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
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm">
          <h3 className="text-[var(--foreground-muted)] text-sm font-medium">Total XP</h3>
          <p className="text-3xl font-bold text-[var(--brand-primary)]">{profile.xp}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm">
          <h3 className="text-[var(--foreground-muted)] text-sm font-medium">Lessons Completed</h3>
          <p className="text-3xl font-bold text-[var(--success)]">{completedLessons.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm">
          <h3 className="text-[var(--foreground-muted)] text-sm font-medium">Current Streak</h3>
          <p className="text-3xl font-bold text-[var(--warning)]">{profile.streakCount} days</p>
        </div>
      </div>

      {/* Badges Section */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] shadow-sm mb-6">
        <div className="p-4 border-b border-[var(--border-light)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Badges ({userBadgesData.length}/{allBadges.length})</h2>
        </div>
        
        {allBadges.length === 0 ? (
          <div className="p-6 text-center text-[var(--foreground-muted)]">
            No badges available
          </div>
        ) : (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Earned Badges</h3>
            {userBadgesData.length === 0 ? (
              <div className="p-4 text-center text-[var(--foreground-muted)] bg-[var(--background-secondary)] rounded-xl mb-4">
                No badges earned yet
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {userBadgesData.map((badge: any) => (
                  <div key={badge.id} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-2 flex items-center justify-center text-2xl shadow-md">
                      🏆
                    </div>
                    <p className="font-medium text-sm text-[var(--foreground)]">{badge.name}</p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Locked Badges</h3>
            {lockedBadges.length === 0 ? (
              <div className="p-4 text-center text-[var(--foreground)] bg-[var(--success-light)] rounded-xl border border-[var(--success)]">
                All badges earned! 🎉
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {lockedBadges.map((badge: any) => (
                  <div key={badge.id} className="text-center p-4 bg-[var(--background-secondary)] rounded-xl border border-[var(--border-light)] opacity-60">
                    <div className="w-16 h-16 bg-[var(--foreground-muted)] rounded-full mx-auto mb-2 flex items-center justify-center text-2xl">
                      🔒
                    </div>
                    <p className="font-medium text-sm text-[var(--foreground-muted)]">{badge.name}</p>
                    <p className="text-xs text-[var(--foreground-muted)] mt-1">{badge.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] shadow-sm">
        <div className="p-4 border-b border-[var(--border-light)]">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Recent Activity</h2>
        </div>
        
        <div className="p-6 text-center text-[var(--foreground-muted)]">
          Activity tracking coming soon
        </div>
      </div>
    </div>
  );
}
