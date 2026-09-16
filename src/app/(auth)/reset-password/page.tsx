import { redirect } from "next/navigation";
import { PasswordResetForm } from "@/components/auth/password-reset-form";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/forgot-password");

  return (
    <main className="auth-page min-h-dvh px-4 py-10 sm:py-16">
      <section className="auth-card mx-auto w-full max-w-md px-6 py-8 sm:px-9 sm:py-10">
        <p className="auth-kicker">EVENT TIMELINE</p>
        <h1 className="auth-title mt-4">设置新密码</h1>
        <p className="mt-3 leading-7 text-[var(--soil)]">请设置一个至少 8 个字符的新密码。保存后会回到我的事线。</p>
        <PasswordResetForm mode="update" />
      </section>
    </main>
  );
}
