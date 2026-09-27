import { redirect } from "next/navigation";

export default function LearnerPage() {
  // Redirect to the main tutoring page since there's no specific learner page
  redirect("/tutoring");
}
