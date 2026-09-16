import { z } from "zod";
import { EVENT_STATUSES } from "./types";

export const eventFormSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "请填写事件名称。").max(120, "事件名称不能超过 120 个字符。"),
  description: z.string().trim().max(1000, "描述不能超过 1000 个字符。").optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "请选择有效的开始日期。"),
  status: z.enum(EVENT_STATUSES),
  icon: z.string().trim().max(16, "图标最多可包含 16 个字符。").optional(),
  collection: z.string().trim().max(30, "分类名称不能超过 30 个字符。").optional(),
  tags: z.string().max(400, "标签内容过长。").optional(),
}).superRefine((value, context) => {
  if (parseTagNames(value.tags).some((name) => name.length > 30)) {
    context.addIssue({ code: "custom", path: ["tags"], message: "每个标签不能超过 30 个字符。" });
  }
});

export type EventActionState = {
  error?: string;
  fieldErrors?: Partial<Record<"title" | "description" | "startDate" | "icon" | "collection" | "tags", string>>;
};

export function parseTagNames(value: string | undefined) {
  if (!value) return [];
  return [...new Set(value.split(/[,，]/).map((name) => name.trim()).filter(Boolean))].slice(0, 12);
}
