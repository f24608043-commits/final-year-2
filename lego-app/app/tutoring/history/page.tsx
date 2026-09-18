import { getMySessions, getSessionNotes } from "../actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SessionHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const mySessions = await getMySessions();

  // Separate upcoming and past sessions
  const now = new Date();
  const upcomingSessions = mySessions.filter((s: any) => new Date(s.scheduledAt) > now);
  const pastSessions = mySessions.filter((s: any) => new Date(s.scheduledAt) <= now);

  // Get notes for past sessions
  const sessionsWithNotes = await Promise.all(
    pastSessions.map(async (session: any) => {
      const notes = await getSessionNotes(session.id);
      return { ...session, notes };
    })
  );

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Session History</h1>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
          View your upcoming and past tutoring sessions
        </p>
      </div>

      {/* Upcoming Sessions */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Upcoming Sessions ({upcomingSessions.length})
        </h2>
        {upcomingSessions.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-light)] bg-[var(--background-secondary)] p-8 text-center">
            <div className="text-4xl mb-3">📅</div>
            <p className="text-[var(--foreground-secondary)]">No upcoming sessions scheduled.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((session: any) => (
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

      {/* Past Sessions */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
          Past Sessions ({pastSessions.length})
        </h2>
        {sessionsWithNotes.length === 0 ? (
          <div className="rounded-xl border border-[var(--border-light)] bg-[var(--background-secondary)] p-8 text-center">
            <div className="text-4xl mb-3">📜</div>
            <p className="text-[var(--foreground-secondary)]">No past sessions yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessionsWithNotes.map((session: any) => (
              <div key={session.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-5 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-[var(--foreground)]">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-[var(--foreground-secondary)] mt-1">
                      Duration: {session.durationMins} minutes
                    </p>
                    <span className={`inline-block mt-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      session.status === "completed" ? "bg-[var(--info-light)] text-[var(--info)]" :
                      session.status === "cancelled" ? "bg-[var(--error-light)] text-[var(--error)]" :
                      session.status === "no_show" ? "bg-[var(--warning-light)] text-[var(--warning)]" :
                      "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>

                {/* Session Notes */}
                {session.notes && session.notes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[var(--border-light)]">
                    <h3 className="text-sm font-semibold text-[var(--foreground)] mb-3">Session Notes</h3>
                    <div className="space-y-3">
                      {session.notes.map((note: any) => (
                        <div key={note.id} className="rounded-lg border border-[var(--border-light)] bg-[var(--background-secondary)] p-4">
                          <p className="text-sm text-[var(--foreground)]">{note.noteText}</p>
                          <p className="text-xs text-[var(--foreground-muted)] mt-2">
                            {new Date(note.createdAt).toLocaleDateString()}
                            {note.visibility === "private_tutor" && <span className="ml-2">• Private</span>}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
