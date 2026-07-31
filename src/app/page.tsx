import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// The redirect depends on the current user's request-scoped session.
export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/events" : "/login");
}
