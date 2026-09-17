import Link from "next/link";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PageShell, PixelEmptyState, PixelIcon } from "@/components/ui/pixel";
import { getAttachmentStorageOverview } from "@/lib/events/queries";
import { createClient } from "@/lib/supabase/server";
import { AttachmentCleanup } from "@/components/storage/attachment-cleanup";

export const dynamic = "force-dynamic";

const FREE_STORAGE_BYTES = 1024 * 1024 * 1024;

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / 1024 / 1024).toFixed(value >= 100 * 1024 * 1024 ? 0 : 1)} MB`;
}

export default async function StoragePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const overview = await getAttachmentStorageOverview();
  const percentage = Math.min(100, Math.round((overview.totalBytes / FREE_STORAGE_BYTES) * 100));
  const nearLimit = percentage >= 70;

  return <PageShell>
    <header className="pixel-paper flex items-end justify-between gap-4 p-5 sm:p-6"><div><p className="pixel-eyebrow">FILE CUPBOARD</p><h1 className="pixel-title mt-2 text-3xl">附件空间</h1><p className="mt-2 text-sm leading-6 text-[var(--soil)]">查看当前账号上传的附件原件占用；文字记录不计入这里。</p></div><Link className="pixel-button pixel-button-secondary min-h-10 shrink-0 px-3 text-sm" href="/me">返回我的</Link></header>
    <section className="pixel-card mt-6 p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-[var(--soil)]">本账号附件占用</p><p className="pixel-title mt-2 text-3xl">{formatBytes(overview.totalBytes)}</p><p className="mt-1 text-sm text-[var(--soil)]">{overview.fileCount} 个附件 · 项目免费总空间为 1 GB</p></div><PixelIcon className={`size-8 ${nearLimit ? "text-[var(--brick)]" : "text-[var(--sage)]"}`} name="archive" /></div><div aria-label={`本账号附件相当于 1GB 的约 ${percentage}%`} className="mt-5 h-4 overflow-hidden border-2 border-[var(--line)] bg-[var(--paper-deep)]"><div className={nearLimit ? "h-full bg-[var(--brick)]" : "h-full bg-[var(--sage)]"} style={{ width: `${Math.max(percentage, overview.totalBytes ? 1 : 0)}%` }} /></div><p className="mt-3 text-sm leading-6 text-[var(--soil)]">若只有你上传附件，这相当于约 {percentage}%；其中图片约 {formatBytes(overview.imageBytes)}。实际 1 GB 由你和朋友两个账号共享，完整总量请以 Supabase Dashboard 的 Storage 为准。</p></section>
    {overview.largestFiles.length ? <section className="mt-7"><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--wheat)]" name="file" /><h2 className="pixel-title text-xl">占用最大的附件</h2></div><p className="mt-2 text-sm leading-6 text-[var(--soil)]">这里显示占用最大的 20 个附件。可以勾选后批量删除，也可保留并在节点编辑页单独处理。</p><AttachmentCleanup files={overview.largestFiles} /></section> : <div className="mt-8"><PixelEmptyState icon="archive" title="附件柜还是空的。">之后上传的普通照片会自动压缩，帮助节省空间。</PixelEmptyState></div>}
    <section className="pixel-card mt-7 p-5"><h2 className="pixel-title text-lg">空间小建议</h2><ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--soil)]"><li>· 先下载“附件原件 ZIP”，再移除已经不需要在线查看的旧文件。</li><li>· 新上传的普通照片会自动压缩；GIF、PDF 和文档会保留原样。</li><li>· 这里按隐私规则只显示当前账号；你和朋友共同占用同一个 Supabase 项目存储额度。</li></ul></section>
    <BottomNav />
  </PageShell>;
}
