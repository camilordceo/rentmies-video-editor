/** @type {import('next').NextConfig} */
const nextConfig = {
  // Excluir @remotion/renderer del bundle del servidor
  // (es demasiado pesado para Vercel serverless)
  serverExternalPackages: ["@remotion/renderer"],

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        child_process: false,
      };
    }

    // Permitir importar archivos de video/audio
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/,
      type: "asset/resource",
      generator: {
        filename: "static/media/[name].[hash][ext]",
      },
    });

    return config;
  },

  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

module.exports = nextConfig;
