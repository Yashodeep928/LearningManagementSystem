import Link from "next/link";
import { createSupabaseServerClient } from "../../../lib/supabase/server";
import LessonsClient from "./LessonsClient";

type Lesson = {
  id: string;
  title: string;
  order: number;
};

type Course = {
  id: string;
  title: string;
  description: string;
};

interface CourseDetailProps {
  params: Promise<{ courseId: string }>;
}

export default async function CourseDetail({ params }: CourseDetailProps) {
  const { courseId } = await params;

  const supabase = await createSupabaseServerClient();

  const { data: course } = await supabase
    .from("courses")
    .select("*")
    .eq("id", courseId)
    .single();

  if (!course) {
    return <p className="p-8 text-center">Course not found.</p>;
  }


  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .eq("course_id", courseId)
    .order("order", { ascending: true });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/courses"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium inline-flex items-center"
        >
          ← Back to Courses
        </Link>

        <h1 className="text-3xl font-bold text-gray-900 mt-4">
          {course.title}
        </h1>
        <p className="text-gray-600 mt-2">{course.description}</p>
      </div>

    
      <LessonsClient
        courseId={courseId}
        lessons={(lessons as Lesson[]) ?? []}
      />
    </div>
  );
}
