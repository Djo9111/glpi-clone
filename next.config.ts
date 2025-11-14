import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  eslint: {
    ignoreDuringBuilds: true, // Désactive ESLint pendant `npm run build`
  }, // ← Fin config ESLint (à retirer quand tu voudras réactiver les règles)
};

export default nextConfig;
