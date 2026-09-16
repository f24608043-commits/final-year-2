import { getFriendList, getPendingRequests } from "./actions";
import { acceptFriendRequest, rejectFriendRequest, removeFriend } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export default async function FriendsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Friends</h1>
        <p>Please sign in to view your friends.</p>
      </div>
    );
  }

  const friends = await getFriendList();
  const pendingRequests = await getPendingRequests();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Friends</h1>
      
      {/* Pending Friend Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Pending Requests ({pendingRequests.length})</h2>
          <div className="space-y-3">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="bg-white p-4 rounded-lg shadow border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {request.requester?.displayName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium">{request.requester?.displayName || "Unknown User"}</p>
                    <p className="text-sm text-gray-500">Sent {new Date(request.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action={async () => {
                    "use server";
                    await acceptFriendRequest(request.id);
                  }}>
                    <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                      Accept
                    </button>
                  </form>
                  <form action={async () => {
                    "use server";
                    await rejectFriendRequest(request.id);
                  }}>
                    <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                      Reject
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friend List */}
      <div>
        <h2 className="text-xl font-semibold mb-4">My Friends ({friends.length})</h2>
        {friends.length === 0 ? (
          <p className="text-gray-500">No friends yet. Add some friends to get started!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend: any) => (
              <div key={friend.id} className="bg-white p-4 rounded-lg shadow border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                    {friend.displayName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium">{friend.displayName || "Unknown User"}</p>
                    <p className="text-sm text-gray-500">{friend.xp} XP</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    🔥 {friend.streakCount} day streak
                  </span>
                  <form action={async () => {
                    "use server";
                    await removeFriend(friend.id);
                  }}>
                    <button className="text-sm text-red-500 hover:text-red-700">
                      Remove Friend
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
