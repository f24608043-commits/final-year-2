import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

function getClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  return postgres(connectionString, { prepare: false, ssl: { rejectUnauthorized: false } });
}

export const db = drizzle(getClient(), { schema });
