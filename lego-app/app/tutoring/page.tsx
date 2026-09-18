import { getTutors, getMySessions, getPendingRequests } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function TutoringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const [tutors, mySessions, pendingRequests] = await Promise.all([
    getTutors(),
    getMySessions(),
    getPendingRequests()
  ]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Tutoring</h1>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
          Connect with expert tutors for personalized learning sessions
        </p>
      </div>

      {/* Pending Requests (for tutors) */}
      {pendingRequests.length > 0 && (
        <div className="mb-8 rounded-xl border border-[var(--warning)] bg-[var(--warning-light)] p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🔔</span>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">
              Pending Session Requests ({pendingRequests.length})
            </h2>
          </div>
          <div className="space-y-3">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white font-bold text-lg">
                    {request.learner.displayName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--foreground)]">
                      {request.learner.displayName || "Unknown"}
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {request.message && (
                  <p className="text-sm text-[var(--foreground-secondary)] mb-3 italic">
                    "{request.message}"
                  </p>
                )}
                <div className="flex gap-2">
                  <form action={async () => {
                    "use server";
                    const { acceptSessionRequest } = await import("./actions");
                    await acceptSessionRequest(request.id, 0);
                  }}>
                    <button className="rounded-lg bg-[var(--success)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--success)]/90 transition-colors">
                      Accept
                    </button>
                  </form>
                  <form action={async () => {
                    "use server";
                    const { declineSessionRequest } = await import("./actions");
                    await declineSessionRequest(request.id);
                  }}>
                    <button className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors">
                      Decline
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Sessions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">My Sessions</h2>
        {mySessions.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-light)] bg-[var(--background-secondary)] p-8 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-[var(--foreground-secondary)]">No sessions yet. Find a tutor to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {mySessions.map((session: any) => (
              <div key={session.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--foreground)]">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                      Duration: {session.durationMins} minutes
                    </p>
                    <span className={`inline-block mt-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      session.status === "confirmed" ? "bg-[var(--success-light)] text-[var(--success)]" :
                      session.status === "completed" ? "bg-[var(--info-light)] text-[var(--info)]" :
                      session.status === "cancelled" ? "bg-[var(--error-light)] text-[var(--error)]" :
                      "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  {session.status === "confirmed" && session.jitsiRoomId && (
                    <a
                      href={`https://meet.jit.si/${session.jitsiRoomId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-primary-dark)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Join Session
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tutor Directory */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Find a Tutor</h2>
        {tutors.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-light)] bg-[var(--background-secondary)] p-8 text-center">
            <div className="text-4xl mb-3">👨‍🏫</div>
            <p className="text-[var(--foreground-secondary)]">No tutors available yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tutors.map((tutor: any) => (
              <div key={tutor.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white font-bold text-xl">
                    {tutor.displayName?.[0] || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--foreground)] truncate">
                      {tutor.displayName || "Unknown"}
                    </p>
                    <div className="flex items-center gap-1 text-sm text-[var(--foreground-secondary)]">
                      <span>⭐</span>
                      <span>{tutor.rating}/5</span>
                      <span className="text-[var(--foreground-muted)]">({tutor.totalSessions} sessions)</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[var(--foreground-secondary)] mb-3 line-clamp-2">
                  {tutor.bio || "No bio available"}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {tutor.subjects?.map((subject: string, idx: number) => (
                    <span key={idx} className="rounded-full bg-purple-100 px-2 py-1 text-xs font-semibold text-purple-800">
                      {subject}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    {tutor.hourlyRate ? `$${tutor.hourlyRate}/hour` : "Free"}
                  </p>
                  <button className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-primary-dark)] transition-colors">
                    Book Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
