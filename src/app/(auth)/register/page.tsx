import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { PixelIcon } from "@/components/ui/pixel";

export default function RegisterPage() {
  return <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6"><section className="pixel-paper w-full max-w-md p-5 sm:p-8"><div className="flex size-12 items-center justify-center rounded-md border-2 border-[var(--soil)] bg-[var(--paper-deep)] text-[var(--sage)] shadow-[2px_2px_0_var(--line)]"><PixelIcon className="size-6" name="sprout" /></div><p className="pixel-eyebrow mt-5">EVENT LOGBOOK</p><h1 className="pixel-title mt-2 text-3xl">创建账号</h1><p className="mt-3 text-base leading-7 text-[var(--soil)]">从第一件值得记录的事开始。</p><AuthForm mode="register" /><p className="mt-6 text-center text-sm text-[var(--soil)]">已有账号？ <Link className="font-bold text-[var(--forest)] underline underline-offset-4" href="/login">去登录</Link></p></section></main>;
}
