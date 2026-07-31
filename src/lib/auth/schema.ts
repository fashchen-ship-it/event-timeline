import { z } from "zod";

export const authSchema = z.object({
  email: z.string().trim().email("请输入有效的邮箱地址。"),
  password: z.string().min(8, "密码至少需要 8 个字符。").max(72, "密码不能超过 72 个字符。"),
});

export type AuthActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Partial<Record<"email" | "password", string>>;
};
