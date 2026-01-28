// "use server";
// import { createSupabaseServerClient } from "@/lib/supabase/server";

// export async function enrollCourse(courseId: string) {
//   const supabase = await createSupabaseServerClient();

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) throw new Error("User not logged in");

//   // Check if already enrolled
//   const { data: existing } = await supabase
//     .from("enrollments")
//     .select("*")
//     .eq("user_id", user.id)
//     .eq("course_id", courseId)
//     .single();

//   if (existing) return existing;

//   // Insert enrollment
//   const { data, error } = await supabase.from("enrollments").insert({
//     user_id: user.id,
//     course_id: courseId,
//   });

//   if (error) throw error;
//   return data;
// }