"use client";

import { useEffect } from "react";

interface CelebrationProps {
  lessonTitle: string;
  xpEarned: number;
  totalXP: number;
  lessonsCompleted: number;
  accuracy: number;
  streakDays: number;
  badge?: {
    name: string;
    description: string;
  };
  onNextLesson: () => void;
  onReview: () => void;
  onReturnToPath: () => void;
}

export default function Celebration({
  lessonTitle,
  xpEarned,
  totalXP,
  lessonsCompleted,
  accuracy,
  streakDays,
  badge,
  onNextLesson,
  onReview,
  onReturnToPath,
}: CelebrationProps) {
  useEffect(() => {
    // Generate confetti pieces
    const field = document.getElementById("confetti-field");
    if (!field) return;

    const colors = [
      "bg-[var(--brand-primary)]",
      "bg-[var(--brand-secondary)]",
      "bg-[var(--brand-tertiary)]",
      "bg-[var(--error)]",
      "bg-[var(--success)]",
      "bg-[var(--warning)]",
    ];

    for (let i = 0; i < 30; i++) {
      const piece = document.createElement("div");
      const size = Math.floor(Math.random() * 8) + 6;
      const left = Math.floor(Math.random() * 96) + 2;
      const top = Math.floor(Math.random() * 85) + 5;
      const rot = Math.floor(Math.random() * 360);
      const color = colors[Math.floor(Math.random() * colors.length)];
      
      piece.className = `absolute rounded-sm ${color} opacity-80 pointer-events-none animate-bounce`;
      piece.style.width = `${size}px`;
      piece.style.height = `${size * 1.5}px`;
      piece.style.left = `${left}%`;
      piece.style.top = `${top}%`;
      piece.style.transform = `rotate(${rot}deg)`;
      piece.style.animationDelay = `${Math.random() * 2}s`;
      piece.style.animationDuration = `${Math.random() * 2 + 1}s`;
      field.appendChild(piece);
    }

    return () => {
      field.innerHTML = "";
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[var(--background)]/95 flex items-center justify-center p-4 z-50">
      <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center">
        {/* Confetti Field */}
        <div
          id="confetti-field"
          className="absolute inset-0 pointer-events-none overflow-hidden"
        >
          <div className="absolute top-10 left-12 w-3 h-6 bg-[var(--brand-secondary)] rounded-sm rotate-45 animate-bounce" />
          <div className="absolute top-20 right-16 w-4 h-4 bg-[var(--brand-primary)] rounded-full animate-ping" />
          <div className="absolute top-36 left-1/4 w-3 h-5 bg-[var(--brand-tertiary)] rounded-sm -rotate-12 animate-pulse" />
          <div className="absolute top-14 right-1/3 w-4 h-2 bg-[var(--error)] rounded-sm rotate-45" />
          <div className="absolute top-48 right-1/4 w-3 h-3 bg-[var(--brand-secondary)] rounded-full" />
          <div className="absolute top-28 left-1/3 w-2 h-6 bg-[var(--brand-primary)] rotate-12" />
          <div className="absolute top-64 right-12 w-5 h-2 bg-[var(--brand-tertiary)] rounded-sm rotate-45" />
          <div className="absolute top-56 left-10 w-3 h-3 bg-[var(--brand-primary)] rounded-full" />
        </div>

        <div className="w-full flex flex-col items-center text-center relative z-10">
          {/* Mascot */}
          <div className="relative mb-6 group cursor-pointer">
            <div className="absolute -inset-4 bg-gradient-to-r from-[var(--brand-primary)] via-[var(--brand-secondary)] to-[var(--brand-tertiary)] rounded-full blur-2xl opacity-60 animate-pulse" />
            <div className="relative w-44 h-44 rounded-full bg-[var(--background-card)] flex items-center justify-center shadow-xl transition-transform duration-300 hover:scale-105">
              <div className="relative w-36 h-36 rounded-full bg-[var(--background)] flex items-center justify-center overflow-hidden">
                {/* LEGO Mascot SVG */}
                <svg
                  className="w-28 h-28 text-[var(--brand-primary)]"
                  fill="none"
                  viewBox="0 0 100 100"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Hat */}
                  <path d="M50 12 L64 36 L36 36 Z" fill="#fea619" />
                  <circle cx="50" cy="10" fill="#ba1a1a" r="4" />
                  {/* Face */}
                  <circle cx="42" cy="24" fill="#ffffff" r="2.5" />
                  <circle cx="56" cy="30" fill="#82abff" r="2" />
                  <rect
                    fill="#006e2f"
                    height="42"
                    rx="14"
                    width="48"
                    x="26"
                    y="36"
                  />
                  <rect
                    fill="#ffffff"
                    height="24"
                    rx="8"
                    width="32"
                    x="34"
                    y="44"
                  />
                  <circle cx="42" cy="54" fill="#131b2e" r="4" />
                  <circle cx="58" cy="54" fill="#131b2e" r="4" />
                  <circle cx="43.5" cy="52.5" fill="#ffffff" r="1.5" />
                  <circle cx="59.5" cy="52.5" fill="#ffffff" r="1.5" />
                  <path
                    d="M44 62 Q50 67 56 62"
                    stroke="#131b2e"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                    fill="none"
                  />
                  {/* Arms */}
                  <rect
                    fill="#4ae176"
                    height="18"
                    rx="4"
                    transform="rotate(-25 18 44)"
                    width="8"
                    x="18"
                    y="44"
                  />
                  <rect
                    fill="#4ae176"
                    height="18"
                    rx="4"
                    transform="rotate(25 74 44)"
                    width="8"
                    x="74"
                    y="44"
                  />
                  {/* Legs */}
                  <rect
                    fill="#004b1e"
                    height="12"
                    rx="4"
                    width="10"
                    x="36"
                    y="78"
                  />
                  <rect
                    fill="#004b1e"
                    height="12"
                    rx="4"
                    width="10"
                    x="54"
                    y="78"
                  />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 bg-[var(--brand-secondary)] text-[var(--on-brand-secondary)] px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5">
                <span className="text-lg">⭐</span>
                <span className="text-sm font-semibold">LVL UP!</span>
              </div>
            </div>
          </div>

          {/* Lesson Tag */}
          <div className="inline-flex items-center gap-2 bg-[var(--background-card)] px-4 py-1 rounded-full mb-4 shadow-sm">
            <span className="text-[var(--brand-primary)] text-lg">✓</span>
            <span className="text-sm uppercase tracking-wider text-[var(--foreground-secondary)]">
              {lessonTitle}
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight leading-tight mb-2">
            Lesson Complete! 🎉
          </h1>

          <p className="text-lg text-[var(--foreground-secondary)] max-w-lg mb-8">
            You mastered this lesson with a{" "}
            <span className="font-semibold text-[var(--brand Primary)]">
              {accuracy}% accuracy
            </span>
            !
          </p>

          {/* Stats Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8 text-left">
            {/* XP Card */}
            <div className="bg-[var(--background-card)] rounded-xl p-4 shadow-md flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-[var(--foreground-secondary)]">
                  Experience
                </span>
                <div className="w-9 h-9 rounded-lg bg-[var(--brand-primary-light)] flex items-center justify-center text-[var(--brand-primary)] shadow-sm">
                  <span className="text-xl">⚡</span>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-[var(--brand-primary)] leading-none mb-1">
                  +{xpEarned} XP
                </div>
                <div className="text-sm text-[var(--foreground-secondary)]">
                  Total:{" "}
                  <span className="font-semibold text-[var(--foreground)]">
                    {totalXP} XP
                  </span>
                </div>
              </div>
            </div>

            {/* Lessons Card */}
            <div className="bg-[var(--background-card)] rounded-xl p-4 shadow-md flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-[var(--foreground-secondary)]">
                  Curriculum
                </span>
                <div className="w-9 h-9 rounded-lg bg-[var(--brand-primary)] flex items-center justify-center text-white shadow-sm">
                  <span className="text-xl">📚</span>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-[var(--brand-primary)] leading-none mb-1">
                  +1 Lesson
                </div>
                <div className="text-sm text-[var(--foreground-secondary)]">
                  Mastered (
                  <span className="font-semibold text-[var(--foreground)]">
                    {lessonsCompleted} Total
                  </span>
                  )
                </div>
              </div>
            </div>

            {/* Accuracy Card */}
            <div className="bg-[var(--background-card)] rounded-xl p-4 shadow-md flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-[var(--foreground-secondary)]">
                  Accuracy
                </span>
                <div className="w-9 h-9 rounded-lg bg-[var(--brand-secondary)] flex items-center justify-center text-[var(--on-brand-secondary)] shadow-sm">
                  <span className="text-xl">🎯</span>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-[var(--brand-secondary)] leading-none mb-1">
                  {accuracy}%
                </div>
                <div className="text-sm text-[var(--foreground-secondary)]">
                  Perfect Score!
                </div>
              </div>
            </div>

            {/* Streak Card */}
            <div className="bg-[var(--background-card)] rounded-xl p-4 shadow-md flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase tracking-wider text-[var(--foreground-secondary)]">
                  Daily Streak
                </span>
                <div className="w-9 h-9 rounded-lg bg-[var(--error)] flex items-center justify-center text-white shadow-sm">
                  <span className="text-xl">🔥</span>
                </div>
              </div>
              <div>
                <div className="text-xl font-bold text-[var(--error)] leading-none mb-1">
                  {streakDays} Days
                </div>
                <div className="text-sm text-[var(--foreground-secondary)]">
                  Streak Maintained!
                </div>
              </div>
            </div>
          </div>

          {/* Badge Card */}
          {badge && (
            <div className="w-full bg-gradient-to-r from-[var(--brand-secondary)] to-[var(--brand-secondary-light)] rounded-xl p-6 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 text-left">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl bg-[var(--background-card)] flex items-center justify-center text-[var(--brand-secondary)] shadow-md shrink-0">
                  <span className="text-4xl">🏆</span>
                </div>
                <div className="flex flex-col">
                  <div className="inline-flex items-center gap-2 mb-1">
                    <span className="text-lg font-semibold text-[var(--on-brand-secondary)]">
                      {badge.name}
                    </span>
                    <span className="text-xl">🏅</span>
                    <span className="bg-[var(--background-card)] text-[var(--brand-secondary)] text-xs px-2 py-0.5 rounded-full uppercase font-semibold">
                      Unlocked
                    </span>
                  </div>
                  <p className="text-sm text-[var(--on-brand-secondary)]">
                    {badge.description}
                  </p>
                </div>
              </div>
              <div className="shrink-0">
                <button
                  className="px-4 py-2 rounded-lg bg-[var(--background-card)] text-[var(--brand-secondary)] font-semibold shadow-sm hover:bg-[var(--background)] transition-all cursor-pointer"
                  type="button"
                >
                  View Trophy
                </button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="w-full max-w-md flex flex-col items-center gap-3">
            <button
              onClick={onNextLesson}
              className="w-full py-4 px-6 rounded-xl bg-[var(--brand-primary)] text-white font-semibold shadow-lg hover:bg-[var(--brand-primary-dark)] transition-all flex items-center justify-center gap-2 cursor-pointer group"
              type="button"
            >
              <span>Continue to Next Lesson</span>
              <span className="text-xl group-hover:translate-x-1 transition-transform">
                →
              </span>
            </button>
            <button
              onClick={onReview}
              className="w-full py-3 px-4 rounded-xl bg-[var(--background-card)] text-[var(--foreground)] font-semibold shadow-sm hover:bg-[var(--border)] transition-all flex items-center justify-center gap-2 cursor-pointer"
              type="button"
            >
              <span className="text-lg text-[var(--foreground-secondary)]">📝</span>
              <span>Review Lesson Notes</span>
            </button>
            <button
              onClick={onReturnToPath}
              className="mt-2 inline-flex items-center gap-2 text-sm text-[var(--foreground-secondary)] hover:text-[var(--brand-primary)] transition-colors cursor-pointer"
            >
              <span className="text-lg">←</span>
              <span>Return to Learning Path</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
