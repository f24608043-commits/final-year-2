"use client";

import { useState } from "react";
import Link from "next/link";
import { submitQuiz, type QuizSubmissionResult } from "../actions";

interface OptionItem {
  id: string;
  optionText: string;
}

interface ChallengeItem {
  id: string;
  questionText: string;
  points: number;
  options: OptionItem[];
}

interface LessonClientProps {
  lessonId: string;
  lessonTitle: string;
  lessonDescription: string | null;
  youtubeVideoId: string;
  xpReward: number;
  unitTitle: string;
  challenges: ChallengeItem[];
  previousStatus?: "completed" | "in_progress" | "locked";
}

export default function LessonClient({
  lessonId,
  lessonTitle,
  lessonDescription,
  youtubeVideoId,
  xpReward,
  unitTitle,
  challenges,
  previousStatus,
}: LessonClientProps) {
  const [stage, setStage] = useState<"watch" | "quiz" | "result">(
    previousStatus === "completed" ? "watch" : "watch"
  );
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmissionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleOptionSelect = (challengeId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [challengeId]: optionId,
    }));
  };

  const handleSubmitQuiz = async () => {
    const unanswered = challenges.some((c) => !selectedAnswers[c.id]);
    if (unanswered) {
      setErrorMsg("Please answer all questions before submitting.");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await submitQuiz(lessonId, selectedAnswers);
      setResult(res);
      setStage("result");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/path"
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              ← Back to Path
            </Link>
            <div>
              <span className="text-xs font-semibold uppercase text-blue-600">{unitTitle}</span>
              <h1 className="text-sm font-bold text-gray-900">{lessonTitle}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
              +{xpReward} XP
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-8">
        {stage === "watch" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-4">
              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                Step 1: Watch & Learn
              </span>
              <h2 className="mt-2 text-2xl font-bold text-gray-900">{lessonTitle}</h2>
              {lessonDescription && (
                <p className="mt-1 text-sm text-gray-600">{lessonDescription}</p>
              )}
            </div>

            <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0`}
                title={lessonTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>

            <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
              <p className="text-xs text-gray-500">
                Watch the video, then take the gating quiz to earn XP and unlock the next level.
              </p>
              <button
                type="button"
                onClick={() => setStage("quiz")}
                className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-blue-700 sm:w-auto"
              >
                I&apos;ve Finished Watching — Take Quiz →
              </button>
            </div>
          </div>
        )}

        {stage === "quiz" && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-700">
                  Step 2: Gating Quiz
                </span>
                <h2 className="mt-1 text-xl font-bold text-gray-900">Check Your Understanding</h2>
              </div>
              <button
                type="button"
                onClick={() => setStage("watch")}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                ← Rewatch Video
              </button>
            </div>

            {errorMsg && (
              <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {errorMsg}
              </div>
            )}

            <div className="space-y-8">
              {challenges.map((c, cIdx) => (
                <div key={c.id} className="rounded-xl border border-gray-200 p-5 bg-gray-50/50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Question {cIdx + 1} of {challenges.length}
                    </span>
                    <span className="text-xs font-medium text-gray-400">
                      {c.points} {c.points === 1 ? "point" : "points"}
                    </span>
                  </div>

                  <h3 className="mt-2 text-base font-semibold text-gray-900">{c.questionText}</h3>

                  <div className="mt-4 space-y-2">
                    {c.options.map((opt) => {
                      const isSelected = selectedAnswers[c.id] === opt.id;

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleOptionSelect(c.id, opt.id)}
                          className={`flex w-full items-center justify-between rounded-lg border p-3.5 text-left text-sm font-medium transition-all ${
                            isSelected
                              ? "border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-600"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <span>{opt.optionText}</span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                              isSelected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected ? "✓" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-end gap-3 border-t border-gray-100 pt-6">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmitQuiz}
                className="w-full rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50 sm:w-auto"
              >
                {isSubmitting ? "Grading..." : "Submit Answers →"}
              </button>
            </div>
          </div>
        )}

        {stage === "result" && result && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-inner">
              {result.passed ? "🎉" : "🔄"}
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900">
              {result.passed ? "Level Completed!" : "Almost There!"}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              {result.passed
                ? `Great job! You scored ${result.score}% (${result.correctCount}/${result.totalQuestions} correct) and unlocked the next level.`
                : `You scored ${result.score}%. You need at least 50% to pass and unlock the next level.`}
            </p>

            <div className="my-6 inline-flex items-center gap-6 rounded-2xl bg-gray-50 px-6 py-4 border border-gray-200">
              <div>
                <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">Your Score</div>
                <div
                  className={`text-3xl font-extrabold ${
                    result.passed ? "text-green-600" : "text-amber-600"
                  }`}
                >
                  {result.score}%
                </div>
              </div>

              {result.passed && (
                <>
                  <div className="h-8 w-px bg-gray-200" />
                  <div>
                    <div className="text-xs uppercase tracking-wider text-gray-400 font-bold">XP Earned</div>
                    <div className="text-3xl font-extrabold text-yellow-600">
                      +{result.xpAwarded}
                    </div>
                  </div>
                </>
              )}
            </div>

            {result.badgesAwarded.length > 0 && (
              <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                <span className="text-xs font-bold uppercase text-yellow-800">
                  🏅 New Badge Unlocked!
                </span>
                <p className="mt-1 text-sm font-semibold text-yellow-900">
                  {result.badgesAwarded.join(", ")}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              {result.passed ? (
                <Link
                  href="/path"
                  className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-blue-700"
                >
                  Continue to Next Level →
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAnswers({});
                      setStage("quiz");
                    }}
                    className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-blue-700"
                  >
                    Retake Quiz
                  </button>
                  <button
                    type="button"
                    onClick={() => setStage("watch")}
                    className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Rewatch Video
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
