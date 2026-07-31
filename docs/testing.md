# 验收与测试清单

## 已完成的本地验证

在未配置真实 Supabase 凭据的环境中，已执行并通过：

```powershell
node .\node_modules\typescript\bin\tsc --noEmit
node .\node_modules\next\dist\bin\next build
```

生产构建包含登录、事件、节点、搜索、归档、我的页面、PWA Manifest 和 Proxy。

## Supabase 联调前准备

按文件名顺序在 Supabase SQL Editor 执行：

1. `supabase/migrations/202607300001_profiles.sql`
2. `supabase/migrations/202607300002_timeline_schema.sql`
3. `supabase/migrations/202607300003_search.sql`

将 `.env.example` 复制为 `.env.local`，填写项目 URL 与 Publishable Key，然后运行 `pnpm dev`。

## 手工验收

### 账号与权限

1. 注册账号 A，完成邮箱验证并登录。
2. 刷新页面，确认仍保持登录；退出后访问 `/events`，确认被带回登录页。
3. 注册账号 B；使用 B 直接访问 A 的事件 URL，应无法读取该事件。

### 事件与节点

1. 创建进行中、暂停、完成三种状态的事件，确认首页优先显示进行中事件。
2. 编辑事件的标题、日期、图标、标签与状态；归档后确认它只出现在归档页。
3. 为一个事件录入不同日期和时间的节点，测试两个排序方向与“只看重要节点”。
4. 对事件和节点执行删除，确认均出现两次确认提示。

### 附件与搜索

1. 上传 PNG/JPEG、PDF、TXT、DOCX 或 XLSX；确认每文件超过 5 MB 或不受支持的类型会被拦截。
2. 点击图片确认能打开大图，点击文件确认能下载，点击网页链接确认在新标签打开。
3. 搜索事件标题、描述、节点标题、正文和标签；依次测试状态、标签、日期与重要节点筛选。

### PWA 与安卓

1. 使用 HTTPS 部署地址在 Android Chrome 打开应用并登录。
2. 菜单中选择“添加到主屏幕”或“安装应用”。
3. 从桌面图标启动，确认独立窗口、图标和浅色主题正确。
4. 断网后重新打开已访问的应用壳，确认可显示基础页面；数据读取、登录与同步仍需要网络。
