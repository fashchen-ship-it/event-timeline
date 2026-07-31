"use client";

import { useActionState } from "react";
import { signIn, signUp } from "@/lib/auth/actions";
import type { AuthActionState } from "@/lib/auth/schema";

type AuthFormProps = {
  mode: "login" | "register";
};

const initialState: AuthActionState = {};

export function AuthForm({ mode }: AuthFormProps) {
  const action = mode === "login" ? signIn : signUp;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="email">
          邮箱
        </label>
        <input
          autoComplete="email"
          className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          id="email"
          name="email"
          placeholder="name@example.com"
          type="email"
          required
        />
        {state.fieldErrors?.email && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.email}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700" htmlFor="password">
          密码
        </label>
        <input
          autoComplete={isLogin ? "current-password" : "new-password"}
          className="h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-base outline-none transition focus:border-stone-500 focus:ring-2 focus:ring-stone-200"
          id="password"
          minLength={8}
          name="password"
          placeholder="至少 8 个字符"
          type="password"
          required
        />
        {state.fieldErrors?.password && <p className="mt-2 text-sm text-rose-700">{state.fieldErrors.password}</p>}
      </div>

      {state.error && <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm leading-6 text-rose-800">{state.error}</p>}
      {state.success && <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm leading-6 text-emerald-800">{state.success}</p>}

      <button
        className="h-12 w-full rounded-xl bg-stone-800 px-4 text-base font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "请稍候…" : isLogin ? "登录" : "注册"}
      </button>
    </form>
  );
}
