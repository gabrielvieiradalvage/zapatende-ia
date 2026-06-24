import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * Imagens externas permitidas.
   * Supabase Storage (avatars/logos) e WhatsApp CDN (thumbnails de mídia).
   */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "mmg.whatsapp.net",
      },
    ],
  },

  /*
   * Headers de segurança aplicados a todas as rotas.
   */
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  /*
   * Redireciona a raiz para /overview quando autenticado.
   * O middleware cuida da proteção; aqui apenas atalha a URL.
   */
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/overview",
        permanent: true,
      },
    ];
  },

  /*
   * Variáveis de ambiente expostas ao cliente (prefixo NEXT_PUBLIC_).
   * Nunca coloque chaves secretas aqui.
   */
  env: {
    NEXT_PUBLIC_APP_NAME: "ZapAtende AI",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  },
};

export default nextConfig;