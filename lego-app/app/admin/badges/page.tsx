import { getAllBadges, createBadge, updateBadge, deleteBadge } from "./actions";
import { createClient } from "@/utils/supabase/server";

export default async function AdminBadgesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Badges</h1>
        <p>Please sign in to access admin features.</p>
      </div>
    );
  }

  const badges = await getAllBadges();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Badge Management</h1>
        <p className="text-gray-600">Create, edit, and delete badge definitions</p>
      </div>

      {/* Create Badge Form */}
      <div className="bg-white rounded-lg shadow border p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Create New Badge</h2>
        <form action={async (formData) => {
          "use server";
          const data = {
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            icon: formData.get("icon") as string,
            criteriaType: formData.get("criteriaType") as "first_lesson" | "lessons_completed" | "course_complete" | "streak_days" | "xp_earned",
            criteriaValue: parseInt(formData.get("criteriaValue") as string),
          };
          await createBadge(data);
        }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="Badge name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Icon</label>
              <input
                type="text"
                name="icon"
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="🏆"
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
              placeholder="Badge description"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Criteria Type</label>
              <select
                name="criteriaType"
                required
                className="w-full px-3 py-2 border rounded"
              >
                <option value="first_lesson">First Lesson</option>
                <option value="lessons_completed">Lessons Completed</option>
                <option value="streak_days">Streak Days</option>
                <option value="course_complete">Course Complete</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Criteria Value</label>
              <input
                type="number"
                name="criteriaValue"
                required
                className="w-full px-3 py-2 border rounded"
                placeholder="1"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Create Badge
          </button>
        </form>
      </div>

      {/* Badges List */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Icon</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Criteria</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {badges.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No badges found
                </td>
              </tr>
            ) : (
              badges.map((badge: any) => (
                <tr key={badge.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4 text-2xl">{badge.icon}</td>
                  <td className="px-6 py-4 font-medium">{badge.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{badge.description}</td>
                  <td className="px-6 py-4 text-sm">
                    {badge.criteriaType}: {badge.criteriaValue}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Edit
                      </button>
                      <form action={async () => {
                        "use server";
                        await deleteBadge(badge.id);
                      }}>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total badges: {badges.length}
      </div>
    </div>
  );
}
