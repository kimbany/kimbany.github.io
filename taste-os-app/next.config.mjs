/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // App Router view transitions for cinematic page dissolves
    viewTransition: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // user-owned memory images are served via short-lived Supabase signed URLs
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
