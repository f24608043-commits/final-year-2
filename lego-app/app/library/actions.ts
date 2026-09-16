"use server";

import { db } from "@/db";
import { libraryViews, enrollments, lessons, courses, units } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function getLibraryLessons() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return [];
  }

  // Get all courses the user is enrolled in
  const userEnrollments = await db
    .select({ courseId: enrollments.courseId })
    .from(enrollments)
    .where(eq(enrollments.userId, user.id));

  const courseIds = userEnrollments.map((e) => e.courseId);

  if (courseIds.length === 0) {
    return [];
  }

  // Get all units in enrolled courses
  const courseUnits = await db
    .select({ id: units.id, courseId: units.courseId })
    .from(units)
    .where(inArray(units.courseId, courseIds));

  const unitIds = courseUnits.map((u) => u.id);

  // Get all lessons in enrolled courses (ungated access)
  const libraryLessons = await db
    .select({
      id: lessons.id,
      title: lessons.title,
      description: lessons.description,
      videoUrl: lessons.videoUrl,
      xpReward: lessons.xpReward,
      unitId: lessons.unitId,
      courseId: units.courseId,
      courseName: courses.name,
      unitName: units.name,
    })
    .from(lessons)
    .innerJoin(units, eq(lessons.unitId, units.id))
    .innerJoin(courses, eq(units.courseId, courses.id))
    .where(inArray(lessons.unitId, unitIds))
    .orderBy(lessons.order);

  return libraryLessons;
}

export async function recordLibraryView(lessonId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error("You must be logged in");
  }

  // Record library view (NEVER affects user_progress)
  await db.insert(libraryViews).values({
    userId: user.id,
    lessonId,
  });

  revalidatePath("/library");
  return { success: true };
}
