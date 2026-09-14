"use client";

import { useState, useTransition } from "react";
import {
  generateQuestionsAI,
  saveGeneratedQuestions,
  addQuestion,
  deleteQuestion,
} from "./actions";
import type { GeneratedQuestion } from "@/lib/ai/generateQuiz";

interface Option {
  id: string;
  optionText: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface Challenge {
  id: string;
  questionText: string;
  points: number;
  orderIndex: number;
  options: Option[];
}

interface LessonEditorProps {
  lessonId: string;
  youtubeVideoId: string;
  existingChallenges: Challenge[];
}

export default function LessonEditor({
  lessonId,
  youtubeVideoId,
  existingChallenges,
}: LessonEditorProps) {
  // ── AI Generation State ──
  const [aiPending, startAiTransition] = useTransition();
  const [savePending, startSaveTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();
  const [aiQuestions, setAiQuestions] = useState<GeneratedQuestion[] | null>(null);
  const [aiProvider, setAiProvider] = useState<string>("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiCount, setAiCount] = useState(3);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ── Manual Question State ──
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualOptions, setManualOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);

  // Current challenges list (refreshed after mutations)
  const [challenges, setChallenges] = useState<Challenge[]>(existingChallenges);

  const handleGenerateAI = () => {
    setAiError(null);
    setSaveSuccess(false);
    startAiTransition(async () => {
      const result = await generateQuestionsAI(lessonId, aiCount);
      if (result.error) {
        setAiError(result.error);
      } else {
        setAiQuestions(result.questions);
        setAiProvider(result.provider);
      }
    });
  };

  const handleSaveAiQuestions = () => {
    if (!aiQuestions?.length) return;
    startSaveTransition(async () => {
      await saveGeneratedQuestions(lessonId, aiQuestions);
      setSaveSuccess(true);
      // Optimistically append to challenges list with generated IDs
      const newChallenges: Challenge[] = aiQuestions.map((q, i) => ({
        id: `ai-temp-${Date.now()}-${i}`,
        questionText: q.questionText,
        points: q.points,
        orderIndex: challenges.length + i,
        options: q.options.map((o, j) => ({
          id: `opt-${j}`,
          optionText: o.optionText,
          isCorrect: o.isCorrect,
          orderIndex: j,
        })),
      }));
      setChallenges((prev) => [...prev, ...newChallenges]);
      setAiQuestions(null);
    });
  };

  const handleDeleteQuestion = (challengeId: string) => {
    startDeleteTransition(async () => {
      const fd = new FormData();
      fd.append("challengeId", challengeId);
      fd.append("lessonId", lessonId);
      await deleteQuestion(fd);
      setChallenges((prev) => prev.filter((c) => c.id !== challengeId));
    });
  };

  const updateAiQuestion = (qIdx: number, field: keyof GeneratedQuestion, value: any) => {
    setAiQuestions((prev) => {
      if (!prev) return prev;
      const updated = [...prev];
      updated[qIdx] = { ...updated[qIdx], [field]: value };
      return updated;
    });
  };

  const updateAiOption = (qIdx: number, oIdx: number, field: "optionText" | "isCorrect", value: any) => {
    setAiQuestions((prev) => {
      if (!prev) return prev;
      const updated = [...prev];
      const options = [...updated[qIdx].options];
      if (field === "isCorrect") {
        // Enforce exactly one correct
        options.forEach((o, i) => {
          options[i] = { ...o, isCorrect: i === oIdx };
        });
      } else {
        options[oIdx] = { ...options[oIdx], [field]: value };
      }
      updated[qIdx] = { ...updated[qIdx], options };
      return updated;
    });
  };

  return (
    <div className="space-y-8">
      {/* ── YouTube Thumbnail Preview ── */}
      {youtubeVideoId && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-sm font-extrabold text-gray-700">Video Preview</h3>
          <div className="flex items-start gap-4">
            {/* Thumbnail */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`}
              alt="Video thumbnail"
              className="w-40 rounded-lg border border-gray-200 object-cover shadow-sm"
            />
            <div className="text-sm text-gray-600">
              <p className="font-semibold text-gray-800">YouTube ID: {youtubeVideoId}</p>
              <a
                href={`https://www.youtube.com/watch?v=${youtubeVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-blue-600 hover:underline"
              >
                Watch on YouTube →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── Existing Questions ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-gray-900">
            Quiz Questions ({challenges.length})
          </h3>
        </div>

        {challenges.length === 0 ? (
          <p className="text-sm text-gray-400">
            No questions yet. Add them manually or generate with AI below.
          </p>
        ) : (
          <div className="space-y-4">
            {challenges.map((c, idx) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Q{idx + 1} · {c.points} {c.points === 1 ? "pt" : "pts"}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-900">
                      {c.questionText}
                    </p>
                    <ul className="mt-2 space-y-1">
                      {c.options.map((o) => (
                        <li
                          key={o.id}
                          className={`flex items-center gap-2 text-xs ${
                            o.isCorrect ? "font-bold text-green-700" : "text-gray-500"
                          }`}
                        >
                          <span>{o.isCorrect ? "✓" : "○"}</span>
                          <span>{o.optionText}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <form>
                    <button
                      type="button"
                      disabled={deletePending}
                      onClick={() => handleDeleteQuestion(c.id)}
                      className="ml-4 rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Manual Question Form ── */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-gray-900">Add Question Manually</h3>
          <button
            type="button"
            onClick={() => setShowManualForm((v) => !v)}
            className="text-xs font-semibold text-blue-600 hover:underline"
          >
            {showManualForm ? "Hide ▲" : "Show ▼"}
          </button>
        </div>

        {showManualForm && (
          <form action={addQuestion} className="space-y-4">
            <input type="hidden" name="lessonId" value={lessonId} />

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Question Text <span className="text-red-500">*</span>
              </label>
              <textarea
                name="questionText"
                rows={2}
                required
                placeholder="e.g. What does a Python list allow you to do?"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Points
              </label>
              <input
                name="points"
                type="number"
                min="1"
                defaultValue="1"
                className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">
                Options (mark the correct one)
              </p>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="mb-2 flex items-center gap-3">
                  <input
                    type="radio"
                    name="correctIndex"
                    value={i}
                    checked={correctIndex === i}
                    onChange={() => setCorrectIndex(i)}
                    className="h-4 w-4 text-blue-600"
                  />
                  <input
                    name={`optionText_${i}`}
                    type="text"
                    placeholder={`Option ${i + 1}${i < 2 ? " *" : ""}`}
                    required={i < 2}
                    value={manualOptions[i]}
                    onChange={(e) => {
                      const v = [...manualOptions];
                      v[i] = e.target.value;
                      setManualOptions(v);
                    }}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
              <input type="hidden" name="correctIndex" value={correctIndex} />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-indigo-700"
              >
                Add Question
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── AI Generation (FR9.1b) ── */}
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 shadow-sm">
        <h3 className="mb-1 text-base font-extrabold text-blue-900">
          ✨ Generate Questions with AI
        </h3>
        <p className="mb-4 text-xs text-blue-700">
          AI will draft questions based on the lesson title and description. Review and edit them
          before saving — nothing is stored until you click "Save to Lesson".
        </p>

        <div className="mb-4 flex items-center gap-3">
          <label className="text-xs font-semibold text-blue-800">Number of questions:</label>
          <select
            value={aiCount}
            onChange={(e) => setAiCount(Number(e.target.value))}
            className="rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <button
            type="button"
            disabled={aiPending}
            onClick={handleGenerateAI}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow hover:bg-blue-700 disabled:opacity-50"
          >
            {aiPending ? "Generating…" : "Generate Questions"}
          </button>
        </div>

        {aiError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {aiError}
          </div>
        )}

        {saveSuccess && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            ✅ AI-generated questions saved to lesson!
          </div>
        )}

        {aiQuestions && aiQuestions.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">
                Review & Edit (Provider: {aiProvider})
              </p>
              <button
                type="button"
                onClick={() => setAiQuestions(null)}
                className="text-xs text-gray-400 hover:text-gray-600"
              >
                Discard ✕
              </button>
            </div>

            {aiQuestions.map((q, qIdx) => (
              <div
                key={qIdx}
                className="rounded-xl border border-blue-200 bg-white p-4 shadow-sm"
              >
                <label className="block text-xs font-bold text-gray-500 mb-1">
                  Question {qIdx + 1}
                </label>
                <textarea
                  value={q.questionText}
                  onChange={(e) => updateAiQuestion(qIdx, "questionText", e.target.value)}
                  rows={2}
                  className="mb-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />

                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => (
                    <div key={oIdx} className="flex items-center gap-2">
                      <input
                        type="radio"
                        name={`ai-correct-${qIdx}`}
                        checked={opt.isCorrect}
                        onChange={() => updateAiOption(qIdx, oIdx, "isCorrect", true)}
                        className="h-4 w-4 text-blue-600"
                        title="Mark as correct"
                      />
                      <input
                        type="text"
                        value={opt.optionText}
                        onChange={(e) => updateAiOption(qIdx, oIdx, "optionText", e.target.value)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm focus:outline-none ${
                          opt.isCorrect
                            ? "border-green-400 bg-green-50 font-semibold"
                            : "border-gray-300 bg-white"
                        }`}
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  Select the radio button to change the correct answer.
                </p>
              </div>
            ))}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAiQuestions(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Discard
              </button>
              <button
                type="button"
                disabled={savePending}
                onClick={handleSaveAiQuestions}
                className="rounded-lg bg-green-600 px-5 py-2 text-sm font-bold text-white shadow hover:bg-green-700 disabled:opacity-50"
              >
                {savePending ? "Saving…" : "✓ Save to Lesson"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
