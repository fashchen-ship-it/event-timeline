import { PasswordResetForm } from "@/components/auth/password-reset-form";

export default function ForgotPasswordPage() {
  return (
    <main className="auth-page min-h-dvh px-4 py-10 sm:py-16">
      <section className="auth-card mx-auto w-full max-w-md px-6 py-8 sm:px-9 sm:py-10">
        <p className="auth-kicker">EVENT TIMELINE</p>
        <h1 className="auth-title mt-4">找回密码</h1>
        <p className="mt-3 leading-7 text-[var(--soil)]">输入注册邮箱，我们会发送一封用于设置新密码的邮件。</p>
        <PasswordResetForm mode="request" />
      </section>
    </main>
  );
}
