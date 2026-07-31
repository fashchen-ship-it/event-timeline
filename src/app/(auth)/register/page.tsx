import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-[0_12px_40px_rgba(74,61,47,0.08)] sm:p-9">
        <p className="text-sm font-medium tracking-[0.18em] text-stone-500">EVENT TIMELINE</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">创建账号</h1>
        <p className="mt-3 text-base leading-7 text-stone-600">从第一件值得记录的事开始。</p>
        <AuthForm mode="register" />
        <p className="mt-6 text-center text-sm text-stone-600">
          已有账号？{" "}
          <Link className="font-medium text-stone-900 underline underline-offset-4" href="/login">
            去登录
          </Link>
        </p>
      </section>
    </main>
  );
}
