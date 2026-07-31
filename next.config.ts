import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Files are uploaded directly to Supabase Storage, but the action also receives metadata.
    serverActions: {
      bodySizeLimit: "32mb",
    },
  },
};

export default nextConfig;
