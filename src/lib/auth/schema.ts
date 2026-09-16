import { z } from "zod";

export const authSchema = z.object({
  email: z.string().trim().email("请输入有效的邮箱地址。"),
  password: z.string().min(8, "密码至少需要 8 个字符。").max(72, "密码不能超过 72 个字符。"),
});

export const passwordResetEmailSchema = z.object({
  email: z.string().trim().email("请输入有效的邮箱地址。"),
});

export const passwordUpdateSchema = z.object({
  password: z.string().min(8, "密码至少需要 8 个字符。").max(72, "密码不能超过 72 个字符。"),
  passwordConfirmation: z.string(),
}).refine((value) => value.password === value.passwordConfirmation, {
  message: "两次输入的密码不一致。",
  path: ["passwordConfirmation"],
});

export type AuthActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
};

export type PasswordResetActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"email" | "password" | "passwordConfirmation", string>>;
};
