"use server";

import { db } from "@/db";
import { tutorEnrollments, profiles, tutorEnrollmentStatusEnum } from "@/db/schema";
import { eq, and, desc, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createNotification } from "@/app/notifications/actions";

// Request enrollment with a tutor
export async function requestTutorEnrollment(tutorId: string, message?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in to request enrollment");
  }

  const learnerId = user.id;

  // Prevent self-enrollment
  if (learnerId === tutorId) {
    throw new Error("You cannot enroll with yourself");
  }

  // Check if enrollment already exists
  const existing = await db
    .select()
    .from(tutorEnrollments)
    .where(
      and(
        eq(tutorEnrollments.tutorId, tutorId),
        eq(tutorEnrollments.learnerId, learnerId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    const enrollment = existing[0];
    if (enrollment.status === "accepted") {
      throw new Error("You are already enrolled with this tutor");
    }
    if (enrollment.status === "pending") {
      throw new Error("An enrollment request already exists");
    }
    if (enrollment.status === "rejected") {
      // Allow re-requesting after rejection - update existing record
      await db
        .update(tutorEnrollments)
        .set({ 
          status: "pending", 
          message: message || null,
          updatedAt: new Date() 
        })
        .where(eq(tutorEnrollments.id, enrollment.id));
      
      await createNotification({
        userId: tutorId,
        type: "friend_request", // Reusing existing type
        title: "New Enrollment Request",
        message: "A learner has requested to enroll with you",
        data: { enrollmentId: enrollment.id },
      });

      revalidatePath("/tutoring");
      return { success: true, enrollmentId: enrollment.id };
    }
  }

  // Create new enrollment request
  const [enrollment] = await db
    .insert(tutorEnrollments)
    .values({
      tutorId,
      learnerId,
      status: "pending",
      message: message || null,
    })
    .returning();

  // Notify tutor
  await createNotification({
    userId: tutorId,
    type: "friend_request", // Reusing existing type
    title: "New Enrollment Request",
    message: "A learner has requested to enroll with you",
    data: { enrollmentId: enrollment.id },
  });

  revalidatePath("/tutoring");
  return { success: true, enrollmentId: enrollment.id };
}

// Accept enrollment request (tutor only)
export async function acceptTutorEnrollment(enrollmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  try {
    // Get the enrollment
    const [enrollment] = await db
      .select()
      .from(tutorEnrollments)
      .where(eq(tutorEnrollments.id, enrollmentId))
      .limit(1);

    if (!enrollment) {
      throw new Error("Enrollment request not found");
    }

    // Verify user is the tutor
    if (enrollment.tutorId !== user.id) {
      throw new Error("You can only accept enrollment requests sent to you");
    }

    if (enrollment.status !== "pending") {
      throw new Error("This request is no longer pending");
    }

    // Update enrollment status
    await db
      .update(tutorEnrollments)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(tutorEnrollments.id, enrollmentId));

    // Notify learner
    await createNotification({
      userId: enrollment.learnerId,
      type: "friend_accepted", // Reusing existing type
      title: "Enrollment Request Accepted",
      message: "A tutor has accepted your enrollment request",
      data: { enrollmentId: enrollment.id },
    });

    revalidatePath("/tutoring");
    revalidatePath("/tutoring/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error accepting enrollment:", error);
    throw new Error("Failed to accept enrollment request");
  }
}

// Reject enrollment request (tutor only)
export async function rejectTutorEnrollment(enrollmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  try {
    // Get the enrollment
    const [enrollment] = await db
      .select()
      .from(tutorEnrollments)
      .where(eq(tutorEnrollments.id, enrollmentId))
      .limit(1);

    if (!enrollment) {
      throw new Error("Enrollment request not found");
    }

    // Verify user is the tutor
    if (enrollment.tutorId !== user.id) {
      throw new Error("You can only reject enrollment requests sent to you");
    }

    if (enrollment.status !== "pending") {
      throw new Error("This request is no longer pending");
    }

    // Update enrollment status
    await db
      .update(tutorEnrollments)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(tutorEnrollments.id, enrollmentId));

    // Notify learner
    await createNotification({
      userId: enrollment.learnerId,
      type: "friend_request", // Reusing existing type
      title: "Enrollment Request Rejected",
      message: "A tutor has declined your enrollment request",
      data: { enrollmentId: enrollment.id },
    });

    revalidatePath("/tutoring");
    revalidatePath("/tutoring/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting enrollment:", error);
    throw new Error("Failed to reject enrollment request");
  }
}

// Remove learner (tutor only)
export async function removeLearner(enrollmentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  try {
    // Get the enrollment
    const [enrollment] = await db
      .select()
      .from(tutorEnrollments)
      .where(eq(tutorEnrollments.id, enrollmentId))
      .limit(1);

    if (!enrollment) {
      throw new Error("Enrollment not found");
    }

    // Verify user is the tutor
    if (enrollment.tutorId !== user.id) {
      throw new Error("You can only remove learners from your roster");
    }

    // Update enrollment status
    await db
      .update(tutorEnrollments)
      .set({ status: "removed", updatedAt: new Date() })
      .where(eq(tutorEnrollments.id, enrollmentId));

    revalidatePath("/tutoring");
    revalidatePath("/tutoring/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error removing learner:", error);
    throw new Error("Failed to remove learner");
  }
}

// Get pending enrollment requests for a tutor
export async function getPendingEnrollments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  const requests = await db
    .select({
      id: tutorEnrollments.id,
      message: tutorEnrollments.message,
      status: tutorEnrollments.status,
      createdAt: tutorEnrollments.createdAt,
      learner: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(tutorEnrollments)
    .innerJoin(profiles, eq(tutorEnrollments.learnerId, profiles.id))
    .where(and(eq(tutorEnrollments.tutorId, user.id), eq(tutorEnrollments.status, "pending")))
    .orderBy(desc(tutorEnrollments.createdAt))
    .limit(50);

  return requests;
}

// Get accepted learners (student roster) for a tutor
export async function getAcceptedLearners() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  const learners = await db
    .select({
      id: tutorEnrollments.id,
      enrollmentId: tutorEnrollments.id,
      learnerId: tutorEnrollments.learnerId,
      status: tutorEnrollments.status,
      createdAt: tutorEnrollments.createdAt,
      learner: {
        id: profiles.id,
        displayName: profiles.displayName,
        avatarUrl: profiles.avatarUrl,
      },
    })
    .from(tutorEnrollments)
    .innerJoin(profiles, eq(tutorEnrollments.learnerId, profiles.id))
    .where(and(eq(tutorEnrollments.tutorId, user.id), eq(tutorEnrollments.status, "accepted")))
    .orderBy(desc(tutorEnrollments.createdAt));

  return learners;
}

// Get learner's enrollment status with a tutor
export async function getEnrollmentStatus(tutorId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user?.id) {
    throw new Error("You must be logged in");
  }

  const [enrollment] = await db
    .select()
    .from(tutorEnrollments)
    .where(
      and(
        eq(tutorEnrollments.tutorId, tutorId),
        eq(tutorEnrollments.learnerId, user.id)
      )
    )
    .limit(1);

  return enrollment || null;
}
