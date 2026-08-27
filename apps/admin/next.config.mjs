/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ricamo/ui", "@ricamo/supabase"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
