import { createZip } from "@/lib/backup/zip";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ARCHIVE_BYTES = 35 * 1024 * 1024;
const textEncoder = new TextEncoder();

function archiveFileName() {
  return `event-timeline-attachments-${new Date().toISOString().slice(0, 10)}.zip`;
}

function safeFileName(value: string) {
  const clean = value.replace(/[\\/:*?"<>|\x00-\x1f]/g, "_").replace(/^\.+/, "_").trim();
  return (clean || "attachment").slice(0, 180);
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("请先登录后再导出附件。", { status: 401 });

  const { data: attachments, error } = await supabase
    .from("attachments")
    .select("id, node_id, file_name, storage_path, file_size, created_at")
    .order("created_at");
  if (error) return new Response("读取附件记录失败，请稍后重试。", { status: 500 });
  if (!attachments?.length) return new Response("还没有可下载的附件原件。", { status: 404 });

  const recordedBytes = attachments.reduce((total, attachment) => total + Number(attachment.file_size || 0), 0);
  if (recordedBytes > MAX_ARCHIVE_BYTES) {
    return new Response("附件原件合计超过 35MB，暂不能打包下载。请分批删除不需要的附件后重试，或逐个在节点中保存。", { status: 413 });
  }

  const entries: { name: string; data: Uint8Array; modifiedAt?: Date }[] = [];
  const missing: { file_name: string; storage_path: string }[] = [];
  let downloadedBytes = 0;
  for (const [index, attachment] of attachments.entries()) {
    const { data, error: downloadError } = await supabase.storage.from("timeline-files").download(attachment.storage_path);
    if (downloadError || !data) {
      missing.push({ file_name: attachment.file_name, storage_path: attachment.storage_path });
      continue;
    }
    const bytes = new Uint8Array(await data.arrayBuffer());
    downloadedBytes += bytes.length;
    if (downloadedBytes > MAX_ARCHIVE_BYTES) {
      return new Response("附件原件合计超过 35MB，暂不能打包下载。请分批删除不需要的附件后重试，或逐个在节点中保存。", { status: 413 });
    }
    entries.push({ name: `attachments/${String(index + 1).padStart(3, "0")}-${safeFileName(attachment.file_name)}`, data: bytes, modifiedAt: attachment.created_at ? new Date(attachment.created_at) : undefined });
  }

  const manifest = {
    format: "event-timeline-attachment-archive",
    version: 1,
    exported_at: new Date().toISOString(),
    note: "请与 JSON 备份一起保存。该 ZIP 保存附件原件，当前导入功能不会自动把 ZIP 重新关联到新副本。",
    downloaded: attachments.filter((attachment) => !missing.some((item) => item.storage_path === attachment.storage_path)).map((attachment) => ({ id: attachment.id, node_id: attachment.node_id, file_name: attachment.file_name, storage_path: attachment.storage_path })),
    missing,
  };
  entries.unshift({ name: "README.txt", data: textEncoder.encode("事线附件原件备份\n\n请与同一天下载的 JSON 备份放在一起保存。\nJSON 负责文字和关联，ZIP 保存图片与文件原件。\n"), modifiedAt: new Date() });
  entries.unshift({ name: "manifest.json", data: textEncoder.encode(JSON.stringify(manifest, null, 2)), modifiedAt: new Date() });
  const archive = createZip(entries);

  return new Response(archive, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${archiveFileName()}"`,
      "Cache-Control": "no-store",
    },
  });
}
