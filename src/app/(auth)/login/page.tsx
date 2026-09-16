import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { PixelIcon } from "@/components/ui/pixel";

export default function LoginPage() {
  return <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6"><section className="pixel-paper w-full max-w-md p-5 sm:p-8"><div className="flex size-12 items-center justify-center rounded-md border-2 border-[var(--soil)] bg-[var(--paper-deep)] text-[var(--forest)] shadow-[2px_2px_0_var(--line)]"><PixelIcon className="size-6" name="journal" /></div><p className="pixel-eyebrow mt-5">EVENT LOGBOOK</p><h1 className="pixel-title mt-2 text-3xl">欢迎回来</h1><p className="mt-3 text-base leading-7 text-[var(--soil)]">登录后继续记录事情留下的每个节点。</p><AuthForm mode="login" /><p className="mt-6 text-center text-sm text-[var(--soil)]">还没有账号？ <Link className="font-bold text-[var(--forest)] underline underline-offset-4" href="/register">去注册</Link></p></section></main>;
}
