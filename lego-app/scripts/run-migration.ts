import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import postgres from "postgres";
import { readFileSync } from "fs";
import { join } from "path";

const sql = postgres(process.env.DATABASE_URL!, { ssl: { rejectUnauthorized: false } });

async function runMigration() {
  console.log("=== Running tutor_enrollments migration ===\n");

  try {
    // Read and execute the migration
    const migrationPath = join(__dirname, "../drizzle/0004_tutor_enrollments.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    console.log("Executing schema migration...");
    await sql.unsafe(migrationSQL);
    console.log("✓ Schema migration completed\n");

    // Read and execute RLS policies
    const rlsPath = join(__dirname, "../drizzle/0005_tutor_enrollments_rls.sql");
    const rlsSQL = readFileSync(rlsPath, "utf-8");

    console.log("Executing RLS policies...");
    await sql.unsafe(rlsSQL);
    console.log("✓ RLS policies completed\n");

    console.log("=== Migration completed successfully ===");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

runMigration().catch((e) => {
  console.error("Script failed:", e);
  process.exit(1);
});
