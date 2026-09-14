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
    <div className="min-h-screen bg-gray-50 pb-16">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href={`/lesson/${lessonId}`}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              ← Back to Lesson
            </Link>
            <div>
              <span className="text-xs font-semibold uppercase text-purple-600">
                Practice Mode
              </span>
              <h1 className="text-sm font-bold text-gray-900">{lessonTitle}</h1>
            </div>
          </div>
          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
            Bonus XP Quiz
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-8">
        {!result ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 rounded-xl border border-purple-100 bg-purple-50 p-4">
              <p className="text-sm font-semibold text-purple-800">
                🎯 Practice Quiz — AI-Generated
              </p>
              <p className="mt-1 text-xs text-purple-600">
                These questions are freshly generated just for extra practice. Pass to earn
                bonus XP! (Provider: {provider})
              </p>
            </div>

            {errorMsg && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                {errorMsg}
              </div>
            )}

            <div className="space-y-8">
              {questions.map((q, qIdx) => (
                <div
                  key={qIdx}
                  className="rounded-xl border border-gray-200 bg-gray-50/50 p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Question {qIdx + 1} of {questions.length}
                    </span>
                    <span className="text-xs font-medium text-gray-400">
                      {q.points} {q.points === 1 ? "point" : "points"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold text-gray-900">
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
                              ? "border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-600"
                              : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                        >
                          <span>{opt.optionText}</span>
                          <span
                            className={`flex h-5 w-5 items-center justify-center rounded-full border text-xs ${
                              isSelected
                                ? "border-purple-600 bg-purple-600 text-white"
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

            <div className="mt-8 flex justify-end border-t border-gray-100 pt-6">
              <button
                type="button"
                disabled={isPending}
                onClick={handleSubmit}
                className="w-full rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-purple-700 disabled:opacity-50 sm:w-auto"
              >
                {isPending ? "Grading…" : "Submit Practice Quiz →"}
              </button>
            </div>
          </div>
        ) : (
          /* Result Screen */
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-10">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-4xl shadow-inner">
              {result.passed ? "🌟" : "💪"}
            </div>

            <h2 className="text-2xl font-extrabold text-gray-900">
              {result.passed ? "Great Practice!" : "Keep Practicing!"}
            </h2>

            <p className="mt-1 text-sm text-gray-600">
              {result.passed
                ? `You scored ${result.score}% (${result.correctCount}/${result.totalQuestions} correct).`
                : `You scored ${result.score}%. You need 50% to earn bonus XP.`}
            </p>

            <div className="my-6 inline-flex items-center gap-6 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-4">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Score
                </div>
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
                    <div className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Bonus XP
                    </div>
                    <div className="text-3xl font-extrabold text-yellow-600">
                      +{result.bonusXpAwarded}
                    </div>
                  </div>
                </>
              )}
            </div>

            <p className="mb-6 text-xs text-gray-400">
              Your lesson progress is unchanged — practice mode is bonus only.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href={`/lesson/${lessonId}/practice`}
                className="rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow hover:bg-purple-700"
              >
                Practice Again
              </Link>
              <Link
                href="/path"
                className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
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
