import { getLibraryLessons } from "./actions";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/sign-in");
  }

  const libraryLessons = await getLibraryLessons();

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Video Library</h1>
        <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
          Watch lesson videos without completing quizzes. Progress is not tracked in the Library.
        </p>
      </div>

      {libraryLessons.length === 0 ? (
        <div className="rounded-xl border border-[var(--warning)] bg-[var(--warning-light)] p-8 text-center">
          <div className="text-4xl mb-3">📚</div>
          <p className="text-[var(--warning)]">
            No lessons available. Enroll in a course to access the library.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {libraryLessons.map((lesson: any) => (
            <div key={lesson.id} className="rounded-xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-[var(--foreground)]">{lesson.title}</h2>
                  <p className="text-sm text-[var(--foreground-muted)] mt-1">
                    {lesson.courseName} • {lesson.unitName}
                  </p>
                  <p className="text-sm text-[var(--foreground-secondary)] mt-2">{lesson.description}</p>
                  <p className="text-sm text-[var(--brand-primary)] mt-1 font-medium">{lesson.xpReward} XP (if completed via quiz)</p>
                </div>
              </div>

              {lesson.videoUrl ? (
                <div className="aspect-video bg-black rounded-xl overflow-hidden">
                  <video
                    controls
                    className="w-full h-full"
                    src={`https://www.youtube.com/watch?v=${lesson.videoUrl}`}
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
                <div className="rounded-xl bg-[var(--background-secondary)] p-8 text-center">
                  <div className="text-4xl mb-3">🎬</div>
                  <p className="text-[var(--foreground-muted)]">No video available for this lesson</p>
                </div>
              )}

              <div className="mt-4 rounded-lg border border-[var(--info)] bg-[var(--info-light)] p-4 text-sm text-[var(--info)]">
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
