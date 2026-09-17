import { redirect } from "next/navigation";
import Link from "next/link";
import { BackupImportForm } from "@/components/backup/backup-import-form";
import { PageShell, PixelIcon } from "@/components/ui/pixel";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BackupImportPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <PageShell>
      <Link className="pixel-link text-sm" href="/me">← 返回我的</Link>
      <header className="pixel-paper mt-5 p-5 sm:p-6">
        <div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="file" /><p className="pixel-eyebrow">SAFE RESTORE</p></div>
        <h1 className="pixel-title mt-2 text-3xl">导入备份</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--soil)]">把从事线下载的 JSON 备份恢复成新的记录副本。不会清空、修改或覆盖你现在已有的事件。</p>
      </header>
      <section className="pixel-card mt-5 p-5 sm:p-6">
        <h2 className="pixel-title text-lg">导入规则</h2>
        <ul className="mt-3 space-y-2 text-sm leading-7 text-[var(--soil)]">
          <li>· 同名分类和标签会沿用现有内容；其余数据会创建为新副本。</li>
          <li>· 事件、节点、清单与事件关联会一并恢复；原有置顶和最近浏览不会带回。</li>
          <li>· 备份只含附件记录，不含附件文件本身，因此图片、文件不会自动恢复。</li>
        </ul>
      </section>
      <BackupImportForm />
    </PageShell>
  );
}
