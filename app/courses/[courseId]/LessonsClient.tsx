"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase/client";
import Link from "next/link";

type Lesson = {
  id: string;
  title: string;
  order: number;
};

type LessonProgress = {
  lesson_id: string;
  status: "Not Started" | "In Progress" | "Completed";
};

interface LessonsClientProps {
  courseId: string;
  lessons: Lesson[];
}

export default function LessonsClient({
  courseId,
  lessons,
}: LessonsClientProps) {
  const [progressMap, setProgressMap] = useState<Record<string, LessonProgress>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (lessons.length === 0) {
      setLoading(false);
      return;
    }

    const fetchProgress = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("lesson_progress")
        .select("*")
        .eq("user_id", userId)
        .in("lesson_id", lessons.map(l => l.id));

      const map: Record<string, LessonProgress> = {};
      data?.forEach(p => (map[p.lesson_id] = p));
      setProgressMap(map);
      setLoading(false);
    };

    fetchProgress();
  }, [lessons]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {lessons.length === 0 ? (
          <li className="px-6 py-8 text-center text-gray-500">
            No lessons available yet.
          </li>
        ) : (
          lessons.map(lesson => {
            const status = progressMap[lesson.id]?.status ?? "Not Started";

            return (
              <li key={lesson.id} className="px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-medium text-sm">{lesson.order}</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{lesson.title}</h3>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : status === "In Progress"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {loading ? "Loading..." : status}
                    </span>
                    <Link
                      href={`/courses/${courseId}/lessons/${lesson.id}`}
                      prefetch={true}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      {status === "Completed"
                        ? "Review"
                        : status === "In Progress"
                        ? "Continue"
                        : "Start Quiz"}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
