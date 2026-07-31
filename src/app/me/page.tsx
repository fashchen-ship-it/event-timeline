import { redirect } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto min-h-screen w-full max-w-2xl px-5 py-8 pb-28 sm:px-8">
      <p className="text-sm font-medium tracking-[0.18em] text-stone-500">ACCOUNT</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-900">我的</h1>
      <section className="mt-8 rounded-3xl border border-stone-200 bg-white p-6">
        <p className="text-sm text-stone-500">当前登录邮箱</p>
        <p className="mt-2 break-all text-base font-medium text-stone-900">{user.email}</p>
      </section>
      <section className="mt-5 rounded-3xl border border-stone-200 bg-white p-6">
        <h2 className="text-base font-semibold text-stone-900">数据说明</h2>
        <p className="mt-3 text-sm leading-7 text-stone-600">你的事件、节点、标签和附件仅对当前账号可见。数据通过 Supabase 的行级安全策略隔离，并同步到你登录的设备。</p>
      </section>
      <section className="mt-5 rounded-3xl border border-stone-200 bg-white p-6">
        <h2 className="text-base font-semibold text-stone-900">关于事线</h2>
        <p className="mt-3 text-sm leading-7 text-stone-600">事线只记录一件事情已经发生的重要节点，不承担待办、日历或项目管理功能。</p>
      </section>
      <form action={signOut} className="mt-8">
        <button className="min-h-12 rounded-xl border border-stone-300 px-5 text-base font-medium text-stone-700 transition hover:bg-stone-100" type="submit">退出登录</button>
      </form>
      <BottomNav />
    </main>
  );
}
