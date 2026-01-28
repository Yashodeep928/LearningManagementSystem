import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import QuizClient from "./QuizClient";



export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  
  const { courseId, lessonId } = await params;

  
  const supabase = await createSupabaseServerClient();

 
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  
  const [lessonRes, quizRes, progressRes] = await Promise.all([
    supabase
      .from("lessons")
      .select("*")
      .eq("id", lessonId)
      .single(),

    supabase
      .from("quizzes")
      .select("id")
      .eq("lesson_id", lessonId),

    supabase
      .from("lesson_progress")
      .select("best_score,status")
      .eq("user_id", user.id)
      .eq("lesson_id", lessonId)
      .maybeSingle(),
  ]);

  if (!lessonRes.data) {
    return (
      <div className="p-8 text-center text-red-600">
        Lesson not found
      </div>
    );
  }

  /* ---------- QUIZ QUESTIONS ---------- */
  const quizId = quizRes.data?.[0]?.id ?? null;

  let questions: any[] = [];
  if (quizId) {
    const qRes = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("order_index", { ascending: true });

    questions = qRes.data ?? [];
  }

 
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link
        href={`/courses/${courseId}`}
        className="text-blue-600 mb-4 inline-block"
      >
        ← Back to Course
      </Link>

      <div className="bg-white border rounded p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">
          {lessonRes.data.title}
        </h1>
        <div className="whitespace-pre-wrap">
          {lessonRes.data.content}
        </div>
      </div>

      <QuizClient
        userId={user.id}
        lessonId={lessonId}
        quizQuestions={questions}
        progress={progressRes.data}
      />
    </div>
  );
}
