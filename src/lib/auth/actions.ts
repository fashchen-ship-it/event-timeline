"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authSchema, passwordResetEmailSchema, passwordUpdateSchema, type AuthActionState, type PasswordResetActionState } from "./schema";

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

export async function requestPasswordReset(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const parsed = passwordResetEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: { email: parsed.error.flatten().fieldErrors.email?.[0] } };

  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (!origin) return { error: "无法确定重置链接地址，请稍后重试。" };

  let redirectTo: string;
  try {
    redirectTo = new URL("/auth/callback?next=/reset-password", origin).toString();
  } catch {
    return { error: "无法确定重置链接地址，请稍后重试。" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo,
  });
  if (error) {
    console.error("Supabase password reset failed", { code: error.code, message: error.message, status: error.status });
    if (error.message.toLowerCase().includes("rate limit")) return { error: "邮件发送过于频繁，请稍等一小时后再试。" };
    return { error: "重置邮件暂时无法发送，请稍后重试。" };
  }

  return { success: "如果该邮箱已注册，重置密码链接已发送。请打开邮箱继续操作。" };
}

export async function updatePassword(
  _previousState: PasswordResetActionState,
  formData: FormData,
): Promise<PasswordResetActionState> {
  const parsed = passwordUpdateSchema.safeParse({
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors;
    return { fieldErrors: { password: fields.password?.[0], passwordConfirmation: fields.passwordConfirmation?.[0] } };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "重置链接已过期或无效，请重新申请。" };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "无法更新密码，请重新申请重置链接后再试。" };
  redirect("/events");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
