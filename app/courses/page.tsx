"use client";

import { useAuth } from "../context/AuthProvider";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Course = {
  id: string;
  title: string;
  description: string;
};

type Enrollment = {
  course_id: string;
  user_id: string;
};

type Lesson = {
  id: string;
  course_id: string;
  title: string;
};

type LessonProgress = {
  lesson_id: string;
  status: "Not Started" | "In Progress" | "Completed";
  best_score: number;
};

export default function CoursesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, LessonProgress[]>>({});
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [enrollingCourseId, setEnrollingCourseId] = useState<string | null>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoadingCourses(true);

    try {
      const [coursesRes, enrollmentsRes, lessonsRes, progressRes] = await Promise.all([
        supabase.from("courses").select("*"),
        supabase.from("enrollments").select("*").eq("user_id", user.id),
        supabase.from("lessons").select("*"),
        supabase.from("lesson_progress").select("*").eq("user_id", user.id),
      ]);

      const coursesData = coursesRes.data || [];
      const enrollmentsData = enrollmentsRes.data || [];
      const lessonsData = lessonsRes.data || [];
      const progressData = progressRes.data || [];

      setCourses(coursesData);
      setEnrollments(enrollmentsData);
      setLessons(lessonsData);

      const progressMap: Record<string, LessonProgress[]> = {};
      progressData.forEach((p: any) => {
        const lesson = lessonsData.find((l: any) => l.id === p.lesson_id);
        if (!lesson) return;
        if (!progressMap[lesson.course_id]) progressMap[lesson.course_id] = [];
        progressMap[lesson.course_id].push({
          lesson_id: p.lesson_id,
          status: p.status,
          best_score: p.best_score || 0,
        });
      });

      setProgress(progressMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCourses(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, fetchData]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`lesson_progress:courses:${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "lesson_progress", filter: `user_id=eq.${user.id}` },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  const handleEnroll = async (courseId: string) => {
    if (!user) return;
    setEnrollingCourseId(courseId);

    try {
      if (enrollments.some((e) => e.course_id === courseId)) return;

      const { error } = await supabase.from("enrollments").insert({
        user_id: user.id,
        course_id: courseId,
        enrolled_at: new Date(),
      });

      if (!error) {
        setEnrollments([...enrollments, { user_id: user.id, course_id: courseId }]);
        setMessage({ text: "Successfully enrolled!", type: "success" });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ text: "Failed to enroll, please try again.", type: "error" });
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "An error occurred. Please try again.", type: "error" });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setEnrollingCourseId(null);
    }
  };

  if (loading || loadingCourses) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Courses</h1>
        <p className="text-gray-600">Explore and enroll in courses to start learning</p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center">
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}

      {courses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No courses available at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => {
            const isEnrolled = enrollments.some((e) => e.course_id === course.id);
            const courseLessons = lessons.filter((l) => l.course_id === course.id);
            const completedLessons = progress[course.id]?.filter((l) => l.status === "Completed").length || 0;
            const avgScore =
              progress[course.id]?.length > 0
                ? Math.round(
                    progress[course.id].reduce((sum, l) => sum + (l.best_score || 0), 0) / progress[course.id].length
                  )
                : 0;
            const progressPercent =
              courseLessons.length > 0 ? Math.round((completedLessons / courseLessons.length) * 100) : 0;
            const isEnrolling = enrollingCourseId === course.id;

            return (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
              >
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>

                  {isEnrolled && (
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Progress</span>
                        <span className="font-medium">{progressPercent}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{completedLessons} of {courseLessons.length} lessons completed</span>
                        {avgScore > 0 && <span>Avg: {avgScore}%</span>}
                      </div>
                    </div>
                  )}

                  {!isEnrolled && (
                    <div className="mb-4 text-sm text-gray-500">
                      <p>{courseLessons.length} lessons available</p>
                    </div>
                  )}
                </div>

                <div className="px-6 pb-6">
                  {isEnrolled ? (
                    <button
                      onClick={() => router.push(`/courses/${course.id}`)}
                      className="w-full bg-blue-600 text-white px-4 py-2.5 rounded-md hover:bg-blue-700 transition font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Continue Learning
                    </button>
                  ) : (
                    <button
                      onClick={() => handleEnroll(course.id)}
                      disabled={isEnrolling}
                      className={`w-full px-4 py-2.5 rounded-md transition font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                        isEnrolling
                          ? "bg-gray-400 text-white cursor-not-allowed"
                          : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                      }`}
                    >
                      {isEnrolling ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Enrolling...
                        </span>
                      ) : (
                        "Enroll Now"
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
