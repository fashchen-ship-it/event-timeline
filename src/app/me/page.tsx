import { redirect } from "next/navigation";
import Link from "next/link";
import { BottomNav } from "@/components/layout/bottom-nav";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { PageShell, PixelIcon } from "@/components/ui/pixel";
import { PwaInstallButton } from "@/components/pwa-install-button";
import { CollectionManager } from "@/components/events/collection-manager";
import { getEventCollections } from "@/lib/events/queries";

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
      <section className="pixel-card mt-5 p-5"><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--sage)]" name="file" /><h2 className="pixel-title text-lg">我的备份</h2></div><p className="mt-3 text-sm leading-7 text-[var(--soil)]">下载一份当前账号的数据记录，便于自己留存。事件、节点、标签、分类、关联、清单和附件记录都会包含在内；附件文件本身需另行保存。</p><a className="pixel-button pixel-button-secondary mt-4 min-h-11 px-4 text-sm" href="/backup"><PixelIcon className="size-4" name="file" />下载 JSON 备份</a></section>
      <section className="pixel-card mt-5 p-5"><div className="flex items-center gap-2"><PixelIcon className="size-5 text-[var(--wheat)]" name="calendar" /><h2 className="pixel-title text-lg">记录统计</h2></div><p className="mt-3 text-sm leading-7 text-[var(--soil)]">按月份看看自己留下的事件与重要时刻，不做打卡，也不评判生活。</p><div className="mt-4 flex flex-wrap gap-2"><Link className="pixel-button pixel-button-secondary min-h-11 px-4 text-sm" href="/insights"><PixelIcon className="size-4" name="calendar" />查看记录统计</Link><Link className="pixel-button pixel-button-secondary min-h-11 px-4 text-sm" href="/calendar"><PixelIcon className="size-4" name="calendar" />打开事线月历</Link></div></section>
      <section className="pixel-card mt-5 p-5"><h2 className="pixel-title text-lg">分类管理</h2><CollectionManager collections={collections} /></section>
      <section className="pixel-card mt-5 p-5"><h2 className="pixel-title text-lg">数据说明</h2><p className="mt-3 text-sm leading-7 text-[var(--soil)]">你的事件、节点、标签和附件仅对当前账号可见。数据通过 Supabase 的行级安全策略隔离，并同步到你登录的设备。</p></section>
      <section className="pixel-card mt-5 p-5"><h2 className="pixel-title text-lg">关于事线</h2><p className="mt-3 text-sm leading-7 text-[var(--soil)]">事线只记录一件事情已经发生的重要节点，不承担待办、日历或项目管理功能。</p></section>
      <form action={signOut} className="mt-8"><button className="pixel-button pixel-button-secondary text-base" type="submit">退出登录</button></form>
      <BottomNav />
    </PageShell>
  );
}
