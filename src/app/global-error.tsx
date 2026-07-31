"use client";

export default function GlobalError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  return (
    <html lang="zh-CN">
      <body style={{ alignItems: "center", background: "#f7f6f2", color: "#292722", display: "flex", fontFamily: "system-ui, sans-serif", justifyContent: "center", margin: 0, minHeight: "100vh", padding: "24px" }}>
        <main style={{ background: "white", border: "1px solid #e7e5e4", borderRadius: "24px", maxWidth: "420px", padding: "32px", textAlign: "center", width: "100%" }}>
          <h1 style={{ fontSize: "22px", margin: 0 }}>应用暂时无法打开</h1>
          <p style={{ color: "#57534e", lineHeight: 1.7 }}>请刷新或稍后重试。</p>
          <button onClick={unstable_retry} style={{ background: "#292722", border: 0, borderRadius: "12px", color: "white", cursor: "pointer", fontSize: "16px", padding: "12px 20px" }} type="button">重试</button>
        </main>
      </body>
    </html>
  );
}
