"use client";

import { useState, useTransition } from "react";
import { submitPracticeQuiz, type PracticeSubmissionResult } from "./actions";
import type { GeneratedQuestion } from "@/lib/ai/generateQuiz";
import Link from "next/link";

interface PracticeClientProps {
  lessonId: string;
  lessonTitle: string;
  questions: GeneratedQuestion[];
  provider: string;
}

export default function PracticeClient({
  lessonId,
  lessonTitle,
  questions,
  provider,
}: PracticeClientProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [result, setResult] = useState<PracticeSubmissionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSelect = (qIdx: number, oIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: oIdx }));
  };

  const handleSubmit = () => {
    const unanswered = questions.some((_, i) => selectedAnswers[i] === undefined);
    if (unanswered) {
      setErrorMsg("Please answer all questions before submitting.");
      return;
    }
    setErrorMsg(null);
    startTransition(async () => {
      try {
        const res = await submitPracticeQuiz(lessonId, selectedAnswers, questions);
        setResult(res);
      } catch (err: any) {
        setErrorMsg(err.message || "Failed to submit. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen bg-[var(--background)] pb-16">
      <header className="border-b border-[var(--border)] bg-[var(--background-card)]">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/lesson/${lessonId}`}
              className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
            >
              ← Back to Lesson
            </Link>
            <div>
              <span className="text-xs font-semibold uppercase text-[var(--brand-primary)]">
                Practice Mode
              </span>
              <h1 className="text-sm font-bold text-[var(--foreground)]">{lessonTitle}</h1>
            </div>
          </div>
          <span className="rounded-full bg-[var(--brand-primary-light)] px-3 py-1 text-xs font-bold text-[var(--brand-primary)]">
            Bonus XP Quiz
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-8">
        {!result ? (
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 shadow-sm sm:p-8">
            <div className="mb-6 rounded-xl border border-[var(--brand-primary-light)] bg-[var(--brand-primary-light)] p-4">
              <p className="text-sm font-semibold text-[var(--brand-primary)]">
                🎯 Practice Quiz — AI-Generated
              </p>
              <p className="mt-1 text-xs text-[var(--brand-primary)]">
                These questions are freshly generated just for extra practice. Pass to earn
                bonus XP! (Provider: {provider})
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-lg border border-[var(--error)] bg-[var(--error-light)] p-3 text-sm text-[var(--error)]">
                {errorMsg}
              </div>
            )}

            <div className="space-y-8">
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="rounded-xl border border-[var(--border)] bg-[var(--background-secondary)] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                      Question {qIdx + 1} of {questions.length}
                    </span>
                    <span className="text-xs font-medium text-[var(--foreground-muted)]">
                      {q.points} {q.points === 1 ? "point" : "points"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-[var(--foreground)]">
                    {q.questionText}
                  </h3>
                  <div className="mt-4 space-y-2">
                    {q.options.map((opt, oIdx) => {
                      const isSelected = selectedAnswers[qIdx] === oIdx;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleSelect(qIdx, oIdx)}
                          className={`flex w-full items-center justify-between rounded-lg border p-3.5 text-left text-sm font-medium transition-all ${
                            isSelected
                              ? "border-[var(--brand-primary)] bg-[var(--brand-primary-light)] text-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]"
                              : "border-[var(--border)] bg-[var(--background-card)] text-[var(--foreground)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-primary-light)]"
                          }`}
                        >
                          <span>{opt.optionText}</span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                              isSelected
                                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                                : "border-[var(--border)]"
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

            <div className="mt-8 flex justify-end border-t border-[var(--border-light)] pt-6">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSubmit}
                className="w-full rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-bold text-white shadow hover:bg-[var(--brand-primary-dark)] disabled:opacity-50 sm:w-auto transition-colors"
              >
                {isPending ? "Grading…" : "Submit Practice Quiz →"}
              </button>
            </div>
          </div>
        ) : (
          /* Result Screen */
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background-card)] p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-inner">
              {result.passed ? "🌟" : "💪"}
            </div>

            <h2 className="text-2xl font-extrabold text-[var(--foreground)]">
              {result.passed ? "Great Practice!" : "Keep Practicing!"}
            </h2>

            <p className="mt-1 text-sm text-[var(--foreground-secondary)]">
              {result.passed
                ? `You scored ${result.score}% (${result.correctCount}/${result.totalQuestions} correct).`
                : `You scored ${result.score}%. You need 50% to earn bonus XP.`}
            </p>

            <div className="my-6 inline-flex items-center gap-6 rounded-2xl border border-[var(--border)] bg-[var(--background-secondary)] px-6 py-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                  Score
                </div>
                <div
                  className={`text-3xl font-extrabold ${
                    result.passed ? "text-[var(--success)]" : "text-[var(--warning)]"
                  }`}
                >
                  {result.score}%
                </div>
              </div>
              {result.passed && (
                <>
                  <div className="h-8 w-px bg-[var(--border-light)]" />
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">
                      Bonus XP
                    </div>
                    <div className="text-3xl font-extrabold text-[var(--warning)]">
                      +{result.bonusXpAwarded}
                    </div>
                  </div>
                </>
              )}
            </div>

            <p className="mb-6 text-xs text-[var(--foreground-muted)]">
              Your lesson progress is unchanged — practice mode is bonus only.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/lesson/${lessonId}/practice`}
                className="rounded-xl bg-[var(--brand-primary)] px-6 py-3 text-sm font-bold text-white shadow hover:bg-[var(--brand-primary-dark)] transition-colors"
              >
                Practice Again
              </Link>
              <Link
                href="/path"
                className="rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--background-secondary)] transition-colors"
              >
                Back to Path
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
