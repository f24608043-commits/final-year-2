import { getSession, getSessionNotes, addSessionNote } from "../../actions";
import { createClient } from "@/utils/supabase/server";

export default async function SessionPage({ params }: { params: { sessionId: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Session</h1>
        <p>Please sign in to access this session.</p>
      </div>
    );
  }

  const session = await getSession(params.sessionId);
  const notes = await getSessionNotes(params.sessionId);

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Session Not Found</h1>
        <p>This session does not exist or you don't have access to it.</p>
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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Session Details</h1>
        <p className="text-gray-600">
          {new Date(session.scheduledAt).toLocaleString()} • {session.durationMins} minutes
        </p>
        <span className={`inline-block px-3 py-1 rounded text-sm mt-2 ${
          session.status === "confirmed" ? "bg-green-100 text-green-800" :
          session.status === "completed" ? "bg-blue-100 text-blue-800" :
          session.status === "cancelled" ? "bg-red-100 text-red-800" :
          "bg-gray-100 text-gray-800"
        }`}>
          {session.status}
        </span>
      </div>

      {/* Video Session */}
      {session.status === "confirmed" && session.jitsiRoomId && (
        <div className="bg-white rounded-lg shadow border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Video Session</h2>
          
          {isFuture && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
              <p className="text-yellow-800">
                Session will be available 10 minutes before start time.
              </p>
              <p className="text-sm text-yellow-600 mt-1">
                Starts in: {Math.ceil((sessionStart.getTime() - now.getTime()) / 60000)} minutes
              </p>
            </div>
          )}

          {isPast && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-gray-600">This session has ended.</p>
            </div>
          )}

          {canJoin && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
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
        <div className="bg-white rounded-lg shadow border p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Session Notes</h2>
          
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
              <label className="block text-sm font-medium mb-1">Add Note</label>
              <textarea
                name="noteText"
                className="w-full p-2 border rounded"
                rows={3}
                placeholder="Enter your session notes..."
                required
              />
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Visibility</label>
              <select name="visibility" className="w-full p-2 border rounded">
                <option value="shared">Shared with learner</option>
                <option value="private_tutor">Private (tutor only)</option>
              </select>
            </div>
            <button type="submit" className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
              Add Note
            </button>
          </form>

          {notes && notes.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold mb-2">Existing Notes</h3>
              <div className="space-y-2">
                {notes.map((note: any) => (
                  <div key={note.id} className="bg-gray-50 p-3 rounded">
                    <p className="text-sm">{note.noteText}</p>
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-xs text-gray-500">
                        {new Date(note.createdAt).toLocaleString()}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded ${
                        note.visibility === "private_tutor" ? "bg-orange-100 text-orange-800" : "bg-blue-100 text-blue-800"
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
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-semibold mb-4">Session Notes</h2>
          <div className="space-y-2">
            {notes.map((note: any) => (
              <div key={note.id} className="bg-gray-50 p-3 rounded">
                <p className="text-sm">{note.noteText}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(note.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Actions (Tutor only) */}
      {isTutor && session.status === "confirmed" && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-xl font-semibold mb-4">Session Actions</h2>
          <div className="flex gap-3">
            <form action={async () => {
              "use server";
              const { updateSessionStatus } = await import("../../actions");
              await updateSessionStatus(params.sessionId, "completed");
            }}>
              <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
                Mark as Completed
              </button>
            </form>
            <form action={async () => {
              "use server";
              const { updateSessionStatus } = await import("../../actions");
              await updateSessionStatus(params.sessionId, "cancelled");
            }}>
              <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
                Cancel Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
