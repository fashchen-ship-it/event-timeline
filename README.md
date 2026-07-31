# 事线

一个面向个人的事件时间线记录工具：记录事情已经发生的重要变化、结果、决定与关键节点。它不包含 Todo、日历、计时、AI 或协作功能。

## 技术栈

- Next.js + TypeScript + Tailwind CSS
- Supabase Auth、PostgreSQL、Storage、RLS
- PWA Manifest 与 Service Worker
- Vercel 部署

## 本地运行

先安装 Node.js LTS 与 pnpm，然后：

```powershell
cd D:\event-timeline
Copy-Item .env.example .env.local
pnpm install
pnpm dev
```

在 `.env.local` 中填写：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

打开 `http://localhost:3000`。

## Supabase 配置

1. 创建一个 Supabase 项目。
2. 按文件名顺序执行 `supabase/migrations` 下的三份 SQL 迁移。
3. 在 Authentication → URL Configuration 中设置：
   - Site URL：`http://localhost:3000`
   - Redirect URLs：`http://localhost:3000/auth/callback`
4. 部署后，将 Site URL 改为正式域名，并增加正式域名的 `/auth/callback`。

迁移会建立私有 `timeline-files` Storage bucket、允许的 MIME 类型、文件大小限制及 RLS 策略。不要在浏览器或 Git 仓库中暴露 `SUPABASE_SERVICE_ROLE_KEY`；当前版本不需要它。

## Vercel 部署

1. 将项目推送到 GitHub，或在 Vercel 导入 `D:\event-timeline`。
2. Framework Preset 选择 Next.js，构建命令保持默认 `pnpm build`。
3. 在 Vercel → Settings → Environment Variables 中配置：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_SITE_URL`（正式 HTTPS 地址）
4. 部署完成后，把正式地址添加到 Supabase 的 Site URL 与 Redirect URLs。
5. 使用安卓 Chrome 打开 HTTPS 地址，选择“添加到主屏幕”。

## 验证

```powershell
pnpm exec tsc --noEmit
pnpm build
```

完整的账号、RLS、附件、搜索和 Android PWA 验收清单见 [docs/testing.md](docs/testing.md)。
