import { createClient } from "@/utils/supabase/server";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { eq } from "drizzle-orm";
import AppShell from "./AppShell";

export default async function Shell({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userData = undefined;
  if (user) {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    
    if (profile) {
      userData = {
        id: profile.id,
        displayName: profile.displayName,
        email: user.email || "",
        role: profile.role,
        xp: profile.xp,
        streakCount: profile.streakCount,
      };
    }
  }

  return <AppShell user={userData}>{children}</AppShell>;
}
