import { getMySessions, getSessionNotes } from "../actions";
import { createClient } from "@/utils/supabase/server";

export default async function SessionHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Session History</h1>
        <p>Please sign in to view your session history.</p>
      </div>
    );
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
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Session History</h1>

      {/* Upcoming Sessions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Sessions ({upcomingSessions.length})</h2>
        {upcomingSessions.length === 0 ? (
          <p className="text-gray-500">No upcoming sessions scheduled.</p>
        ) : (
          <div className="space-y-3">
            {upcomingSessions.map((session: any) => (
              <div key={session.id} className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Duration: {session.durationMins} minutes
                    </p>
                    <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                      session.status === "confirmed" ? "bg-green-100 text-green-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  {session.status === "confirmed" && session.jitsiRoomId && (
                    <a
                      href={`https://meet.jit.si/${session.jitsiRoomId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
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
        <h2 className="text-xl font-semibold mb-4">Past Sessions ({pastSessions.length})</h2>
        {sessionsWithNotes.length === 0 ? (
          <p className="text-gray-500">No past sessions yet.</p>
        ) : (
          <div className="space-y-4">
            {sessionsWithNotes.map((session: any) => (
              <div key={session.id} className="bg-white p-4 rounded-lg border">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-medium">
                      {new Date(session.scheduledAt).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500">
                      Duration: {session.durationMins} minutes
                    </p>
                    <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${
                      session.status === "completed" ? "bg-blue-100 text-blue-800" :
                      session.status === "cancelled" ? "bg-red-100 text-red-800" :
                      session.status === "no_show" ? "bg-orange-100 text-orange-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>

                {/* Session Notes */}
                {session.notes && session.notes.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold mb-2">Session Notes</h3>
                    <div className="space-y-2">
                      {session.notes.map((note: any) => (
                        <div key={note.id} className="bg-gray-50 p-3 rounded text-sm">
                          <p className="text-gray-700">{note.noteText}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(note.createdAt).toLocaleDateString()}
                            {note.visibility === "private_tutor" && " • Private"}
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
