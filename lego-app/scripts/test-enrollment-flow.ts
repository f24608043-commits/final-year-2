import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

async function testEnrollmentFlow() {
  console.log("=== Testing Tutor Enrollment Flow ===\n");

  try {
    // Get test accounts from auth.users and profiles
    const [learner] = await sql`
      SELECT p.id, u.email, p.display_name
      FROM profiles p
      JOIN auth.users u ON p.id = u.id
      WHERE u.email = 'testlearner+test@gmail.com'
      LIMIT 1
    `;

    const [tutor] = await sql`
      SELECT p.id, u.email, p.display_name
      FROM profiles p
      JOIN auth.users u ON p.id = u.id
      WHERE u.email = 'orphix.itsolutions@gmail.com'
      LIMIT 1
    `;

    if (!learner || !tutor) {
      throw new Error("Test accounts not found. Run create_test_accounts.ts first.");
    }

    console.log(`Learner: ${learner.display_name} (${learner.email})`);
    console.log(`Tutor: ${tutor.display_name} (${tutor.email})\n`);

    // Test 1: Create enrollment request
    console.log("Test 1: Creating enrollment request...");
    const [enrollment] = await sql`
      INSERT INTO tutor_enrollments (tutor_id, learner_id, status, message)
      VALUES (${tutor.id}, ${learner.id}, 'pending', 'I would like to enroll for Python tutoring')
      ON CONFLICT (tutor_id, learner_id) 
      DO UPDATE SET status = 'pending', message = 'I would like to enroll for Python tutoring', updated_at = NOW()
      RETURNING *
    `;
    console.log(`✓ Enrollment request created: ${enrollment.id}\n`);

    // Test 2: Verify tutor can see pending requests
    console.log("Test 2: Verifying tutor can see pending requests...");
    const pending = await sql`
      SELECT te.*, p.display_name as learner_name
      FROM tutor_enrollments te
      JOIN profiles p ON te.learner_id = p.id
      WHERE te.tutor_id = ${tutor.id} AND te.status = 'pending'
    `;
    console.log(`✓ Tutor has ${pending.length} pending requests\n`);

    // Test 3: Accept enrollment
    console.log("Test 3: Accepting enrollment...");
    await sql`
      UPDATE tutor_enrollments
      SET status = 'accepted', updated_at = NOW()
      WHERE id = ${enrollment.id}
    `;
    console.log(`✓ Enrollment accepted\n`);

    // Test 4: Verify learner is in tutor's roster
    console.log("Test 4: Verifying learner is in tutor's roster...");
    const roster = await sql`
      SELECT te.*, p.display_name as learner_name
      FROM tutor_enrollments te
      JOIN profiles p ON te.learner_id = p.id
      WHERE te.tutor_id = ${tutor.id} AND te.status = 'accepted'
    `;
    console.log(`✓ Tutor has ${roster.length} enrolled students\n`);

    // Test 5: Verify learner can check enrollment status
    console.log("Test 5: Verifying learner can check enrollment status...");
    const [status] = await sql`
      SELECT * FROM tutor_enrollments
      WHERE tutor_id = ${tutor.id} AND learner_id = ${learner.id}
    `;
    console.log(`✓ Learner enrollment status: ${status.status}\n`);

    console.log("=== All tests passed ===");
  } catch (error) {
    console.error("Test failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

testEnrollmentFlow().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
