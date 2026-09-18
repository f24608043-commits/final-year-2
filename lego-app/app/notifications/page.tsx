import { getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const [notifications, unreadCount] = await Promise.all([
    getNotifications(),
    getUnreadCount()
  ]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Notifications</h1>
        {unreadCount > 0 && (
          <div className="flex items-center gap-4">
            <span className="bg-[var(--error)] text-white px-3 py-1 rounded-full text-sm font-medium">
              {unreadCount} unread
            </span>
            <form action={async (formData: FormData) => {
              "use server";
              await markAllAsRead();
            }}>
              <button className="text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)] transition-colors">
                Mark all as read
              </button>
            </form>
          </div>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="rounded-xl border border-[var(--border-light)] bg-[var(--background-card)] p-12 text-center shadow-sm">
          <div className="text-6xl mb-4">🔔</div>
          <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2">No notifications yet</h2>
          <p className="text-[var(--foreground-secondary)]">You're all caught up! Check back later for updates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification: any) => (
            <div
              key={notification.id}
              className={`rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 shadow-sm ${
                !notification.isRead ? "border-l-4 border-l-[var(--brand-primary)]" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">
                      {getNotificationIcon(notification.type)}
                    </span>
                    <h3 className={`font-semibold ${!notification.isRead ? "text-[var(--brand-primary)]" : "text-[var(--foreground)]"}`}>
                      {notification.title}
                    </h3>
                  </div>
                  <p className="text-[var(--foreground-secondary)] mb-2">{notification.message}</p>
                  <p className="text-xs text-[var(--foreground-muted)]">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {!notification.isRead && (
                    <form action={async (formData: FormData) => {
                      "use server";
                      await markAsRead(notification.id);
                    }}>
                      <button className="text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)] transition-colors">
                        Mark read
                      </button>
                    </form>
                  )}
                  <form action={async (formData: FormData) => {
                    "use server";
                    await deleteNotification(notification.id);
                  }}>
                    <button className="text-sm text-[var(--error)] hover:text-[var(--error)]/80 transition-colors">
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
