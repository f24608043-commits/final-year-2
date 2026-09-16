import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from "./actions";
import { createClient } from "@/utils/supabase/server";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        <p>Please sign in to view your notifications.</p>
      </div>
    );
  }

  const notifications = await getNotifications();
  const unreadCount = await getUnreadCount();

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Notifications</h1>
        {unreadCount > 0 && (
          <div className="flex items-center gap-4">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm">
              {unreadCount} unread
            </span>
            <form action={markAllAsRead}>
              <button className="text-sm text-purple-600 hover:text-purple-800">
                Mark all as read
              </button>
            </form>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow border p-12 text-center">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
          <p className="text-gray-500">You're all caught up! Check back later for updates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: any) => (
            <div
              key={notification.id}
              className={`bg-white rounded-lg shadow border p-4 ${
                !notification.isRead ? "border-l-4 border-l-purple-500" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <h3 className={`font-semibold ${!notification.isRead ? "text-purple-600" : ""}`}>
                      {notification.title}
                    </h3>
                  </div>
                  <p className="text-gray-700 mb-2">{notification.message}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  {!notification.isRead && (
                    <form action={async () => {
                      "use server";
                      await markAsRead(notification.id);
                    }}>
                      <button className="text-sm text-purple-600 hover:text-purple-800">
                        Mark read
                      </button>
                    </form>
                  )}
                  <form action={async () => {
                    "use server";
                    await deleteNotification(notification.id);
                  }}>
                    <button className="text-sm text-red-500 hover:text-red-700">
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getNotificationIcon(type: string): string {
  switch (type) {
    case "friend_request":
      return "👋";
    case "friend_accepted":
      return "🤝";
    case "badge_earned":
      return "🏆";
    case "streak_milestone":
      return "🔥";
    case "lesson_completed":
      return "✅";
    case "leaderboard_rank":
      return "📊";
    default:
      return "🔔";
  }
}
