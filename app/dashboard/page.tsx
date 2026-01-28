// app/dashboard/page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Course = {
  id: string;
  title: string;
  description: string;
};

type Enrollment = {
  course_id: string;
};

type LessonProgress = {
  lesson_id: string;
  status: "Not Started" | "In Progress" | "Completed";
  best_score: number | null;
};

type Lesson = {
  id: string;
  course_id: string;
};

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [coursesRes, enrollmentsRes, lessonsRes, progressRes] = await Promise.all([
    supabase.from("courses").select("*"),
    supabase.from("enrollments").select("*").eq("user_id", user.id),
    supabase.from("lessons").select("*"),
    supabase.from("lesson_progress").select("*").eq("user_id", user.id),
  ]);

  const courses = (coursesRes.data ?? []) as Course[];
  const enrollments = (enrollmentsRes.data ?? []) as Enrollment[];
  const lessons = (lessonsRes.data ?? []) as Lesson[];
  const progress = (progressRes.data ?? []) as LessonProgress[];

  // ✅ Map enrolled courses and lessons
  const enrolledCourseIds = new Set(enrollments.map(e => e.course_id));
  const enrolledLessons = lessons.filter(l => enrolledCourseIds.has(l.course_id));
  const enrolledLessonIds = new Set(enrolledLessons.map(l => l.id));

  const enrolledProgress = progress.filter(p => enrolledLessonIds.has(p.lesson_id));

  // ✅ Compute stats
  const completedLessons = enrolledProgress.filter(p => p.status === "Completed").length;
  const scores = enrolledProgress.filter(p => p.best_score !== null).map(p => p.best_score as number);
  const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  const completionRate = enrolledLessons.length
    ? Math.round((completedLessons / enrolledLessons.length) * 100)
    : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
      <p className="text-gray-600 mb-8">Welcome back, {user.email}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Stat title="Enrolled Courses" value={enrollments.length} />
        <Stat title="Completed Lessons" value={completedLessons} />
        <Stat title="Completion Rate" value={`${completionRate}%`} />
        <Stat title="Average Score" value={`${averageScore}%`} />
      </div>

      {/* Your Courses */}
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Your Courses</h2>

        {enrollments.length === 0 ? (
          <p className="text-gray-500">You haven’t enrolled in any courses yet.</p>
        ) : (
          <div className="space-y-4">
            {enrollments.map(e => {
              const course = courses.find(c => c.id === e.course_id);
              if (!course) return null;

              return (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="block border rounded-lg p-4 hover:border-blue-400 transition"
                >
                  <h3 className="font-semibold">{course.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{course.description}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white border rounded-lg p-6">
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
}
