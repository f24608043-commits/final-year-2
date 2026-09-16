import { getMySessions, getTutorProfile, getTutorAvailability, getPendingRequests } from "../actions";
import { createClient } from "@/utils/supabase/server";

export default async function TutorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Tutor Dashboard</h1>
        <p>Please sign in to access your dashboard.</p>
      </div>
    );
  }

  const tutorProfile = await getTutorProfile(user.id);
  const mySessions = await getMySessions();
  const availability = await getTutorAvailability(user.id);
  const pendingRequests = await getPendingRequests();

  // Separate upcoming and past sessions
  const now = new Date();
  const upcomingSessions = mySessions.filter((s: any) => new Date(s.scheduledAt) > now);
  const pastSessions = mySessions.filter((s: any) => new Date(s.scheduledAt) <= now);

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Tutor Dashboard</h1>

      {/* Tutor Profile Status */}
      {!tutorProfile ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Set Up Your Tutor Profile</h2>
          <p className="text-gray-600 mb-3">Complete your profile to start accepting students.</p>
          <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
            Create Profile
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border p-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold">Your Profile</h2>
              <p className="text-gray-600 mt-1">{tutorProfile.bio || "No bio set"}</p>
              <div className="flex gap-2 mt-2">
                {tutorProfile.subjects?.map((subject: string, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                    {subject}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {tutorProfile.hourlyRate ? `$${tutorProfile.hourlyRate}/hour` : "Free"} • {tutorProfile.timezone}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-purple-600">{tutorProfile.rating} ⭐</p>
              <p className="text-sm text-gray-500">{tutorProfile.totalSessions} sessions</p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Session Requests ({pendingRequests.length})</h2>
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
                    const { acceptSessionRequest } = await import("../actions");
                    await acceptSessionRequest(request.id, 0);
                  }}>
                    <button className="px-3 py-1 bg-green-500 text-white rounded text-sm">
                      Accept
                    </button>
                  </form>
                  <form action={async () => {
                    "use server";
                    const { declineSessionRequest } = await import("../actions");
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

      {/* Upcoming Sessions */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Upcoming Sessions</h2>
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
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Past Sessions</h2>
        {pastSessions.length === 0 ? (
          <p className="text-gray-500">No past sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {pastSessions.map((session: any) => (
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
                      session.status === "completed" ? "bg-blue-100 text-blue-800" :
                      session.status === "cancelled" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {session.status}
                    </span>
                  </div>
                  <form action={async () => {
                    "use server";
                    const { updateSessionStatus } = await import("../actions");
                    await updateSessionStatus(session.id, "completed");
                  }}>
                    <button className="px-3 py-1 bg-green-500 text-white rounded text-sm">
                      Mark Complete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Availability Settings */}
      <div className="bg-white rounded-lg shadow border p-4">
        <h2 className="text-xl font-semibold mb-4">Set Availability</h2>
        <p className="text-gray-600 mb-4">
          Configure your weekly availability for tutoring sessions.
        </p>
        <div className="grid grid-cols-7 gap-2 mb-4">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, idx) => (
            <div key={day} className="text-center">
              <p className="text-sm font-medium mb-2">{day}</p>
              <div className="space-y-1">
                {availability
                  .filter((a: any) => a.dayOfWeek === idx)
                  .map((slot: any) => (
                    <div key={slot.id} className="text-xs bg-purple-100 text-purple-800 rounded p-1">
                      {slot.startTime} - {slot.endTime}
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
          Edit Availability
        </button>
      </div>
    </div>
  );
}
