"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, updatePassword } from "@/lib/auth/actions";
import type { PasswordResetActionState } from "@/lib/auth/schema";

type PasswordResetFormProps = { mode: "request" | "update" };
const initialState: PasswordResetActionState = {};

export function PasswordResetForm({ mode }: PasswordResetFormProps) {
  const isRequest = mode === "request";
  const [state, formAction, isPending] = useActionState(isRequest ? requestPasswordReset : updatePassword, initialState);

  return (
    <form action={formAction} className="auth-pixel mt-8 space-y-5" noValidate>
      {isRequest ? (
        <div>
          <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="email">注册邮箱</label>
          <input autoComplete="email" className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none" id="email" name="email" placeholder="name@example.com" type="email" required />
          {state.fieldErrors?.email && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.email}</p>}
        </div>
      ) : (
        <>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="password">新密码</label>
            <input autoComplete="new-password" className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none" id="password" minLength={8} name="password" placeholder="至少 8 个字符" type="password" required />
            {state.fieldErrors?.password && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.password}</p>}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="passwordConfirmation">确认新密码</label>
            <input autoComplete="new-password" className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none" id="passwordConfirmation" minLength={8} name="passwordConfirmation" placeholder="再输入一次新密码" type="password" required />
            {state.fieldErrors?.passwordConfirmation && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.passwordConfirmation}</p>}
          </div>
        </>
      )}
      {state.error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800">{state.error}</p>}
      {state.success && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-800">{state.success}</p>}
      <button className="h-12 w-full rounded-xl bg-stone-800 px-4 text-base font-medium text-white transition disabled:cursor-not-allowed disabled:bg-stone-400" disabled={isPending} type="submit">{isPending ? "请稍候…" : isRequest ? "发送重置链接" : "保存新密码"}</button>
      {isRequest && <p className="text-center text-sm text-[var(--soil)]">想起密码了？ <Link className="font-bold text-[var(--forest)] underline underline-offset-4" href="/login">返回登录</Link></p>}
    </form>
  );
}
