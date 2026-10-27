/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@ricamo/ui", "@ricamo/supabase"],
  // Server Actions reciben imagenes (comprobantes de pago, fotos de
  // disenos, QR). El default de Next es 1MB, menos que una foto de celular;
  // 4MB queda por debajo del tope de ~4.5MB por request de Vercel. Las
  // imagenes mas pesadas se reducen en el navegador antes de enviarse
  // (lib/shrinkImage.ts).
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
