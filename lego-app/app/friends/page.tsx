import { getFriendList, getPendingRequests } from "./actions";
import { acceptFriendRequest, rejectFriendRequest, removeFriend } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const [friends, pendingRequests] = await Promise.all([
    getFriendList(),
    getPendingRequests()
  ]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Friends</h1>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
          Connect with other learners and track your progress together
        </p>
      </div>

      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex h-2 w-2 rounded-full bg-[var(--brand-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Pending Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white font-bold text-lg">
                      {request.requester?.displayName?.[0] || "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--foreground)] truncate">
                        {request.requester?.displayName || "Unknown User"}
                      </p>
                      <p className="text-xs text-[var(--foreground-muted)]">
                        Sent {new Date(request.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <form action={async () => {
                      "use server";
                      await acceptFriendRequest(request.id);
                    }}>
                      <button className="rounded-lg bg-[var(--success)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--success)]/90 transition-colors">
                        Accept
                      </button>
                    </form>
                    <form action={async () => {
                      "use server";
                      await rejectFriendRequest(request.id);
                    }}>
                      <button className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friend List */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          My Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-light)] bg-[var(--background-secondary)] p-8 text-center">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-[var(--foreground-secondary)]">No friends yet. Add some friends to get started!</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend: any) => (
              <div key={friend.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white font-bold text-xl">
                    {friend.displayName?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--foreground)] truncate">
                      {friend.displayName || "Unknown User"}
                    </p>
                    <p className="text-sm text-[var(--brand-primary)] font-medium">{friend.xp} XP</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-[var(--foreground-secondary)]">
                    <span>🔥</span>
                    <span>{friend.streakCount} day streak</span>
                  </div>
                  <form action={async () => {
                    "use server";
                    await removeFriend(friend.id);
                  }}>
                    <button className="text-sm font-medium text-[var(--error)] hover:text-[var(--error)]/80 transition-colors">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
