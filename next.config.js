/** @type {import('next').NextConfig} */

// Mapeo de aliases para Supabase env vars.
// La app necesita SI O SI las NEXT_PUBLIC_* en el bundle del cliente
// (auth, upload, storage corren en el browser). Pero algunos proyectos
// configuran Vercel con SUPABASE_URL/SUPABASE_ANON_KEY sin prefix.
// Acá resolvemos en orden de prioridad y la build inlinea el valor
// como NEXT_PUBLIC_* en el bundle del cliente.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Warning visible en logs de build; no rompe build pero alerta al deploy
  // eslint-disable-next-line no-console
  console.warn(
    '[next.config.js] WARNING: Supabase URL/ANON_KEY no resueltas. ' +
      'Definí NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY ' +
      '(o SUPABASE_URL + SUPABASE_ANON_KEY como aliases) en Vercel.'
  );
}

const nextConfig = {
  // Inlinea los valores de Supabase al bundle del cliente sin importar
  // bajo qué alias estén en Vercel.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
  },

  // Ignorar errores de TypeScript y ESLint durante el build
  // (los errores de tipos no bloquean el deploy)
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  experimental: {
    // Next.js 14 — la key correcta está bajo experimental
    serverComponentsExternalPackages: ["@remotion/renderer", "@remotion/cli"],
    // Server Actions: por si más adelante se usan para algo grande.
    // Los route handlers reales NO se ven afectados por esto en App Router;
    // los uploads de video van browser→Supabase directo (lib/upload.ts).
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },

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
