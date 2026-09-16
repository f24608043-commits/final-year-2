import { db } from "@/db";
import { tutorProfiles, tutorSessions, profiles } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { updateTutorProfile } from "@/app/tutoring/actions";
import { updateSessionStatus } from "@/app/tutoring/actions";

export default async function AdminTutoringPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Tutoring</h1>
        <p>Please sign in to access admin features.</p>
      </div>
    );
  }

  // Check if user is admin
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (profile?.role !== "admin") {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Tutoring</h1>
        <p className="text-red-600">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  // Get all tutor profiles
  const allTutors = await db
    .select({
      id: tutorProfiles.tutorId,
      bio: tutorProfiles.bio,
      subjects: tutorProfiles.subjects,
      hourlyRate: tutorProfiles.hourlyRate,
      timezone: tutorProfiles.timezone,
      isActive: tutorProfiles.isActive,
      rating: tutorProfiles.rating,
      totalSessions: tutorProfiles.totalSessions,
      displayName: profiles.displayName,
      avatarUrl: profiles.avatarUrl,
    })
    .from(tutorProfiles)
    .innerJoin(profiles, eq(tutorProfiles.tutorId, profiles.id))
    .orderBy(desc(tutorProfiles.createdAt));

  // Get all sessions for oversight
  const allSessions = await db
    .select({
      id: tutorSessions.id,
      tutorId: tutorSessions.tutorId,
      learnerId: tutorSessions.learnerId,
      scheduledAt: tutorSessions.scheduledAt,
      durationMins: tutorSessions.durationMins,
      status: tutorSessions.status,
      jitsiRoomId: tutorSessions.jitsiRoomId,
      tutorName: profiles.displayName,
    })
    .from(tutorSessions)
    .innerJoin(profiles, eq(tutorSessions.tutorId, profiles.id))
    .orderBy(desc(tutorSessions.scheduledAt))
    .limit(50);

  // Calculate session metrics
  const totalSessions = allSessions.length;
  const confirmedSessions = allSessions.filter((s: any) => s.status === "confirmed").length;
  const completedSessions = allSessions.filter((s: any) => s.status === "completed").length;
  const cancelledSessions = allSessions.filter((s: any) => s.status === "cancelled").length;

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Tutoring Dashboard</h1>

      {/* Session Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-gray-500 text-sm font-medium">Total Sessions</h3>
          <p className="text-3xl font-bold text-purple-600">{totalSessions}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-gray-500 text-sm font-medium">Confirmed</h3>
          <p className="text-3xl font-bold text-green-600">{confirmedSessions}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-gray-500 text-sm font-medium">Completed</h3>
          <p className="text-3xl font-bold text-blue-600">{completedSessions}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <h3 className="text-gray-500 text-sm font-medium">Cancelled</h3>
          <p className="text-3xl font-bold text-red-600">{cancelledSessions}</p>
        </div>
      </div>

      {/* Tutor Management */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Tutor Management ({allTutors.length})</h2>
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tutor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Subjects</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rate</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Rating</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Sessions</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allTutors.map((tutor: any) => (
                <tr key={tutor.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                        {tutor.displayName?.[0] || "?"}
                      </div>
                      <span className="font-medium">{tutor.displayName || "Unknown"}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {tutor.subjects?.slice(0, 2).map((subject: string, idx: number) => (
                        <span key={idx} className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                          {subject}
                        </span>
                      ))}
                      {tutor.subjects?.length > 2 && (
                        <span className="text-xs text-gray-500">+{tutor.subjects.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {tutor.hourlyRate ? `$${tutor.hourlyRate}/hr` : "Free"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    ⭐ {tutor.rating}/5
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {tutor.totalSessions}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      tutor.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }`}>
                      {tutor.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={async () => {
                      "use server";
                      await updateTutorProfile({
                        isActive: !tutor.isActive,
                      });
                    }}>
                      <button className="text-sm text-purple-600 hover:text-purple-800">
                        {tutor.isActive ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Session Oversight */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Sessions (Last 50)</h2>
        <div className="bg-white rounded-lg shadow border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Session ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tutor</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Scheduled</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Duration</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allSessions.map((session: any) => (
                <tr key={session.id}>
                  <td className="px-4 py-3 text-sm font-mono">
                    {session.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {session.tutorName || "Unknown"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(session.scheduledAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {session.durationMins} min
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      session.status === "confirmed" ? "bg-green-100 text-green-800" :
                      session.status === "completed" ? "bg-blue-100 text-blue-800" :
                      session.status === "cancelled" ? "bg-red-100 text-red-800" :
                      "bg-gray-100 text-gray-800"
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {session.status === "confirmed" && (
                      <form action={async () => {
                        "use server";
                        await updateSessionStatus(session.id, "cancelled");
                      }}>
                        <button className="text-sm text-red-500 hover:text-red-700">
                          Cancel
                        </button>
                      </form>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
