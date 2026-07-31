import { createBrowserClient } from "@supabase/ssr";

/** Creates a browser client with only the publishable Supabase key. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase 尚未配置，请检查 .env.local 中的公开环境变量。");
  }

  return createBrowserClient(url, key);
}
