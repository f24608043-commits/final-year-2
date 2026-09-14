import { redirect } from "next/navigation";

// /admin/courses → redirect to main admin dashboard
export default function AdminCoursesRedirect() {
  redirect("/admin");
}
