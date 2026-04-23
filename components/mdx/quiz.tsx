"use client";

import { useState, useCallback } from "react";
import { CheckCircle2, XCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export function Quiz({
  questions,
  guideSlug,
}: {
  questions: QuizQuestion[];
  guideSlug: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>(
    () => new Array(questions.length).fill(null),
  );
  const [showReview, setShowReview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [xpAwarded, setXpAwarded] = useState<number | null>(null);

  const current = questions[currentIndex];
  const isAnswered = answers[currentIndex] !== null;
  const isLast = currentIndex === questions.length - 1;

  const handleSelect = useCallback(
    (optionIndex: number) => {
      if (isAnswered) return;
      setSelected(optionIndex);
    },
    [isAnswered],
  );

  const handleConfirm = useCallback(() => {
    if (selected === null) return;
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = selected;
      return next;
    });
  }, [selected, currentIndex]);

  const handleNext = useCallback(() => {
    if (isLast) {
      setShowReview(true);
      return;
    }
    setCurrentIndex((i) => i + 1);
    setSelected(null);
  }, [isLast]);

  const handleSubmit = useCallback(async () => {
    if (submitted) return;
    const score = answers.filter(
      (a, i) => a === questions[i].correctIndex,
    ).length;
    const xp = score * 10;

    try {
      const res = await fetch("/api/guides/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guideSlug, score, total: questions.length }),
      });
      if (res.ok) {
        const data = await res.json();
        setXpAwarded(data.xpAwarded ?? xp);
      } else {
        setXpAwarded(xp);
      }
    } catch {
      setXpAwarded(xp);
    }
    setSubmitted(true);
  }, [submitted, answers, questions, guideSlug]);

  const totalCorrect = answers.filter(
    (a, i) => a === questions[i].correctIndex,
  ).length;

  if (showReview) {
    return (
      <div className="my-8 rounded-xl border border-slate-700 bg-slate-900 p-6">
        <div className="mb-6 flex items-center gap-3">
          <Trophy className="h-6 w-6 text-amber-400" />
          <h3 className="text-lg font-semibold text-slate-100">
            Quiz Results: {totalCorrect} / {questions.length}
          </h3>
        </div>

        {!submitted && (
          <button
            onClick={handleSubmit}
            className="mb-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 transition-colors"
          >
            Submit &amp; claim {totalCorrect * 10} XP
          </button>
        )}

        {xpAwarded !== null && (
          <p className="mb-6 text-sm text-emerald-400 font-medium">
            +{xpAwarded} XP awarded!
          </p>
        )}

        <div className="space-y-4">
          {questions.map((q, qi) => {
            const correct = answers[qi] === q.correctIndex;
            return (
              <div
                key={qi}
                className={cn(
                  "rounded-lg border p-4",
                  correct
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : "border-red-500/30 bg-red-500/5",
                )}
              >
                <div className="flex items-start gap-2">
                  {correct ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 text-red-400 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium text-slate-200">
                      {q.question}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Your answer: {q.options[answers[qi]!]}
                      {!correct && (
                        <>
                          {" "}
                          · Correct: {q.options[q.correctIndex]}
                        </>
                      )}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="my-8 rounded-xl border border-slate-700 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-100">Quiz</h3>
        <span className="text-xs text-slate-500">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <p className="mb-4 text-sm text-slate-200">{current.question}</p>

      <div className="space-y-2">
        {current.options.map((option, oi) => {
          const isCorrect = oi === current.correctIndex;
          const isSelected = selected === oi || answers[currentIndex] === oi;
          const wasChosen = answers[currentIndex] === oi;
          const revealed = isAnswered;

          return (
            <button
              key={oi}
              onClick={() => handleSelect(oi)}
              disabled={isAnswered}
              className={cn(
                "w-full rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                !revealed && !isSelected &&
                  "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500",
                !revealed && isSelected &&
                  "border-blue-500 bg-blue-500/10 text-blue-300",
                revealed && isCorrect &&
                  "border-emerald-500 bg-emerald-500/10 text-emerald-300",
                revealed && wasChosen && !isCorrect &&
                  "border-red-500 bg-red-500/10 text-red-300",
                revealed && !isCorrect && !wasChosen &&
                  "border-slate-700/50 bg-slate-800/50 text-slate-500",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>

      {isAnswered && (
        <p className="mt-3 text-xs text-slate-400">{current.explanation}</p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {!isAnswered && (
          <button
            onClick={handleConfirm}
            disabled={selected === null}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40 transition-colors"
          >
            Confirm
          </button>
        )}
        {isAnswered && (
          <button
            onClick={handleNext}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-600 transition-colors"
          >
            {isLast ? "See results" : "Next"}
          </button>
        )}
      </div>
    </div>
  );
}
