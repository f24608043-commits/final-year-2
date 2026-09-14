import { db } from "@/db";
import { courses, units, lessons } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import Link from "next/link";

export default async function AdminDashboard() {
  const allCourses = await db
    .select({
      id: courses.id,
      title: courses.title,
      isPublished: courses.isPublished,
    })
    .from(courses)
    .orderBy(courses.createdAt);

  const unitCounts = await db
    .select({ courseId: units.courseId, count: count() })
    .from(units)
    .groupBy(units.courseId);

  const lessonCounts = await db
    .select({ courseId: units.courseId, count: count() })
    .from(lessons)
    .innerJoin(units, eq(lessons.unitId, units.id))
    .groupBy(units.courseId);

  const unitMap = new Map(unitCounts.map((u) => [u.courseId, Number(u.count)]));
  const lessonMap = new Map(lessonCounts.map((l) => [l.courseId, Number(l.count)]));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Course Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create and manage courses, units, lessons, and AI-generated quizzes.
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:bg-blue-700"
        >
          + New Course
        </Link>
      </div>

      {allCourses.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-400">
          No courses yet. Create your first course above.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allCourses.map((course) => (
            <Link
              key={course.id}
              href={`/admin/courses/${course.id}`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <h2 className="font-bold text-gray-900 group-hover:text-blue-700">
                  {course.title}
                </h2>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs font-bold ${
                    course.isPublished
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {course.isPublished ? "Published" : "Draft"}
                </span>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-gray-500">
                <span>{unitMap.get(course.id) || 0} units</span>
                <span>{lessonMap.get(course.id) || 0} lessons</span>
              </div>
              <p className="mt-3 text-xs font-semibold text-blue-600 group-hover:underline">
                Manage →
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
