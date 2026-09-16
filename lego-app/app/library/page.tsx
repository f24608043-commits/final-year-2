import { getLibraryLessons } from "./actions";
import { createClient } from "@/utils/supabase/server";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Library</h1>
        <p>Please sign in to access the library.</p>
      </div>
    );
  }

  const libraryLessons = await getLibraryLessons();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Video Library</h1>
        <p className="text-gray-600">
          Watch lesson videos without completing quizzes. Progress is not tracked in the Library.
        </p>
      </div>

      {libraryLessons.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800">
            No lessons available. Enroll in a course to access the library.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {libraryLessons.map((lesson: any) => (
            <div key={lesson.id} className="bg-white rounded-lg shadow border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold">{lesson.title}</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {lesson.courseName} • {lesson.unitName}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">{lesson.description}</p>
                  <p className="text-sm text-purple-600 mt-1">{lesson.xpReward} XP (if completed via quiz)</p>
                </div>
              </div>

              {lesson.videoUrl ? (
                <div className="aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    controls
                    className="w-full h-full"
                    src={lesson.videoUrl}
                    onPlay={async () => {
                      // Record library view when video starts
                      const { recordLibraryView } = await import("./actions");
                      await recordLibraryView(lesson.id);
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-gray-500">No video available for this lesson</p>
                </div>
              )}

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                <strong>Library Mode:</strong> Watching here does not track progress or award XP.
                Complete the quiz in the lesson page to earn XP and track progress.
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
