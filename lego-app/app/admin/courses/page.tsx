import { getAllCourses, createCourse, createUnit, createLesson, getCourseUnits, getUnitLessons } from "./actions";
import { createClient } from "@/utils/supabase/server";

export default async function AdminCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Courses</h1>
        <p>Please sign in to access admin features.</p>
      </div>
    );
  }

  const courses = await getAllCourses();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Course Management</h1>
        <p className="text-gray-600">Create and manage courses, units, and lessons</p>
      </div>

      {/* Create Course Form */}
      <div className="bg-white rounded-lg shadow border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Course</h2>
        <form action={async (formData) => {
          "use server";
          const data = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            category: formData.get("category") as string,
          };
          await createCourse(data);
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Course Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="Course name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                name="category"
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="Programming"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              name="description"
              required
              className="w-full px-3 py-2 border rounded"
              rows={2}
              placeholder="Course description"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Create Course
          </button>
        </form>
      </div>

      {/* Courses List */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No courses found. Create your first course above.
                </td>
              </tr>
            ) : (
              courses.map((course: any) => (
                <tr key={course.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{course.name}</td>
                  <td className="px-6 py-4">{course.category}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{course.description}</td>
                  <td className="px-6 py-4">
                    <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                      Manage Units
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total courses: {courses.length}
      </div>
    </div>
  );
}
