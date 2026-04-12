/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Handle Remotion's dependencies in the client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        child_process: false,
      };
    }

    // Allow importing video/audio files
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
    domains: ["localhost", "kkqzzdtdkrxdlfrllauy.supabase.co"],
  },
  experimental: {
    serverComponentsExternalPackages: ["@remotion/renderer"],
  },
};

module.exports = nextConfig;
