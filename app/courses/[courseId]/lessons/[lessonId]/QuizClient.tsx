"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";


type QuizQuestion = {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: number;
};

type Score = {
  correct: number;
  total: number;
  percentage: number;
};

interface QuizClientProps {
  userId: string;
  lessonId: string;
  quizQuestions: QuizQuestion[];
  progress: {
    best_score?: number | null;
    status?: string | null;
  } | null;
}


export default function QuizClient({
  userId,
  lessonId,
  quizQuestions,
  progress,
}: QuizClientProps) {
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [score, setScore] = useState<Score | null>(null);


  useEffect(() => {
    const submitted =
      progress?.best_score !== null &&
      progress?.best_score !== undefined;

    setHasSubmitted(submitted);
    setShowAnswers(submitted);
  }, [progress]);


  useEffect(() => {
    if (!quizStarted || timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizStarted, timeRemaining]);


  const startQuiz = () => {
    if (hasSubmitted) {
      setMessage("Quiz already submitted.");
      return;
    }
    setQuizStarted(true);
    setTimeRemaining(quizQuestions.length * 60);
  };

  const selectAnswer = (questionId: string, optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const submitQuiz = async () => {
    if (hasSubmitted || submitting) return;

    if (Object.keys(answers).length !== quizQuestions.length) {
      setMessage("Please answer all questions.");
      return;
    }

    setSubmitting(true);
    setQuizStarted(false);
    setTimeRemaining(null);

    const correct = quizQuestions.filter(
      (q) => answers[q.id] === q.correct_answer
    ).length;

    const percentage = Math.round(
      (correct / quizQuestions.length) * 100
    );

    const passed = percentage >= 60;

    await supabase.from("lesson_progress").upsert({
      user_id: userId,
      lesson_id: lessonId,
      status: passed ? "Completed" : "In Progress",
      best_score: percentage,
    });

    setScore({
      correct,
      total: quizQuestions.length,
      percentage,
    });

    setMessage(
      passed
        ? `🎉 Passed with ${percentage}%`
        : `❌ Failed with ${percentage}%`
    );

    setHasSubmitted(true);
    setShowAnswers(true);
    setSubmitting(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };


  if (quizQuestions.length === 0) {
    return (
      <div className="text-center text-gray-500">
        No quiz available for this lesson.
      </div>
    );
  }

  return (
    <div className="bg-white border rounded">
      <div className="p-6 border-b bg-gray-50 flex justify-between">
        <h2 className="text-2xl font-semibold">Quiz</h2>
        {timeRemaining !== null && timeRemaining > 0 && (
          <div className="font-medium">
            ⏱️ {formatTime(timeRemaining)}
          </div>
        )}
      </div>

      {!quizStarted && !showAnswers && !hasSubmitted && (
        <div className="p-6">
          <p className="mb-4">
            {quizQuestions.length} questions ·{" "}
            {quizQuestions.length * 60} seconds
          </p>
          <button
            onClick={startQuiz}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Start Quiz
          </button>
        </div>
      )}

      {quizStarted && (
        <div className="p-6">
          {quizQuestions.map((q, index) => (
            <div key={q.id} className="mb-6 border p-4 rounded">
              <p className="text-sm text-gray-500 mb-2">
                Question {index + 1} of {quizQuestions.length}
              </p>
              <p className="font-medium mb-4">
                {q.question_text}
              </p>

              {q.options.map((option, idx) => (
                <label key={idx} className="block mb-2 cursor-pointer">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === idx}
                    onChange={() => selectAnswer(q.id, idx)}
                    disabled={submitting || hasSubmitted}
                    className="mr-2"
                  />
                  {option}
                </label>
              ))}
            </div>
          ))}

          <button
            onClick={submitQuiz}
            disabled={submitting}
            className="bg-blue-600 text-white px-6 py-2 rounded"
          >
            Submit Quiz
          </button>
        </div>
      )}

      {message && (
        <div className="p-6 border-t">
          <p className="font-medium">{message}</p>
          {score && (
            <p className="text-sm mt-2">
              Score: {score.correct}/{score.total} (
              {score.percentage}%)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
