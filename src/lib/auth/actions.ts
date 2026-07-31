"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authSchema, type AuthActionState } from "./schema";

function validateCredentials(formData: FormData):
  | { data: { email: string; password: string } }
  | { error: AuthActionState } {
  const result = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (result.success) {
    return { data: result.data };
  }

  const fieldErrors = result.error.flatten().fieldErrors;
  return {
    error: {
      error: "请检查填写内容。",
      fieldErrors: {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
    },
  };
}

export async function signIn(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = validateCredentials(formData);
  if ("error" in credentials) return credentials.error;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials.data);

  if (error) {
    return { error: "邮箱或密码不正确，请重试。" };
  }

  redirect("/events");
}

export async function signUp(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const credentials = validateCredentials(formData);
  if ("error" in credentials) return credentials.error;

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const emailRedirectTo = origin
    ? new URL("/auth/callback?next=/events", origin).toString()
    : undefined;

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    ...credentials.data,
    options: { emailRedirectTo },
  });

  if (error) {
    console.error("Supabase sign-up failed", { code: error.code, message: error.message, status: error.status });

    if (error.message.toLowerCase().includes("rate limit")) {
      return { error: "验证邮件发送过于频繁，请稍等一小时后再试。" };
    }
    if (error.message.toLowerCase().includes("signup")) {
      return { error: "当前 Supabase 项目未允许邮箱注册，请检查 Authentication 的 Email 设置。" };
    }
    if (error.message.toLowerCase().includes("email")) {
      return { error: "无法发送验证邮件，请检查 Supabase 的 Email 设置后重试。" };
    }

    return { error: "注册暂时无法完成，请稍后重试。" };
  }

  return { success: "验证邮件已发送，请打开邮箱完成确认后再登录。" };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
