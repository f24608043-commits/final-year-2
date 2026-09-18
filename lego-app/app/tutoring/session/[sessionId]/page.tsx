import { getSession, getSessionNotes, addSessionNote } from "../../actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function SessionPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const session = await getSession(params.sessionId);
  const notes = await getSessionNotes(params.sessionId);

  if (!session) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-4">Session Not Found</h1>
        <p className="text-[var(--foreground-secondary)]">This session does not exist or you don't have access to it.</p>
      </div>
    );
  }

  const now = new Date();
  const sessionStart = new Date(session.scheduledAt);
  const sessionEnd = new Date(sessionStart.getTime() + session.durationMins * 60000);
  
  // Check if session can be joined (10 minutes before start until end)
  const canJoin = now >= new Date(sessionStart.getTime() - 10 * 60000) && now <= sessionEnd;
  const isPast = now > sessionEnd;
  const isFuture = now < new Date(sessionStart.getTime() - 10 * 60000);

  const isTutor = session.tutorId === user.id;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">Session Details</h1>
        <p className="text-[var(--foreground-secondary)]">
          {new Date(session.scheduledAt).toLocaleString()} • {session.durationMins} minutes
        </p>
        <span className={`inline-block px-3 py-1 rounded-full text-sm mt-2 font-medium ${
          session.status === "confirmed" ? "bg-[var(--success-light)] text-[var(--success)]" :
          session.status === "completed" ? "bg-[var(--info-light)] text-[var(--info)]" :
          session.status === "cancelled" ? "bg-[var(--error-light)] text-[var(--error)]" :
          "bg-[var(--background-secondary)] text-[var(--foreground-muted)]"
        }`}>
          {session.status}
        </span>
      </div>

      {/* Video Session */}
      {session.status === "confirmed" && session.jitsiRoomId && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Video Session</h2>
          
          {isFuture && (
            <div className="rounded-xl border border-[var(--warning)] bg-[var(--warning-light)] p-4 text-center">
              <p className="text-[var(--warning)]">
                Session will be available 10 minutes before start time.
              </p>
              <p className="text-sm text-[var(--warning)] mt-1">
                Starts in: {Math.ceil((sessionStart.getTime() - now.getTime()) / 60000)} minutes
              </p>
            </div>
          )}

          {isPast && (
            <div className="rounded-xl border border-[var(--border-light)] bg-[var(--background-secondary)] p-4 text-center">
              <p className="text-[var(--foreground-muted)]">This session has ended.</p>
            </div>
          )}

          {canJoin && (
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <iframe
                src={`https://meet.jit.si/${session.jitsiRoomId}`}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          )}
        </div>
      )}

      {/* Session Notes (Tutor only) */}
      {isTutor && session.status !== "cancelled" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Session Notes</h2>
          
          <form action={async (formData: FormData) => {
            "use server";
            const noteText = formData.get("noteText") as string;
            const visibility = formData.get("visibility") as "private_tutor" | "shared";
            await addSessionNote({
              sessionId: params.sessionId,
              noteText,
              visibility,
            });
          }} className="mb-4">
            <div className="mb-3">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Add Note</label>
              <textarea
                name="noteText"
                className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--background-card)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all"
                rows={3}
                placeholder="Enter your session notes..."
                required
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">Visibility</label>
              <select name="visibility" className="w-full p-3 border border-[var(--border)] rounded-xl bg-[var(--background-card)] focus:border-[var(--brand-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20 transition-all">
                <option value="shared">Shared with learner</option>
                <option value="private_tutor">Private (tutor only)</option>
              </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-xl hover:bg-[var(--brand-primary-dark)] transition-colors">
              Add Note
            </button>
          </form>

          {notes && notes.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-[var(--foreground)] mb-2">Existing Notes</h3>
              <div className="space-y-2">
                {notes.map((note: any) => (
                  <div key={note.id} className="bg-[var(--background-secondary)] p-3 rounded-xl">
                    <p className="text-sm text-[var(--foreground)]">{note.noteText}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-[var(--foreground-muted)]">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        note.visibility === "private_tutor" ? "bg-[var(--warning-light)] text-[var(--warning)]" : "bg-[var(--info-light)] text-[var(--info)]"
                      }`}>
                        {note.visibility === "private_tutor" ? "Private" : "Shared"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Session Notes (Learner view - shared only) */}
      {!isTutor && notes && notes.length > 0 && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Session Notes</h2>
          <div className="space-y-2">
            {notes.map((note: any) => (
              <div key={note.id} className="bg-[var(--background-secondary)] p-3 rounded-xl">
                <p className="text-sm text-[var(--foreground)]">{note.noteText}</p>
                <p className="text-xs text-[var(--foreground-muted)] mt-1">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Actions (Tutor only) */}
      {isTutor && session.status === "confirmed" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">Session Actions</h2>
          <div className="flex gap-3">
            <form action={async () => {
              "use server";
              const { updateSessionStatus } = await import("../../actions");
              await updateSessionStatus(params.sessionId, "completed");
            }}>
              <button className="px-4 py-2 bg-[var(--success)] text-white rounded-xl hover:bg-[var(--success)]/80 transition-colors">
                Mark as Completed
              </button>
            </form>
            <form action={async () => {
              "use server";
              const { updateSessionStatus } = await import("../../actions");
              await updateSessionStatus(params.sessionId, "cancelled");
            }}>
              <button className="px-4 py-2 bg-[var(--error)] text-white rounded-xl hover:bg-[var(--error)]/80 transition-colors">
                Cancel Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
