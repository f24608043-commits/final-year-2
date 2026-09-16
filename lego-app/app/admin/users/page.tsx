import { getAllUsers, changeUserRole } from "./actions";
import { createClient } from "@/utils/supabase/server";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Users</h1>
        <p>Please sign in to access admin features.</p>
      </div>
    );
  }

  const searchQuery = searchParams.q || "";
  const users = await getAllUsers(searchQuery);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">User Management</h1>
        <p className="text-gray-600">View and manage user roles</p>
      </div>

      {/* Search */}
      <div className="mb-6">
        <form>
          <input
            type="text"
            name="q"
            placeholder="Search users by name or role..."
            defaultValue={searchQuery}
            className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            className="ml-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Role</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">XP</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Streak</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((user: any) => (
                <tr key={user.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium">{user.displayName || "Anonymous"}</div>
                    <div className="text-sm text-gray-500">{user.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === "admin"
                          ? "bg-purple-100 text-purple-800"
                          : user.role === "tutor"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">{user.xp || 0}</td>
                  <td className="px-6 py-4">{user.streakCount || 0} days</td>
                  <td className="px-6 py-4">
                    <form action={async (formData) => {
                      "use server";
                      const newRole = formData.get("role") as "learner" | "tutor" | "admin";
                      await changeUserRole(user.id, newRole);
                    }}>
                      <select
                        name="role"
                        defaultValue={user.role}
                        className="px-3 py-1 border rounded text-sm mr-2"
                      >
                        <option value="learner">Learner</option>
                        <option value="tutor">Tutor</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                      >
                        Change
                      </button>
                    </form>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total users: {users.length}
      </div>
    </div>
  );
}
