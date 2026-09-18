import { redirect } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { createClient } from "@/lib/supabase/server";
import { PageShell, PixelIcon } from "@/components/ui/pixel";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { AttachmentBackupButton } from "@/components/backup/attachment-backup-button";
import { FullBackupButton } from "@/components/backup/full-backup-button";
import { CollectionManager } from "@/components/events/collection-manager";
import { getEventCollections } from "@/lib/events/queries";
import { SignOutButton } from "@/components/auth/sign-out-button";

export const dynamic = "force-dynamic";
export default async function MePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const collections = await getEventCollections();
  return (
    <PageShell>
      <header className="pixel-paper p-5 sm:p-6"><p className="pixel-eyebrow">MY LITTLE CABIN</p><h1 className="pixel-title mt-2 text-3xl">我的</h1><p className="mt-2 text-sm text-[var(--soil)]">只属于你的生活记录册。</p></header>
      <section className="pixel-card mt-7 p-5"><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="user" /><p className="pixel-eyebrow">CURRENT ACCOUNT</p></div><p className="mt-3 break-all text-base font-bold text-[var(--ink)]">{user.email}</p></section>
      <section className="pixel-card mt-5 p-5"><h2 className="pixel-title text-lg">安装到桌面</h2><p className="mt-3 text-sm leading-7 text-[var(--soil)]">安装后可从手机桌面直接打开事线，并获得更接近原生应用的全屏体验。</p><PwaInstallButton /></section>
      <section className="pixel-card mt-5 p-5"><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sky)]" name="hourglass" /><h2 className="pixel-title text-lg">阅读模式</h2></div><p className="mt-3 text-sm leading-7 text-[var(--soil)]">晚上翻看记录时可以切换夜间模式。设置只保存在当前设备，不会影响你朋友的界面。</p><ThemeToggle /></section>
      <section className="pixel-card mt-5 p-5"><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="file" /><h2 className="pixel-title text-lg">我的备份</h2></div><p className="mt-3 text-sm leading-7 text-[var(--soil)]">优先下载完整恢复 ZIP：文字、分类、标签、关联、清单和附件原件会一起保存，导入时可自动恢复。附件较多时会自动拆成多个 ZIP；恢复时一次选择同一批全部分包。</p><div className="mt-4 flex flex-wrap gap-2"><FullBackupButton /><a className="pixel-button pixel-button-secondary min-h-11 px-4 text-sm" href="/backup"><PixelIcon className="size-4" name="file" />下载 JSON 备份</a><AttachmentBackupButton /><Link className="pixel-button pixel-button-secondary min-h-11 px-4 text-sm" href="/backup/import"><PixelIcon className="size-4" name="archive" />导入备份</Link><Link className="pixel-button pixel-button-secondary min-h-11 px-4 text-sm" href="/storage"><PixelIcon className="size-4" name="archive" />查看附件空间</Link></div><p className="mt-3 text-xs leading-5 text-[var(--soil)]">普通 JSON 不包含附件原件；分开的附件 ZIP 也只能保存原件、不能自动重新关联。</p></section>
      <section className="pixel-card mt-5 p-5"><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--wheat)]" name="calendar" /><h2 className="pixel-title text-lg">记录统计</h2></div><p className="mt-3 text-sm leading-7 text-[var(--soil)]">按月份看看自己留下的事件与重要时刻，不做打卡，也不评判生活。</p><div className="mt-4 flex flex-wrap gap-2"><Link className="pixel-button pixel-button-secondary min-h-11 px-4 text-sm" href="/insights"><PixelIcon className="size-4" name="calendar" />查看记录统计</Link><Link className="pixel-button pixel-button-secondary min-h-11 px-4 text-sm" href="/calendar"><PixelIcon className="size-4" name="calendar" />打开事线月历</Link></div></section>
      <section className="pixel-card mt-5 p-5"><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="briefcase" /><h2 className="pixel-title text-lg">整理事线</h2></div><p className="mt-3 text-sm leading-7 text-[var(--soil)]">按项目分组查看正在记录的主题，也可以回到归档找已经告一段落的事。</p><div className="mt-4 flex flex-wrap gap-2"><Link className="pixel-button pixel-button-secondary min-h-11 px-4 text-sm" href="/projects"><PixelIcon className="size-4" name="briefcase" />项目分组</Link><Link className="pixel-button pixel-button-secondary min-h-11 px-4 text-sm" href="/archive"><PixelIcon className="size-4" name="archive" />查看归档</Link></div></section>
      <section className="pixel-card mt-5 p-5" id="collection-management"><h2 className="pixel-title text-lg">分类管理</h2><p className="mt-2 text-sm leading-6 text-[var(--soil)]">删除分类不会删除事线；相关事线会变为未分类，之后可随时重新归类。</p><CollectionManager collections={collections} /></section>
      <section className="pixel-card mt-5 p-5"><h2 className="pixel-title text-lg">数据说明</h2><p className="mt-3 text-sm leading-7 text-[var(--soil)]">你的事件、节点、标签和附件仅对当前账号可见。数据通过 Supabase 的行级安全策略隔离，并同步到你登录的设备。</p></section>
      <section className="pixel-card mt-5 p-5"><h2 className="pixel-title text-lg">关于事线</h2><p className="mt-3 text-sm leading-7 text-[var(--soil)]">事线只记录一件事情已经发生的重要节点，不承担待办、日历或项目管理功能。</p></section>
      <div className="mt-8"><SignOutButton /></div>
      <BottomNav />
    </PageShell>
  );
}
