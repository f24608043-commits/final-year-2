"use client";

import { useState } from "react";
import Link from "next/link";
import { submitQuiz, type QuizSubmissionResult } from "../actions";
import Celebration from "@/components/Celebration";

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
  const [stage, setStage] = useState<"watch" | "quiz" | "result" | "celebration">(
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
      if (res.passed) {
        setStage("celebration");
      } else {
        setStage("result");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit quiz. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/path"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Path
        </Link>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800">
            +{xpReward} XP
          </span>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="mb-6">
        <span className="text-xs font-semibold text-[var(--brand-primary)] uppercase tracking-wider">{unitTitle}</span>
        <h1 className="text-2xl font-bold text-[var(--foreground)] mt-1">{lessonTitle}</h1>
        {lessonDescription && (
          <p className="mt-2 text-sm text-[var(--foreground-secondary)]">{lessonDescription}</p>
        )}
      </div>

      {/* Content */}
      <div className="space-y-6">
        {stage === "watch" && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[var(--border-light)] bg-[var(--background-secondary)]">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white text-sm font-bold">
                  1
                </div>
                <span className="font-semibold text-[var(--foreground)]">Watch & Learn</span>
              </div>
              <p className="mt-1 text-xs text-[var(--foreground-secondary)]">
                Watch the video to understand the concepts, then take the quiz to earn XP.
              </p>
            </div>

            <div className="p-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-black shadow">
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${youtubeVideoId}?rel=0`}
                  title={lessonTitle}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStage("quiz")}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-bold text-white shadow hover:bg-[var(--brand-primary-dark)] transition-colors"
                >
                  Take Quiz
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === "quiz" && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[var(--border-light)] bg-[var(--background-secondary)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-primary)] text-white text-sm font-bold">
                    2
                  </div>
                  <span className="font-semibold text-[var(--foreground)]">Quiz</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStage("watch")}
                  className="text-xs font-semibold text-[var(--brand-primary)] hover:underline"
                >
                  ← Rewatch Video
                </button>
              </div>
              <p className="mt-1 text-xs text-[var(--foreground-secondary)]">
                Answer all questions correctly to earn XP and unlock the next level.
              </p>
            </div>

            <div className="p-6">
              {errorMsg && (
                <div className="mb-6 rounded-lg border border-[var(--error)] bg-[var(--error-light)] p-4 text-sm text-[var(--error)]">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-6">
                {challenges.map((c, cIdx) => (
                  <div key={c.id} className="rounded-xl border border-[var(--border-light)] p-5 bg-[var(--background-secondary)]">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                        Question {cIdx + 1} of {challenges.length}
                      </span>
                      <span className="text-xs font-medium text-[var(--foreground-muted)]">
                        {c.points} {c.points === 1 ? "point" : "points"}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-[var(--foreground)] mb-4">{c.questionText}</h3>

                    <div className="space-y-3">
                      {c.options.map((opt) => {
                        const isSelected = selectedAnswers[c.id] === opt.id;

                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => handleOptionSelect(c.id, opt.id)}
                            className={`flex w-full items-center justify-between rounded-lg border p-4 text-left text-sm font-medium transition-all ${
                              isSelected
                                ? "border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary-dark)] ring-2 ring-[var(--brand-primary)]"
                                : "border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground)] hover:border-[var(--brand-primary)] hover:bg-[var(--background-secondary)]"
                            }`}
                          >
                            <span>{opt.optionText}</span>
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                                isSelected
                                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                                  : "border-[var(--border)]"
                              }`}
                            >
                              {isSelected ? "✓" : ""}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmitQuiz}
                  className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-bold text-white shadow hover:bg-[var(--brand-primary-dark)] disabled:opacity-50 transition-colors"
                >
                  {isSubmitting ? "Grading..." : "Submit Answers"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {stage === "result" && result && (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] overflow-hidden shadow-sm">
            <div className="p-8 text-center">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[var(--background-secondary)] text-5xl">
                {result.passed ? "🎉" : "🔄"}
              </div>

              <h2 className="text-2xl font-extrabold text-[var(--foreground)]">
                {result.passed ? "Level Completed!" : "Almost There!"}
              </h2>

              <p className="mt-2 text-sm text-[var(--foreground-secondary)]">
                {result.passed
                  ? `Great job! You scored ${result.score}% (${result.correctCount}/${result.totalQuestions} correct) and unlocked the next level.`
                  : `You scored ${result.score}%. You need at least 50% to pass and unlock the next level.`}
              </p>

              <div className="my-8 inline-flex items-center gap-8 rounded-2xl bg-[var(--background-secondary)] px-8 py-6 border border-[var(--border-light)]">
                <div>
                  <div className="text-xs uppercase tracking-wider text-[var(--foreground-muted)] font-bold">Your Score</div>
                  <div
                    className={`text-4xl font-extrabold ${
                      result.passed ? "text-[var(--success)]" : "text-[var(--warning)]"
                    }`}
                  >
                    {result.score}%
                  </div>
                </div>

                {result.passed && (
                  <>
                    <div className="h-12 w-px bg-[var(--border)]" />
                    <div>
                      <div className="text-xs uppercase tracking-wider text-[var(--foreground-muted)] font-bold">XP Earned</div>
                      <div className="text-4xl font-extrabold text-yellow-600">
                        +{result.xpAwarded}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {result.badgesAwarded.length > 0 && (
                <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 inline-block">
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
                  <>
                    <button
                      type="button"
                      onClick={() => setStage("celebration")}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-bold text-white shadow hover:bg-[var(--brand-primary-dark)] transition-colors"
                    >
                      View Celebration
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <Link
                      href="/path"
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
                    >
                      Skip to Path
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAnswers({});
                        setStage("quiz");
                      }}
                      className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-bold text-white shadow hover:bg-[var(--brand-primary-dark)] transition-colors"
                    >
                      Retake Quiz
                    </button>
                    <button
                      type="button"
                      onClick={() => setStage("watch")}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
                    >
                      Rewatch Video
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {stage === "celebration" && result && (
          <Celebration
            lessonTitle={lessonTitle}
            xpEarned={result.xpAwarded}
            totalXP={result.totalXP || 0}
            lessonsCompleted={result.lessonsCompleted || 0}
            accuracy={result.score}
            streakDays={result.streakDays || 0}
            badge={result.badgesAwarded.length > 0 ? {
              name: result.badgesAwarded[0],
              description: "Awarded for your achievement!"
            } : undefined}
            onNextLesson={() => window.location.href = "/path"}
            onReview={() => setStage("result")}
            onReturnToPath={() => window.location.href = "/path"}
          />
        )}
      </div>
    </div>
  );
}
