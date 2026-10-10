import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // 같은 Wi‑Fi의 iPad 등에서 개발 서버에 접속할 때: ALLOWED_DEV_ORIGINS=192.168.0.10 npm run dev -- -H 0.0.0.0
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(",").map((s) => s.trim()) ?? [],
};

export default nextConfig;
