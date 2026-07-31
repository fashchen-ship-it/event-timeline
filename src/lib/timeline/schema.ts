import { z } from "zod";

export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

export const MAX_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_ATTACHMENTS = 6;

export const uploadSchema = z.object({
  fileName: z.string().min(1).max(255),
  filePath: z.string().min(1).max(1024),
  fileType: z.enum(ALLOWED_FILE_TYPES),
  fileSize: z.number().int().positive().max(MAX_FILE_SIZE),
});

export const nodeFormSchema = z.object({
  id: z.string().uuid().optional(),
  eventId: z.string().uuid(),
  title: z.string().trim().min(1, "请填写节点标题。").max(160, "节点标题不能超过 160 个字符。"),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "请选择有效的发生日期。"),
  eventTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "请选择有效的发生时间。").optional(),
  content: z.string().trim().max(10000, "详细内容不能超过 10000 个字符。").optional(),
  linkUrl: z.string().trim().url("请输入有效的网址。").max(2048, "网页链接过长。").optional(),
  tags: z.string().max(400, "标签内容过长。").optional(),
  isImportant: z.boolean(),
  uploads: z.array(uploadSchema).max(MAX_ATTACHMENTS, `最多上传 ${MAX_ATTACHMENTS} 个附件。`),
}).superRefine((value, context) => {
  if (parseTagNames(value.tags).some((name) => name.length > 30)) {
    context.addIssue({ code: "custom", path: ["tags"], message: "每个标签不能超过 30 个字符。" });
  }
});

export type NodeActionState = {
  error?: string;
  fieldErrors?: Partial<Record<"title" | "eventDate" | "eventTime" | "content" | "linkUrl" | "tags", string>>;
};

export function parseTagNames(value: string | undefined) {
  if (!value) return [];
  return [...new Set(value.split(/[，,]/).map((name) => name.trim()).filter(Boolean))].slice(0, 12);
}
