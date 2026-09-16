import { getTutors, getMySessions, getPendingRequests } from "./actions";
import { createClient } from "@/utils/supabase/server";

export default async function TutoringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Tutoring</h1>
        <p>Please sign in to access tutoring features.</p>
      </div>
    );
  }

  const tutors = await getTutors();
  const mySessions = await getMySessions();
  const pendingRequests = await getPendingRequests();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Tutoring</h1>

      {/* Pending Requests (for tutors) */}
      {pendingRequests.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Pending Session Requests ({pendingRequests.length})</h2>
          <div className="space-y-3">
            {pendingRequests.map((request: any) => (
              <div key={request.id} className="bg-white p-3 rounded border">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    {request.learner.displayName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium">{request.learner.displayName || "Unknown"}</p>
                    <p className="text-sm text-gray-500">
                      Requested {new Date(request.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {request.message && (
                  <p className="text-sm text-gray-600 mb-2">"{request.message}"</p>
                )}
                <div className="flex gap-2">
                  <form action={async () => {
                    "use server";
                    const { acceptSessionRequest } = await import("./actions");
                    await acceptSessionRequest(request.id, 0);
                  }}>
                    <button className="px-3 py-1 bg-green-500 text-white rounded text-sm">
                      Accept
                    </button>
                  </form>
                  <form action={async () => {
                    "use server";
                    const { declineSessionRequest } = await import("./actions");
                    await declineSessionRequest(request.id);
                  }}>
                    <button className="px-3 py-1 bg-red-500 text-white rounded text-sm">
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
        <h2 className="text-xl font-semibold mb-4">My Sessions</h2>
        {mySessions.length === 0 ? (
          <p className="text-gray-500">No sessions yet. Find a tutor to get started!</p>
        ) : (
          <div className="space-y-3">
            {mySessions.map((session: any) => (
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
                      session.status === "completed" ? "bg-blue-100 text-blue-800" :
                      session.status === "cancelled" ? "bg-red-100 text-red-800" :
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

      {/* Tutor Directory */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Find a Tutor</h2>
        {tutors.length === 0 ? (
          <p className="text-gray-500">No tutors available yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tutors.map((tutor: any) => (
              <div key={tutor.id} className="bg-white p-4 rounded-lg border">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-lg">
                    {tutor.displayName?.[0] || "?"}
                  </div>
                  <div>
                    <p className="font-medium">{tutor.displayName || "Unknown"}</p>
                    <p className="text-sm text-gray-500">
                      ⭐ {tutor.rating}/5 ({tutor.totalSessions} sessions)
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {tutor.bio || "No bio available"}
                </p>
                <div className="flex flex-wrap gap-1 mb-3">
                  {tutor.subjects?.map((subject: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                      {subject}
                    </span>
                  ))}
                </div>
                <p className="text-sm font-medium">
                  {tutor.hourlyRate ? `$${tutor.hourlyRate}/hour` : "Free"}
                </p>
                <button className="w-full mt-3 px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
                  Book Session
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
