"use server";

import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { courses, profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function createCourse(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  // NFR5: re-validate admin role server-side, independent of layout gate
  const [profile] = await db
    .select({ role: profiles.role })
    .from(profiles)
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!profile || profile.role !== "admin") {
    throw new Error("Unauthorized: admin role required");
  }

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const coverUrl = (formData.get("coverUrl") as string)?.trim() || null;
  const isPublished = formData.get("isPublished") === "on";

  if (!title) throw new Error("Course title is required");

  const [newCourse] = await db
    .insert(courses)
    .values({
      title,
      description,
      coverUrl,
      isPublished,
      createdBy: user.id,
    })
    .returning({ id: courses.id });

  redirect(`/admin/courses/${newCourse.id}`);
}
